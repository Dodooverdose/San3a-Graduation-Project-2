import { computed, onScopeDispose, ref } from 'vue'
import { supabase } from 'src/boot/supabase'

const formatTime = (dateValue) => {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const normalizeNotification = (row) => ({
  id: row.id,
  title: row.title,
  fixerName: row.title,
  message: row.message,
  time: formatTime(row.created_at),
  read: !!row.is_read,
  requestId: row.request_id,
  routePath: row.route_path,
  icon: row.icon || 'notifications',
  type: row.notification_type || 'general',
  payload: row.payload || {},
  createdAt: row.created_at,
})

export const useNotificationCenter = () => {
  const recipientEmail = ref('')
  const notifications = ref([])
  const loadingNotifications = ref(false)
  const dbSubscriptionChannel = ref(null)

  const unreadCount = computed(() => notifications.value.filter((item) => !item.read).length)

  const upsertNotification = (row) => {
    const mapped = normalizeNotification(row)
    const existingIndex = notifications.value.findIndex((item) => item.id === mapped.id)

    if (existingIndex === -1) {
      notifications.value.unshift(mapped)
      return mapped
    }

    notifications.value[existingIndex] = {
      ...notifications.value[existingIndex],
      ...mapped,
    }

    return notifications.value[existingIndex]
  }

  const stopRealtime = async () => {
    if (!dbSubscriptionChannel.value) return

    const channel = dbSubscriptionChannel.value
    dbSubscriptionChannel.value = null
    await supabase.removeChannel(channel)
  }

  const startRealtime = async () => {
    if (!recipientEmail.value) return

    await stopRealtime()

    dbSubscriptionChannel.value = supabase
      .channel(`notification-center-${recipientEmail.value}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_center',
          filter: `recipient_email=eq.${recipientEmail.value}`,
        },
        ({ new: inserted }) => {
          if (!inserted) return
          upsertNotification(inserted)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification_center',
          filter: `recipient_email=eq.${recipientEmail.value}`,
        },
        ({ new: updated }) => {
          if (!updated) return
          upsertNotification(updated)
        },
      )
      .subscribe()
  }

  const setRecipientEmail = (email) => {
    const normalizedEmail = String(email || '')
      .trim()
      .toLowerCase()

    if (!normalizedEmail) {
      recipientEmail.value = ''
      notifications.value = []
      void stopRealtime()
      return
    }

    if (recipientEmail.value === normalizedEmail) return

    recipientEmail.value = normalizedEmail
    void startRealtime()
  }

  const loadNotifications = async () => {
    if (!recipientEmail.value) {
      notifications.value = []
      return []
    }

    loadingNotifications.value = true
    try {
      const { data, error } = await supabase
        .from('notification_center')
        .select('*')
        .ilike('recipient_email', recipientEmail.value)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      notifications.value = (data || []).map(normalizeNotification)
      return notifications.value
    } finally {
      loadingNotifications.value = false
    }
  }

  const recordNotificationForRecipient = async (email, notification) => {
    if (!email) return null

    const normalizedRecipientEmail = String(email).trim().toLowerCase()
    if (!normalizedRecipientEmail) return null

    const payload = {
      recipient_email: normalizedRecipientEmail,
      title: notification.title || notification.fixerName || 'Notification',
      message: notification.message || '',
      request_id: notification.requestId ? String(notification.requestId) : null,
      route_path: notification.routePath || null,
      notification_type: notification.type || 'general',
      icon: notification.icon || null,
      payload: notification.payload || {},
      is_read: !!notification.read,
      read_at: notification.read ? new Date().toISOString() : null,
    }

    try {
      const { error } = await supabase.from('notification_center').insert(payload)

      if (error) {
        console.warn('Notification persistence failed:', error)
        return null
      }

      const mapped = {
        id: null,
        title: payload.title,
        fixerName: payload.title,
        message: payload.message,
        time: formatTime(new Date().toISOString()),
        read: payload.is_read,
        requestId: payload.request_id,
        routePath: payload.route_path,
        icon: payload.icon || 'notifications',
        type: payload.notification_type || 'general',
        payload: payload.payload || {},
        createdAt: new Date().toISOString(),
      }

      if (normalizedRecipientEmail === recipientEmail.value) {
        notifications.value.unshift({
          ...mapped,
          id: `local-${Date.now()}`,
        })
        void loadNotifications()
      }

      return mapped
    } catch (error) {
      console.warn('Notification persistence failed:', error)
      return null
    }
  }

  const recordNotification = async (notification) => {
    return recordNotificationForRecipient(recipientEmail.value, notification)
  }

  const markAsRead = async (index) => {
    const notification = notifications.value[index]
    if (!notification) return

    notifications.value[index].read = true

    if (!recipientEmail.value || !notification.id) return

    const { error } = await supabase
      .from('notification_center')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notification.id)
      .ilike('recipient_email', recipientEmail.value)

    if (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    notifications.value = notifications.value.map((notification) => ({
      ...notification,
      read: true,
    }))

    if (!recipientEmail.value) return

    const { error } = await supabase
      .from('notification_center')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .ilike('recipient_email', recipientEmail.value)
      .eq('is_read', false)

    if (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  onScopeDispose(() => {
    void stopRealtime()
  })

  return {
    notifications,
    unreadCount,
    loadingNotifications,
    setRecipientEmail,
    loadNotifications,
    recordNotification,
    recordNotificationForRecipient,
    markAsRead,
    markAllAsRead,
  }
}
