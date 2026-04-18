import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

export const useCustomerCompletionCheck = (notificationCenter) => {
  const { notifications, markAsRead, recordNotificationForRecipient, loadNotifications } =
    notificationCenter

  const showCustomerReviewDialog = ref(false)
  const customerReviewTarget = ref(null)
  const customerReviewStars = ref(0)
  const customerReviewText = ref('')
  const customerReviewSubmitting = ref(false)
  const customerReviewNotifIndex = ref(null)

  // Completion-check popup state
  const showCompletionCheckDialog = ref(false)
  const completionCheckTarget = ref(null)
  const completionCheckQueue = ref([])

  // Still-going-check popup state
  const showStillGoingCheckDialog = ref(false)
  const stillGoingCheckTarget = ref(null)
  const stillGoingCheckQueue = ref([])

  // Queue helper: show next completion-check popup
  const showNextCompletionCheck = () => {
    if (completionCheckQueue.value.length > 0) {
      completionCheckTarget.value = completionCheckQueue.value.shift()
      showCompletionCheckDialog.value = true
    }
  }

  // Queue helper: show next still-going-check popup
  const showNextStillGoingCheck = () => {
    if (stillGoingCheckQueue.value.length > 0) {
      stillGoingCheckTarget.value = stillGoingCheckQueue.value.shift()
      showStillGoingCheckDialog.value = true
    }
  }

  // Auto-show completion-check popup
  const promptCompletionCheck = (notif, index) => {
    const item = {
      notif,
      index,
      request_id: notif.payload?.requestId || notif.requestId,
      technician_id: notif.payload?.technicianId,
      user_id: notif.payload?.userId,
    }
    if (showCompletionCheckDialog.value) {
      if (completionCheckTarget.value?.request_id === item.request_id) return
      if (completionCheckQueue.value.some((q) => q.request_id === item.request_id)) return
      completionCheckQueue.value.push(item)
    } else {
      completionCheckTarget.value = item
      showCompletionCheckDialog.value = true
    }
  }

  // Auto-show still-going-check popup
  const promptStillGoingCheck = (notif, index) => {
    const item = {
      notif,
      index,
      request_id: notif.payload?.requestId || notif.requestId,
      technician_id: notif.payload?.technicianId,
      user_id: notif.payload?.userId,
    }
    if (showStillGoingCheckDialog.value) {
      if (stillGoingCheckTarget.value?.request_id === item.request_id) return
      if (stillGoingCheckQueue.value.some((q) => q.request_id === item.request_id)) return
      stillGoingCheckQueue.value.push(item)
    } else {
      stillGoingCheckTarget.value = item
      showStillGoingCheckDialog.value = true
    }
  }

  // Scan notifications for unhandled completion/still-going checks and auto-show popups
  const autoShowPendingChecks = async () => {
    // Collect request IDs to verify they're still on-going
    const candidateNotifs = []
    for (let i = 0; i < notifications.value.length; i++) {
      const notif = notifications.value[i]
      if (notif.done || notif.read) continue
      if (notif.type === 'completion-check' || notif.type === 'still-going-check') {
        candidateNotifs.push({ notif, index: i })
      }
    }
    if (!candidateNotifs.length) return

    // Get unique request IDs and check their actual status
    const requestIds = [
      ...new Set(
        candidateNotifs.map((c) => c.notif.payload?.requestId || c.notif.requestId).filter(Boolean),
      ),
    ]

    let completedIds = new Set()
    if (requestIds.length) {
      const { data } = await supabase
        .from('request')
        .select('request_id, request_status')
        .in('request_id', requestIds)
      if (data) {
        for (const r of data) {
          const st = (r.request_status || '').toLowerCase()
          if (st === 'completed' || st === 'cancelled') {
            completedIds.add(r.request_id)
          }
        }
      }
    }

    for (const { notif, index } of candidateNotifs) {
      const rid = notif.payload?.requestId || notif.requestId
      if (rid && completedIds.has(Number(rid))) {
        // Request already completed — mark notification as read silently
        markAsRead(index)
        continue
      }
      if (notif.type === 'completion-check') {
        promptCompletionCheck(notif, index)
      } else if (notif.type === 'still-going-check') {
        promptStillGoingCheck(notif, index)
      }
    }
  }

  // Customer clicks Yes on "Has the request been completed?" (from popup)
  const handleCompletionYes = (notifOrTarget, index) => {
    const notif = notifOrTarget?.notif || notifOrTarget
    const idx = notifOrTarget?.index ?? index
    if (idx != null) markAsRead(idx)
    showCompletionCheckDialog.value = false
    customerReviewTarget.value = {
      request_id: notif?.payload?.requestId || notif?.requestId || notifOrTarget?.request_id,
      technician_id: notif?.payload?.technicianId || notifOrTarget?.technician_id,
      user_id: notif?.payload?.userId || notifOrTarget?.user_id,
    }
    customerReviewNotifIndex.value = idx
    customerReviewStars.value = 0
    customerReviewText.value = ''
    showCustomerReviewDialog.value = true
    showNextCompletionCheck()
  }

  // Customer clicks No on "Has the request been completed?" (from popup)
  const handleCompletionNo = async (notifOrTarget, index) => {
    const notif = notifOrTarget?.notif || notifOrTarget
    const idx = notifOrTarget?.index ?? index
    if (idx != null) markAsRead(idx)
    if (idx != null && notifications.value[idx]) {
      notifications.value[idx].done = true
    }
    showCompletionCheckDialog.value = false

    // Look up customer email from the request
    const requestId = notif?.payload?.requestId || notif?.requestId || notifOrTarget?.request_id
    const userId = notif?.payload?.userId || notifOrTarget?.user_id
    if (!userId) {
      showNextCompletionCheck()
      return
    }

    const { data: customerRow } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', userId)
      .maybeSingle()
    const customerEmail = customerRow?.email
    if (!customerEmail) {
      showNextCompletionCheck()
      return
    }

    // Send "Is the request still going?" notification
    await recordNotificationForRecipient(customerEmail, {
      title: 'Request Status',
      message: `Is request #${requestId} still going?`,
      requestId: requestId,
      routePath: '/orders',
      type: 'still-going-check',
      icon: 'update',
      payload: {
        requestId: requestId,
        technicianId: notif?.payload?.technicianId || notifOrTarget?.technician_id,
        userId: userId,
        type: 'still-going-check',
      },
    })
    showNextCompletionCheck()
  }

  // Customer clicks Yes on "Is the request still going?" — re-send same notification
  const handleStillGoingYes = async (notifOrTarget, index) => {
    const notif = notifOrTarget?.notif || notifOrTarget
    const idx = notifOrTarget?.index ?? index
    if (idx != null) markAsRead(idx)
    if (idx != null && notifications.value[idx]) {
      notifications.value[idx].done = true
    }
    showStillGoingCheckDialog.value = false

    const requestId = notif?.payload?.requestId || notif?.requestId || notifOrTarget?.request_id
    const userId = notif?.payload?.userId || notifOrTarget?.user_id
    if (!userId) {
      showNextStillGoingCheck()
      return
    }

    const { data: customerRow } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', userId)
      .maybeSingle()
    const customerEmail = customerRow?.email
    if (!customerEmail) {
      showNextStillGoingCheck()
      return
    }

    // Re-send "Is the request still going?" notification
    await recordNotificationForRecipient(customerEmail, {
      title: 'Request Status',
      message: `Is request #${requestId} still going?`,
      requestId: requestId,
      routePath: '/orders',
      type: 'still-going-check',
      icon: 'update',
      payload: {
        requestId: requestId,
        technicianId: notif?.payload?.technicianId || notifOrTarget?.technician_id,
        userId: userId,
        type: 'still-going-check',
      },
    })
    showNextStillGoingCheck()
  }

  // Customer clicks No on "Is the request still going?" — means it's done → review popup
  const handleStillGoingNo = (notifOrTarget, index) => {
    const notif = notifOrTarget?.notif || notifOrTarget
    const idx = notifOrTarget?.index ?? index
    if (idx != null) markAsRead(idx)
    if (idx != null && notifications.value[idx]) {
      notifications.value[idx].done = true
    }
    showStillGoingCheckDialog.value = false
    customerReviewTarget.value = {
      request_id: notif?.payload?.requestId || notif?.requestId || notifOrTarget?.request_id,
      technician_id: notif?.payload?.technicianId || notifOrTarget?.technician_id,
      user_id: notif?.payload?.userId || notifOrTarget?.user_id,
    }
    customerReviewNotifIndex.value = idx
    customerReviewStars.value = 0
    customerReviewText.value = ''
    showCustomerReviewDialog.value = true
    showNextStillGoingCheck()
  }

  // Submit customer review and mark request as completed
  const submitCustomerReview = async (skip = false) => {
    if (!customerReviewTarget.value) return
    customerReviewSubmitting.value = true

    const requestId = customerReviewTarget.value.request_id
    const technicianId = customerReviewTarget.value.technician_id
    const userId = customerReviewTarget.value.user_id

    // Mark request as completed
    await supabase
      .from('request')
      .update({ request_status: 'completed' })
      .eq('request_id', requestId)

    if (!skip && customerReviewStars.value > 0) {
      const customerRatingData = {
        customer_rating: customerReviewStars.value,
        customer_text: customerReviewText.value.trim() || null,
        customer_timestamp: new Date().toISOString(),
      }

      // Check if a rating row already exists (technician may have already rated)
      const { data: existingRating } = await supabase
        .from('rating')
        .select('review_id')
        .eq('request_id', requestId)
        .maybeSingle()

      let ratingError
      if (existingRating) {
        const { error } = await supabase
          .from('rating')
          .update(customerRatingData)
          .eq('request_id', requestId)
        ratingError = error
      } else {
        const { error } = await supabase.from('rating').insert({
          request_id: requestId,
          technician_id: technicianId,
          user_id: userId,
          ...customerRatingData,
        })
        ratingError = error
      }

      if (ratingError) {
        console.error('Customer rating save failed:', ratingError)
      }
    }

    // Mark notification as done
    if (
      customerReviewNotifIndex.value !== null &&
      notifications.value[customerReviewNotifIndex.value]
    ) {
      notifications.value[customerReviewNotifIndex.value].done = true
    }

    customerReviewSubmitting.value = false
    showCustomerReviewDialog.value = false
    customerReviewTarget.value = null
    customerReviewNotifIndex.value = null

    await loadNotifications()

    return true
  }

  // Handle notification click for completion-related types
  const handleCompletionNotifClick = (notif, index) => {
    if (notif.type === 'completion-check') {
      promptCompletionCheck(notif, index)
      return true // handled
    }
    if (notif.type === 'still-going-check') {
      promptStillGoingCheck(notif, index)
      return true // handled
    }
    return false // not handled
  }

  return {
    showCustomerReviewDialog,
    customerReviewTarget,
    customerReviewStars,
    customerReviewText,
    customerReviewSubmitting,
    showCompletionCheckDialog,
    completionCheckTarget,
    showStillGoingCheckDialog,
    stillGoingCheckTarget,
    handleCompletionYes,
    handleCompletionNo,
    handleStillGoingYes,
    handleStillGoingNo,
    submitCustomerReview,
    handleCompletionNotifClick,
    autoShowPendingChecks,
  }
}
