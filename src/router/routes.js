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
    path: '/home',
    component: () => import('layouts/HomePage.vue'),
  },
  {
    path: '/service-provider',
    component: () => import('layouts/ServiceProvider.vue'),
  },
  {
    path: '/profile',
    component: () => import('layouts/UserProfile.vue'),
  },
  {
    path: '/plumbing',
    component: () => import('layouts/PlumbingPage.vue'),
  },
  {
    path: '/carpentry',
    component: () => import('layouts/CarpentryPage.vue'),
  },
  {
    path: '/electrical',
    component: () => import('layouts/ElectricalPage.vue'),
  },
  {
    path: '/kitchen',
    component: () => import('layouts/KitchenPage.vue'),
  },
  {
    path: '/painters',
    component: () => import('layouts/PaintersPage.vue'),
  },
  {
    path: '/drapery',
    component: () => import('layouts/DraperyPage.vue'),
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
