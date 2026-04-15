import { ref, onScopeDispose } from 'vue'
import { supabase } from 'src/boot/supabase'

/**
 * Composable for appointment arrival checking.
 *
 * Customer side: checks for accepted requests where schedule_time has arrived,
 * prompts "Did the technician arrive?", handles Yes (status → on-going) and
 * No (notify technician for ETA).
 *
 * Technician side: listens for arrival-check broadcasts, shows ETA picker,
 * sends ETA back to customer.
 */
export const useArrivalCheck = () => {
  // ── Customer-side state ──
  const arrivalCheckRequest = ref(null)
  const showArrivalDialog = ref(false)
  const showEtaMessage = ref(false)
  const etaMinutes = ref(null)
  const etaRequestId = ref(null)
  const etaSecondsLeft = ref(0)
  let etaCountdownTimer = null

  // ── Technician-side state ──
  const showEtaDialog = ref(false)
  const etaDialogRequest = ref(null)
  const selectedEta = ref(null)

  // ── Internal ──
  let checkInterval = null
  let etaChannel = null
  let arrivalCheckChannel = null
  const prompted = new Set(
    JSON.parse(localStorage.getItem('san3a_arrival_prompted') || '[]').map(Number),
  )

  const savePrompted = () => {
    localStorage.setItem('san3a_arrival_prompted', JSON.stringify([...prompted]))
  }

  // ── helpers ──
  const waitForSubscribed = (channel) =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Channel subscription timed out')), 5000)
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout)
          resolve()
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          clearTimeout(timeout)
          reject(new Error(`Channel subscription failed: ${status}`))
        }
      })
    })

  const insertNotification = async (email, notification) => {
    if (!email) return false
    const { error } = await supabase.from('notification_center').insert({
      recipient_email: String(email).trim().toLowerCase(),
      title: notification.title || 'Notification',
      message: notification.message || '',
      request_id: notification.requestId ? String(notification.requestId) : null,
      route_path: notification.routePath || null,
      notification_type: notification.type || 'general',
      icon: notification.icon || null,
      payload: notification.payload || {},
      is_read: false,
    })
    if (error) {
      console.warn('Arrival notification insert failed:', error)
      return false
    }
    return true
  }

  // ═══════════════════════════════════════════
  //  CUSTOMER — check for due appointments
  // ═══════════════════════════════════════════

  const ensureArrivalNotification = async (req) => {
    // Look up customer email to persist a notification
    const { data: customerRow } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', req.user_id)
      .maybeSingle()
    const email = customerRow?.email?.trim().toLowerCase()
    if (!email) return

    // Check if an arrival-check notification already exists for this request
    const { data: existing } = await supabase
      .from('notification_center')
      .select('id')
      .eq('recipient_email', email)
      .eq('notification_type', 'arrival-check-customer')
      .eq('request_id', String(req.request_id))
      .limit(1)

    if (existing?.length) return // already persisted

    await insertNotification(email, {
      title: 'Appointment Check',
      message: `Did the technician arrive for request #${req.request_id}?`,
      requestId: req.request_id,
      routePath: `/incoming-offers?requestId=${req.request_id}`,
      type: 'arrival-check-customer',
      icon: 'person_pin_circle',
      payload: {
        requestId: req.request_id,
        type: 'arrival-check-customer',
      },
    })
  }

  const toLocalISOString = (date) => {
    const pad = (n) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const checkForArrivals = async (customerUserId) => {
    if (!customerUserId || showArrivalDialog.value) return

    // Use local time (no timezone) to match how schedule_time is stored
    const now = toLocalISOString(new Date())

    const { data } = await supabase
      .from('request')
      .select(
        'request_id, schedule_time, technician_id, user_id, service_type, description_of_issue',
      )
      .eq('user_id', customerUserId)
      .eq('request_status', 'accepted')
      .not('schedule_time', 'is', null)
      .not('technician_id', 'is', null)
      .lte('schedule_time', now)
      .order('schedule_time', { ascending: true })

    if (!data?.length) return

    // Persist a notification for every due appointment (idempotent)
    for (const req of data) {
      ensureArrivalNotification(req).catch(() => {})
    }

    // Show dialog for the first un-prompted request
    const unprompted = data.find((r) => !prompted.has(r.request_id))
    if (!unprompted) return

    arrivalCheckRequest.value = unprompted
    showArrivalDialog.value = true
  }

  // Customer pressed "Yes" — technician arrived
  const confirmArrival = async (request) => {
    if (!request) return
    const { error } = await supabase
      .from('request')
      .update({ request_status: 'on-going' })
      .eq('request_id', request.request_id)

    // Notify the technician: "Has the request been finished?"
    if (request.technician_id) {
      const { data: tech } = await supabase
        .from('technician')
        .select('email')
        .eq('technician_id', request.technician_id)
        .maybeSingle()
      const techEmail = tech?.email

      if (techEmail) {
        await insertNotification(techEmail, {
          title: 'Job Status',
          message: `Has the request #${request.request_id} been finished?`,
          requestId: request.request_id,
          routePath: '/service-provider?tab=orders',
          type: 'job-finished',
          icon: 'task_alt',
          payload: {
            requestId: request.request_id,
            userId: request.user_id,
            type: 'job-finished',
          },
        })
      }

      // Real-time broadcast to technician
      const channel = supabase.channel(`job-ongoing-${request.technician_id}`)
      try {
        await waitForSubscribed(channel)
        await channel.send({
          type: 'broadcast',
          event: 'job-ongoing',
          payload: {
            requestId: request.request_id,
            userId: request.user_id,
          },
        })
      } catch (e) {
        console.warn('Job ongoing broadcast failed:', e)
      } finally {
        supabase.removeChannel(channel)
      }
    }

    prompted.add(request.request_id)
    savePrompted()
    showArrivalDialog.value = false
    arrivalCheckRequest.value = null
    return { error }
  }

  // Customer pressed "No" — notify technician
  const reportNoArrival = async (request) => {
    if (!request) return

    // Look up technician email
    let techEmail = null
    if (request.technician_id) {
      const { data: tech } = await supabase
        .from('technician')
        .select('email')
        .eq('technician_id', request.technician_id)
        .maybeSingle()
      techEmail = tech?.email
    }

    // Persist notification for technician
    if (techEmail) {
      await insertNotification(techEmail, {
        title: 'Arrival Check',
        message: `Customer reports you haven't arrived for request #${request.request_id}. How much time do you need?`,
        requestId: request.request_id,
        routePath: '/service-provider?tab=orders',
        type: 'arrival-check',
        icon: 'schedule',
        payload: {
          requestId: request.request_id,
          customerId: request.user_id,
          type: 'arrival-check',
        },
      })
    }

    // Real-time broadcast to technician
    if (request.technician_id) {
      const channel = supabase.channel(`arrival-check-${request.technician_id}`)
      try {
        await waitForSubscribed(channel)
        await channel.send({
          type: 'broadcast',
          event: 'arrival-check',
          payload: {
            requestId: request.request_id,
            customerId: request.user_id,
          },
        })
      } catch (e) {
        console.warn('Arrival-check broadcast failed:', e)
      } finally {
        supabase.removeChannel(channel)
      }
    }

    prompted.add(request.request_id)
    savePrompted()
    showArrivalDialog.value = false
    arrivalCheckRequest.value = null
  }

  // Customer: listen for ETA responses from technician
  const listenForEta = (customerUserId) => {
    if (!customerUserId) return
    etaChannel = supabase
      .channel(`arrival-eta-${customerUserId}`)
      .on('broadcast', { event: 'eta-response' }, ({ payload }) => {
        if (!payload) return
        etaMinutes.value = payload.minutes
        etaRequestId.value = payload.requestId
        startEtaCountdown(payload.minutes, payload.requestId, customerUserId)
        showEtaMessage.value = true
      })
      .subscribe()
  }

  // Fires when the ETA countdown reaches zero
  const handleEtaExpired = async (requestId, customerUserId) => {
    showEtaMessage.value = false

    // Allow re-prompting for this request
    prompted.delete(Number(requestId))
    savePrompted()

    // Persist a follow-up notification for the customer
    try {
      if (customerUserId) {
        const { data: customerRow } = await supabase
          .from('users')
          .select('email')
          .eq('user_id', customerUserId)
          .maybeSingle()
        const email = customerRow?.email?.trim()?.toLowerCase()
        if (email) {
          await insertNotification(email, {
            title: 'Technician ETA',
            message: `ETA expired for request #${requestId}. Did the technician arrive?`,
            requestId,
            routePath: `/incoming-offers?requestId=${requestId}`,
            type: 'eta-expired',
            icon: 'person_pin_circle',
            payload: { requestId, type: 'arrival-check-followup' },
          })
        }
      }
    } catch (e) {
      console.warn('Follow-up notification failed:', e)
    }

    // Show arrival dialog for this request
    try {
      const { data: req } = await supabase
        .from('request')
        .select(
          'request_id, schedule_time, technician_id, user_id, service_type, description_of_issue, request_status',
        )
        .eq('request_id', requestId)
        .maybeSingle()

      const st = req?.request_status?.toLowerCase()
      if (req && st !== 'on-going' && st !== 'completed' && st !== 'cancelled') {
        arrivalCheckRequest.value = req
        showArrivalDialog.value = true
      } else {
        await checkForArrivals(customerUserId)
      }
    } catch (e) {
      console.warn('Post-ETA arrival check failed:', e)
      await checkForArrivals(customerUserId)
    }
  }

  // Start countdown timer for ETA, re-prompt when it reaches 0
  const startEtaCountdown = (minutes, requestId, customerUserId) => {
    if (etaCountdownTimer) {
      clearInterval(etaCountdownTimer)
      etaCountdownTimer = null
    }
    etaSecondsLeft.value = minutes * 60

    etaCountdownTimer = setInterval(() => {
      etaSecondsLeft.value--
      if (etaSecondsLeft.value <= 0) {
        clearInterval(etaCountdownTimer)
        etaCountdownTimer = null
        // Fire the async handler outside the interval
        handleEtaExpired(requestId, customerUserId)
      }
    }, 1000)
  }

  // Restore ETA countdowns from persisted notifications (survives page refresh)
  const restoreEtaCountdowns = async (customerUserId) => {
    if (!customerUserId) return
    try {
      const { data: customerRow } = await supabase
        .from('users')
        .select('email')
        .eq('user_id', customerUserId)
        .maybeSingle()
      const email = customerRow?.email?.trim()?.toLowerCase()
      if (!email) return

      // Find all eta-response notifications for this customer, grouped by request
      // We only care about the latest eta-response per request
      const { data: etaNotifs } = await supabase
        .from('notification_center')
        .select('*')
        .eq('recipient_email', email)
        .eq('notification_type', 'eta-response')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!etaNotifs?.length) return

      // Deduplicate: keep only the most recent eta-response per request_id
      const seen = new Set()
      const latestPerRequest = []
      for (const notif of etaNotifs) {
        const rid = notif.request_id || notif.payload?.requestId
        if (!rid || seen.has(String(rid))) continue
        seen.add(String(rid))
        latestPerRequest.push(notif)
      }

      for (const notif of latestPerRequest) {
        const etaEndTime = notif.payload?.etaEndTime
        const requestId = notif.request_id || notif.payload?.requestId
        if (!etaEndTime || !requestId) continue

        const endMs = new Date(etaEndTime).getTime()
        const remainingMs = endMs - Date.now()

        // Only skip if a follow-up notification was created AFTER this eta-response
        const { data: existingFollowup } = await supabase
          .from('notification_center')
          .select('id')
          .eq('recipient_email', email)
          .eq('notification_type', 'eta-expired')
          .eq('request_id', String(requestId))
          .gt('created_at', notif.created_at)
          .limit(1)

        if (existingFollowup?.length) continue // this specific ETA round was already handled

        if (remainingMs <= 0) {
          // ETA already expired — fire the handler immediately
          handleEtaExpired(requestId, customerUserId)
        } else if (!etaCountdownTimer) {
          // ETA still running — restore the countdown with remaining time
          const remainingSec = Math.ceil(remainingMs / 1000)
          etaRequestId.value = requestId
          etaSecondsLeft.value = remainingSec
          showEtaMessage.value = true
          etaCountdownTimer = setInterval(() => {
            etaSecondsLeft.value--
            if (etaSecondsLeft.value <= 0) {
              clearInterval(etaCountdownTimer)
              etaCountdownTimer = null
              handleEtaExpired(requestId, customerUserId)
            }
          }, 1000)
        }
      }
    } catch (e) {
      console.warn('Failed to restore ETA countdowns:', e)
    }
  }

  // Customer: start periodic checks + ETA listener
  const startCustomerChecks = (customerUserId) => {
    if (!customerUserId) return
    checkForArrivals(customerUserId)
    checkInterval = setInterval(() => checkForArrivals(customerUserId), 60_000)
    listenForEta(customerUserId)
    restoreEtaCountdowns(customerUserId)
  }

  // ═══════════════════════════════════════════
  //  TECHNICIAN — respond with ETA
  // ═══════════════════════════════════════════

  const listenForArrivalChecks = (technicianId) => {
    if (!technicianId) return
    arrivalCheckChannel = supabase
      .channel(`arrival-check-${technicianId}`)
      .on('broadcast', { event: 'arrival-check' }, ({ payload }) => {
        if (!payload) return
        etaDialogRequest.value = {
          requestId: payload.requestId,
          customerId: payload.customerId,
        }
        selectedEta.value = null
        showEtaDialog.value = true
      })
      .subscribe()
  }

  // Technician submits ETA
  const submitEta = async (minutes, requestData) => {
    if (!requestData) return

    // Look up customer email
    let customerEmail = null
    if (requestData.customerId) {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('user_id', requestData.customerId)
        .maybeSingle()
      customerEmail = user?.email
    }

    // Persist notification for customer
    const etaEndTime = new Date(Date.now() + minutes * 60 * 1000).toISOString()
    if (customerEmail) {
      await insertNotification(customerEmail, {
        title: 'Technician ETA',
        message: `The time left is ${minutes} minutes for request #${requestData.requestId}.`,
        requestId: requestData.requestId,
        routePath: `/incoming-offers?requestId=${requestData.requestId}`,
        type: 'eta-response',
        icon: 'schedule',
        payload: { requestId: requestData.requestId, minutes, etaEndTime },
      })
    }

    // Real-time broadcast to customer
    if (requestData.customerId) {
      const channel = supabase.channel(`arrival-eta-${requestData.customerId}`)
      try {
        await waitForSubscribed(channel)
        await channel.send({
          type: 'broadcast',
          event: 'eta-response',
          payload: {
            requestId: requestData.requestId,
            minutes,
          },
        })
      } catch (e) {
        console.warn('ETA broadcast failed:', e)
      } finally {
        supabase.removeChannel(channel)
      }
    }

    showEtaDialog.value = false
    etaDialogRequest.value = null
  }

  // ── Cleanup ──
  const cleanup = () => {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
    if (etaCountdownTimer) {
      clearInterval(etaCountdownTimer)
      etaCountdownTimer = null
    }
    etaChannel?.unsubscribe()
    arrivalCheckChannel?.unsubscribe()
  }

  onScopeDispose(cleanup)

  return {
    // Customer
    arrivalCheckRequest,
    showArrivalDialog,
    showEtaMessage,
    etaMinutes,
    etaRequestId,
    etaSecondsLeft,
    confirmArrival,
    reportNoArrival,
    startCustomerChecks,

    // Technician
    showEtaDialog,
    etaDialogRequest,
    selectedEta,
    listenForArrivalChecks,
    submitEta,

    cleanup,
  }
}
