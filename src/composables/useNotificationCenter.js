import { computed, ref } from 'vue'
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

  const unreadCount = computed(() => notifications.value.filter((item) => !item.read).length)

  const setRecipientEmail = (email) => {
    recipientEmail.value = email || ''
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
        .eq('recipient_email', recipientEmail.value)
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

    const payload = {
      recipient_email: email,
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
      const { data, error } = await supabase.rpc('create_notification_center_entry', {
        recipient_email_input: payload.recipient_email,
        title_input: payload.title,
        message_input: payload.message,
        request_id_input: payload.request_id,
        route_path_input: payload.route_path,
        notification_type_input: payload.notification_type,
        icon_input: payload.icon,
        payload_input: payload.payload,
        is_read_input: payload.is_read,
        read_at_input: payload.read_at,
      })

      if (error) {
        if (error.code === 'PGRST202') {
          console.warn(
            'Notification RPC is not available yet. Apply the migration and reload the Supabase schema cache.',
          )
          return null
        }

        console.warn('Notification persistence failed:', error)
        return null
      }

      const mapped = normalizeNotification(data)
      if (email === recipientEmail.value) {
        notifications.value.unshift(mapped)
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
      .eq('recipient_email', recipientEmail.value)

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
      .eq('recipient_email', recipientEmail.value)
      .eq('is_read', false)

    if (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

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
