const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
  },
  {
    path: '/signup',
    component: () => import('layouts/SignUp.vue'),
  },
  {
    path: '/signin',
    component: () => import('layouts/SignIn.vue'),
  },
  {
    path: '/reset-password',
    component: () => import('layouts/ResetPassword.vue'),
  },
  {
    path: '/home',
    meta: { requiresAuth: true },
    component: () => import('layouts/HomePage.vue'),
  },
  {
    path: '/orders',
    meta: { requiresAuth: true },
    component: () => import('layouts/OrdersPage.vue'),
  },
  {
    path: '/incoming-offers',
    meta: { requiresAuth: true },
    component: () => import('../layouts/IncomingOffersPage.vue'),
  },
  {
    path: '/service-provider',
    meta: { requiresAuth: true },
    component: () => import('layouts/ServiceProvider.vue'),
  },
  {
    path: '/profile',
    meta: { requiresAuth: true },
    component: () => import('layouts/UserProfile.vue'),
  },
  {
    path: '/plumbing',
    meta: { requiresAuth: true },
    component: () => import('layouts/PlumbingPage.vue'),
  },
  {
    path: '/carpentry',
    meta: { requiresAuth: true },
    component: () => import('layouts/CarpentryPage.vue'),
  },
  {
    path: '/electrical',
    meta: { requiresAuth: true },
    component: () => import('layouts/ElectricalPage.vue'),
  },
  {
    path: '/kitchen',
    meta: { requiresAuth: true },
    component: () => import('layouts/KitchenPage.vue'),
  },
  {
    path: '/painters',
    meta: { requiresAuth: true },
    component: () => import('layouts/PaintersPage.vue'),
  },
  {
    path: '/drapery',
    meta: { requiresAuth: true },
    component: () => import('layouts/DraperyPage.vue'),
  },
  {
    path: '/admin',
    meta: { requiresAuth: true, requiresAdmin: true },
    component: () => import('layouts/AdminPage.vue'),
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
