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
  const prompted = new Set(JSON.parse(localStorage.getItem('san3a_arrival_prompted') || '[]'))

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
    if (!email) return
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
    if (error) console.warn('Arrival notification insert failed:', error)
  }

  // ═══════════════════════════════════════════
  //  CUSTOMER — check for due appointments
  // ═══════════════════════════════════════════

  const checkForArrivals = async (customerUserId) => {
    if (!customerUserId || showArrivalDialog.value) return

    const now = new Date().toISOString()

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
      .limit(1)

    if (!data?.length) return
    const req = data[0]
    if (prompted.has(req.request_id)) return

    arrivalCheckRequest.value = req
    showArrivalDialog.value = true
  }

  // Customer pressed "Yes" — technician arrived
  const confirmArrival = async (request) => {
    if (!request) return
    const { error } = await supabase
      .from('request')
      .update({ request_status: 'on-going' })
      .eq('request_id', request.request_id)

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
        showEtaMessage.value = false

        // Allow re-prompting for this request
        prompted.delete(Number(requestId))
        savePrompted()

        // Re-trigger arrival check
        checkForArrivals(customerUserId)
      }
    }, 1000)
  }

  // Customer: start periodic checks + ETA listener
  const startCustomerChecks = (customerUserId) => {
    if (!customerUserId) return
    checkForArrivals(customerUserId)
    checkInterval = setInterval(() => checkForArrivals(customerUserId), 60_000)
    listenForEta(customerUserId)
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
    if (customerEmail) {
      await insertNotification(customerEmail, {
        title: 'Technician ETA',
        message: `The time left is ${minutes} minutes for request #${requestData.requestId}.`,
        requestId: requestData.requestId,
        type: 'eta-response',
        icon: 'schedule',
        payload: { requestId: requestData.requestId, minutes },
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
