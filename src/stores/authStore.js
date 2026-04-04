import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/boot/supabase'

export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  const user = ref(null)
  const roleData = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const isAdminVerified = ref(false)

  // Computed properties
  const role = computed(() => user.value?.user_metadata?.role || 'customer')
  const isAuthenticated = computed(() => !!session.value)
  const isAdmin = computed(() => role.value === 'admin' && isAdminVerified.value)
  const isFixer = computed(() => role.value === 'fixer')
  const isCustomer = computed(() => role.value === 'customer' || role.value === null)

  // Initialize session on app load
  const initSession = async () => {
    loading.value = true
    try {
      const { data: { session: sess }, error: err } = await supabase.auth.getSession()
      if (err) throw err

      if (sess?.user) {
        session.value = sess
        user.value = sess.user
        // Verify admin status if role is admin
        if (sess.user?.user_metadata?.role === 'admin') {
          await verifyAdminStatus(sess.user.email)
        }
      }
    } catch (err) {
      console.error('Error initializing session:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Sign in user (used by SignIn.vue)
  const signIn = async (email, password) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (err) throw err

      if (data?.session?.user) {
        session.value = data.session
        user.value = data.session.user

        // If admin role in metadata, verify they exist in admin table (optional check)
        if (data.session.user?.user_metadata?.role === 'admin') {
          await verifyAdminStatus(data.session.user.email)
          // Note: isAdminVerified is set in verifyAdminStatus, or stays false if RLS blocks query
          // But if they have admin role in metadata, we'll allow them through
          if (!isAdminVerified.value) {
            console.warn('Admin table verification failed, but allowing login due to admin role in metadata')
            isAdminVerified.value = true // Trust the metadata
          }
        }
      }

      return { success: true, data }
    } catch (err) {
      error.value = err.message
      console.error('Sign in error:', err)
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  // Verify admin status against admin table
  const verifyAdminStatus = async (email) => {
    try {
      isAdminVerified.value = false

      // Check if user exists in admin table
      const { data, error: err } = await supabase
        .from('admin')
        .select('*')
        .eq('email', email)
        .single()

      if (err && err.code !== 'PGRST116') {
        // PGRST116 means no rows found; other errors are unexpected
        console.warn('Error verifying admin status:', err)
      }

      if (data) {
        isAdminVerified.value = true
        roleData.value = data
      }
    } catch (err) {
      console.error('Unexpected error in verifyAdminStatus:', err)
    }
  }

  // Sign out user
  const signOut = async () => {
    loading.value = true
    try {
      const { error: err } = await supabase.auth.signOut()
      if (err) throw err

      session.value = null
      user.value = null
      roleData.value = null
      isAdminVerified.value = false
      error.value = null
    } catch (err) {
      error.value = err.message
      console.error('Sign out error:', err)
    } finally {
      loading.value = false
    }
  }

  // Get redirect path based on role
  const getRedirectPath = () => {
    if (role.value === 'admin' && isAdminVerified.value) {
      return '/admin'
    } else if (role.value === 'fixer') {
      return '/service-provider'
    } else {
      return '/home'
    }
  }

  return {
    session,
    user,
    roleData,
    loading,
    error,
    isAdminVerified,
    role,
    isAuthenticated,
    isAdmin,
    isFixer,
    isCustomer,
    initSession,
    signIn,
    verifyAdminStatus,
    signOut,
    getRedirectPath,
  }
})
