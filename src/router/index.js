import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { supabase } from 'src/boot/supabase'

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

      if (to.meta.requiresAdmin) {
        const role = session.user?.user_metadata?.role
        if (role !== 'admin') {
          return '/home'
        }
      }
    }
  })

  return Router
})
