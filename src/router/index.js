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

/**
 * Resolve a user's effective role from the database.
 *
 * SECURITY: This function intentionally does NOT trust
 * `session.user.user_metadata.role`. The `user_metadata` object is writable
 * by the authenticated user themselves (via supabase.auth.updateUser), so it
 * is not a safe source of authorization claims. Roles are derived from the
 * `admin` and `technician` tables, which are protected by RLS.
 *
 * Returns one of: 'admin' | 'fixer' | 'customer'.
 */
async function resolveRoleFromDatabase(user, authStore) {
  if (!user?.email) return 'customer'

  // 1. Check admin table.
  try {
    const { data: adminRow } = await supabase
      .from('admin')
      .select('email')
      .ilike('email', user.email)
      .maybeSingle()

    if (adminRow) {
      authStore.user = user
      authStore.isAdminVerified = true
      authStore.roleData = adminRow
      return 'admin'
    }
  } catch (err) {
    console.warn('Admin role lookup failed:', err)
  }

  // 2. Check technician table.
  try {
    const { data: techRow } = await supabase
      .from('technician')
      .select('email')
      .ilike('email', user.email)
      .maybeSingle()

    if (techRow) {
      return 'fixer'
    }
  } catch (err) {
    console.warn('Technician role lookup failed:', err)
  }

  // 3. Default: customer.
  return 'customer'
}

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

      // SECURITY: Resolve the user's role from the database — NEVER from
      // session.user.user_metadata, because that field is writable by the
      // authenticated user themselves (via supabase.auth.updateUser) and
      // therefore cannot be trusted for authorization decisions.
      const effectiveRole = await resolveRoleFromDatabase(session.user, authStore)

      // Default landing page per role, used when access is denied.
      const landingFor = (role) =>
        role === 'admin' ? '/admin' : role === 'fixer' ? '/service-provider' : '/home'

      // Enforce allowedRoles declared on the route.
      const allowedRoles = to.meta.allowedRoles
      if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        if (!allowedRoles.includes(effectiveRole)) {
          return landingFor(effectiveRole)
        }
      }

      // Admin shortcut: verified admins bypass the verification flow below.
      if (effectiveRole === 'admin') {
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
          return effectiveRole === 'fixer' ? '/service-provider' : '/home'
        }
        return true
      }

      // Fallback for technicians: if no verification submission exists but
      // the technician record is already marked as verified, allow access.
      if (!verification && effectiveRole === 'fixer') {
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
