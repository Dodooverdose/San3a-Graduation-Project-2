// Allowed roles per route. Roles are resolved strictly from the database
// (admin/technician tables) in the router guard — never from user_metadata,
// which is user-editable and therefore untrusted for authorization.
//
// Roles:
//   - 'admin'    : verified in `admin` table
//   - 'fixer'    : verified in `technician` table
//   - 'customer' : authenticated user not in admin/technician tables

const customerOnly = ['customer']
const fixerOnly = ['fixer']
const adminOnly = ['admin']
const anyAuthed = ['admin', 'fixer', 'customer']

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
    path: '/forgot-password',
    component: () => import('layouts/ForgotPassword.vue'),
  },
  {
    path: '/reset-password',
    component: () => import('layouts/ResetPassword.vue'),
  },
  {
    path: '/home',
    meta: { requiresAuth: true, allowedRoles: customerOnly },
    component: () => import('layouts/HomePage.vue'),
  },
  {
    path: '/orders',
    meta: { requiresAuth: true, allowedRoles: customerOnly },
    component: () => import('layouts/OrdersPage.vue'),
  },
  {
    path: '/incoming-offers',
    meta: { requiresAuth: true, allowedRoles: fixerOnly },
    component: () => import('../layouts/IncomingOffersPage.vue'),
  },
  {
    path: '/service-provider',
    meta: { requiresAuth: true, allowedRoles: fixerOnly },
    component: () => import('layouts/ServiceProvider.vue'),
  },
  {
    path: '/profile',
    meta: { requiresAuth: true, allowedRoles: anyAuthed },
    component: () => import('layouts/UserProfile.vue'),
  },
  {
    path: '/verify-identity/:step',
    meta: { requiresAuth: true, allowedRoles: anyAuthed },
    component: () => import('layouts/IdentityVerification.vue'),
  },
  {
    path: '/pending-approval',
    meta: { requiresAuth: true, allowedRoles: anyAuthed },
    component: () => import('layouts/PendingApproval.vue'),
  },
  {
    path: '/plumbing',
    meta: { requiresAuth: true, allowedRoles: customerOnly },
    component: () => import('layouts/PlumbingPage.vue'),
  },
  {
    path: '/carpentry',
    meta: { requiresAuth: true, allowedRoles: customerOnly },
    component: () => import('layouts/CarpentryPage.vue'),
  },
  {
    path: '/electrical',
    meta: { requiresAuth: true, allowedRoles: customerOnly },
    component: () => import('layouts/ElectricalPage.vue'),
  },
  {
    path: '/kitchen',
    meta: { requiresAuth: true, allowedRoles: customerOnly },
    component: () => import('layouts/KitchenPage.vue'),
  },
  {
    path: '/painters',
    meta: { requiresAuth: true, allowedRoles: customerOnly },
    component: () => import('layouts/PaintersPage.vue'),
  },
  {
    path: '/drapery',
    meta: { requiresAuth: true, allowedRoles: customerOnly },
    component: () => import('layouts/DraperyPage.vue'),
  },
  {
    path: '/admin',
    meta: { requiresAuth: true, allowedRoles: adminOnly, requiresAdmin: true },
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
