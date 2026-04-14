import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import { Dark } from 'quasar'
import routes from './routes'
import { supabase } from 'src/boot/supabase'
import { useAuthStore } from 'src/stores/authStore'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  Router.beforeEach(async (to) => {
    const authStore = useAuthStore()
    const isVerificationRoute = to.path.startsWith('/verify-identity/')
    const isPendingApprovalRoute = to.path === '/pending-approval'

    // Keep public pages in light mode regardless of previous authenticated theme toggle.
    if (!to.meta.requiresAuth) {
      Dark.set(false)
    }

    // Handle Supabase recovery tokens that land in the route path.
    // In hash-mode routing, the URL fragment is used by Vue Router,
    // so Supabase tokens (e.g. /#/access_token=...&type=recovery)
    // get misinterpreted as a route path, causing a 404.
    if (to.fullPath.includes('access_token') && to.fullPath.includes('type=recovery')) {
      const params = new URLSearchParams(to.fullPath.replace(/^\/?/, ''))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        return '/reset-password'
      }
    }

    if (to.meta.requiresAuth) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        return '/signin'
      }

      if (session.user?.user_metadata?.role === 'admin') {
        if (to.meta.requiresAdmin) {
          authStore.user = session.user
          await authStore.verifyAdminStatus(session.user.email)

          if (!authStore.isAdminVerified) {
            console.warn(
              'Admin table verification failed, but allowing access due to admin role in metadata',
            )
            authStore.isAdminVerified = true
          }
        }

        return true
      }

      if (to.meta.requiresAdmin) {
        const role = session.user?.user_metadata?.role

        if (role !== 'admin') {
          return '/home'
        }

        // Optional: Verify admin is in admin table (non-blocking)
        authStore.user = session.user
        await authStore.verifyAdminStatus(session.user.email)

        if (!authStore.isAdminVerified) {
          // Admin table verification failed, but allow if role is admin in metadata
          console.warn(
            'Admin table verification failed, but allowing access due to admin role in metadata',
          )
          authStore.isAdminVerified = true
        }

        return true
      }

      const { data: verification, error: verificationError } = await supabase
        .from('profile_verification_submissions')
        .select(
          'review_status,verification_completed_at,national_id_front_image,national_id_back_image,selfie_image',
        )
        .eq('auth_id', session.user.id)
        .maybeSingle()

      if (verificationError) {
        console.warn('Verification state check failed:', verificationError)
      }

      const reviewStatus = verification?.review_status || null

      // Approved accounts should never be forced back into verification steps.
      if (reviewStatus === 'approved') {
        if (isPendingApprovalRoute || isVerificationRoute) {
          return session.user?.user_metadata?.role === 'fixer' ? '/service-provider' : '/home'
        }
        return true
      }

      // Fallback for technicians: if no verification submission exists but
      // the technician record is already marked as verified, allow access.
      if (!verification && session.user?.user_metadata?.role === 'fixer') {
        const { data: tech } = await supabase
          .from('technician')
          .select('is_verified')
          .ilike('email', session.user.email)
          .maybeSingle()

        if (tech?.is_verified) {
          if (isPendingApprovalRoute || isVerificationRoute) {
            return '/service-provider'
          }
          return true
        }
      }

      const hasAllRequiredDocs = Boolean(
        verification?.national_id_front_image &&
        verification?.national_id_back_image &&
        verification?.selfie_image,
      )
      const isVerificationComplete =
        Boolean(verification?.verification_completed_at) && hasAllRequiredDocs

      if (!isVerificationComplete) {
        if (!isVerificationRoute) {
          return '/verify-identity/id-front'
        }
        return true
      }

      if (reviewStatus !== 'approved') {
        if (reviewStatus === 'rejected' && isVerificationRoute) {
          return true
        }

        if (!isPendingApprovalRoute) {
          return '/pending-approval'
        }
        return true
      }
    }
  })

  return Router
})
