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

  // Customer clicks Yes on "Has the request been completed?"
  const handleCompletionYes = (notif, index) => {
    markAsRead(index)
    customerReviewTarget.value = {
      request_id: notif.payload?.requestId || notif.requestId,
      technician_id: notif.payload?.technicianId,
      user_id: notif.payload?.userId,
    }
    customerReviewNotifIndex.value = index
    customerReviewStars.value = 0
    customerReviewText.value = ''
    showCustomerReviewDialog.value = true
  }

  // Customer clicks No on "Has the request been completed?"
  const handleCompletionNo = async (notif, index) => {
    markAsRead(index)
    if (notifications.value[index]) {
      notifications.value[index].done = true
    }

    // Look up customer email from the request
    const requestId = notif.payload?.requestId || notif.requestId
    const userId = notif.payload?.userId
    if (!userId) return

    const { data: customerRow } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', userId)
      .maybeSingle()
    const customerEmail = customerRow?.email
    if (!customerEmail) return

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
        technicianId: notif.payload?.technicianId,
        userId: userId,
        type: 'still-going-check',
      },
    })
  }

  // Customer clicks Yes on "Is the request still going?" — re-send same notification
  const handleStillGoingYes = async (notif, index) => {
    markAsRead(index)
    if (notifications.value[index]) {
      notifications.value[index].done = true
    }

    const requestId = notif.payload?.requestId || notif.requestId
    const userId = notif.payload?.userId
    if (!userId) return

    const { data: customerRow } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', userId)
      .maybeSingle()
    const customerEmail = customerRow?.email
    if (!customerEmail) return

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
        technicianId: notif.payload?.technicianId,
        userId: userId,
        type: 'still-going-check',
      },
    })
  }

  // Customer clicks No on "Is the request still going?" — means it's done → review popup
  const handleStillGoingNo = (notif, index) => {
    markAsRead(index)
    if (notifications.value[index]) {
      notifications.value[index].done = true
    }
    customerReviewTarget.value = {
      request_id: notif.payload?.requestId || notif.requestId,
      technician_id: notif.payload?.technicianId,
      user_id: notif.payload?.userId,
    }
    customerReviewNotifIndex.value = index
    customerReviewStars.value = 0
    customerReviewText.value = ''
    showCustomerReviewDialog.value = true
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
    if (notif.type === 'completion-check' || notif.type === 'still-going-check') {
      markAsRead(index)
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
    handleCompletionYes,
    handleCompletionNo,
    handleStillGoingYes,
    handleStillGoingNo,
    submitCustomerReview,
    handleCompletionNotifClick,
  }
}
