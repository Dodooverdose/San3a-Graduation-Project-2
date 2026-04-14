<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Header -->
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <div class="header-brand">
          <div class="header-brand-icon">
            <img src="/icons/White.png" alt="San3a logo" class="brand-logo-mark" />
          </div>
          <span class="header-brand-name">San3a</span>
        </div>
        <q-space />
        <q-btn
          flat
          round
          dense
          icon="notifications"
          class="notif-btn"
          @click="showNotifications = !showNotifications"
        >
          <q-badge v-if="unreadCount > 0" color="red" floating>{{ unreadCount }}</q-badge>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Notifications Panel -->
    <q-dialog v-model="showNotifications" position="top" seamless>
      <q-card class="notif-card">
        <q-card-section class="row items-center q-pb-sm">
          <div class="notif-card-title">Notifications</div>
          <q-space />
          <q-btn
            v-if="notifications.length > 0"
            flat
            dense
            no-caps
            label="Clear All"
            color="negative"
            size="sm"
            class="q-mr-sm"
            @click="clearAllNotifications"
          />
          <q-btn flat dense round icon="close" @click="showNotifications = false" />
        </q-card-section>
        <q-separator />
        <q-list v-if="notifications.length > 0" separator>
          <q-item
            v-for="(notif, i) in notifications"
            :key="i"
            :class="{ 'notif-unread': !notif.read }"
            clickable
            @click="openNotification(notif, i)"
          >
            <q-item-section avatar>
              <q-avatar size="40px" class="notif-avatar">
                <q-icon name="build" size="20px" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="notif-name">{{ notif.fixerName }}</q-item-label>
              <q-item-label caption>{{ getNotifMessage(notif) }}</q-item-label>
              <q-item-label caption class="text-grey-6">{{ notif.time }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn
                  dense
                  flat
                  round
                  color="positive"
                  icon="check"
                  size="sm"
                  @click.stop="markAsRead(i)"
                />
                <q-btn
                  dense
                  flat
                  round
                  color="negative"
                  icon="close"
                  size="sm"
                  @click.stop="dismissNotification(i)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-section v-else class="text-center text-grey-5 q-py-lg"
          >No Offers Yet</q-card-section
        >
      </q-card>
    </q-dialog>

    <q-page-container>
      <q-page class="page-content">
        <div class="home-shell">
          <!-- Hero Card -->
          <div class="hero-card san3a-animate-in">
            <div class="hero-deco"></div>
            <div class="hero-content">
              <div class="hero-copy">
                <div class="hero-eyebrow">Welcome back</div>
                <div class="hero-title">What do you need help with today?</div>
                <div class="hero-subtitle">
                  Pick a service, review your latest requests, or jump straight into the requests
                  tab.
                </div>
              </div>
              <div class="hero-actions">
                <q-btn
                  unelevated
                  no-caps
                  class="hero-btn-primary"
                  icon="assignment"
                  label="Requests"
                  @click="goToPage('/incoming-offers')"
                />
                <q-btn
                  flat
                  no-caps
                  class="hero-btn-ghost"
                  icon="person"
                  label="Profile"
                  @click="goToPage('/profile')"
                />
              </div>
            </div>
          </div>

          <!-- Services Grid -->
          <div class="services-grid">
            <div
              v-for="(item, idx) in items"
              :key="idx"
              class="service-item san3a-animate-in"
              :class="`san3a-stagger-${idx + 1}`"
              @click="goToPage(item.route)"
            >
              <div class="service-icon-box">
                <img :src="item.icon" alt="icon" />
              </div>
              <div class="service-label">{{ item.label }}</div>
            </div>
          </div>

          <!-- Recent Requests -->
          <div class="recent-card san3a-animate-in" @click="goToPage('/incoming-offers')">
            <div class="recent-header">
              <div>
                <div class="recent-title">Recent Requests</div>
                <div class="recent-sub">A quick look at your latest two requests</div>
              </div>
              <q-chip outline color="primary" icon="chevron_right" clickable>Open Requests</q-chip>
            </div>
            <q-separator />
            <div class="recent-body">
              <div v-if="loadingRecentRequests" class="text-center q-py-md text-grey-6">
                Loading recent requests...
              </div>
              <div v-else-if="recentRequests.length === 0" class="text-center q-py-lg text-grey-6">
                No requests yet. Create your first request from the service categories above.
              </div>
              <div v-else class="recent-list">
                <div v-for="req in recentRequests" :key="req._id" class="recent-item">
                  <div class="row items-start no-wrap q-gutter-sm">
                    <q-avatar size="40px" class="recent-avatar">
                      <q-icon name="assignment" size="20px" />
                    </q-avatar>
                    <div class="recent-request-copy">
                      <div class="row items-center q-gutter-sm q-mb-xs">
                        <div class="recent-req-id">Request #{{ req._id }}</div>
                        <q-badge :color="getStatusColor(req._status)">{{ req._status }}</q-badge>
                      </div>
                      <div class="recent-req-cat">{{ req._category }}</div>
                      <div class="recent-req-desc">
                        {{ req._description || 'No description provided' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>

    <!-- Bottom Navigation -->
    <q-footer class="bottom-nav" elevated>
      <q-tabs
        v-model="activeTab"
        active-color="white"
        indicator-color="transparent"
        class="nav-tabs"
        narrow-indicator
        dense
      >
        <q-tab name="home" icon="home" label="Home" @click="goToPage('/home')" />
        <q-tab
          name="offers"
          icon="handshake"
          label="Requests"
          @click="goToPage('/incoming-offers')"
        />
        <q-tab name="orders" icon="receipt_long" label="Orders" @click="goToPage('/orders')" />
        <q-tab name="profile" icon="person" label="Profile" @click="goToPage('/profile')" />
      </q-tabs>
    </q-footer>

    <!-- Arrival Check Dialog -->
    <q-dialog v-model="showArrivalDialog" persistent>
      <q-card style="min-width: 320px; border-radius: 20px">
        <q-card-section class="text-center">
          <q-icon name="person_pin_circle" size="56px" color="primary" />
          <div class="text-h6 q-mt-sm">Did the technician arrive?</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            Request #{{ arrivalCheckRequest?.request_id }}
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md q-gutter-sm">
          <q-btn
            unelevated
            color="positive"
            label="Yes"
            icon="check"
            no-caps
            @click="handleArrivalYes"
          />
          <q-btn
            unelevated
            color="negative"
            label="No"
            icon="close"
            no-caps
            @click="handleArrivalNo"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ETA Notification Dialog -->
    <q-dialog v-model="showEtaMessage">
      <q-card style="min-width: 320px; border-radius: 20px">
        <q-card-section class="text-center">
          <q-icon name="schedule" size="56px" color="primary" />
          <div class="text-h6 q-mt-sm">Technician ETA</div>
          <div
            v-if="etaSecondsLeft > 0"
            class="text-h3 q-mt-md"
            style="
              font-variant-numeric: tabular-nums;
              color: var(--san3a-primary);
              font-weight: 700;
            "
          >
            {{ etaCountdownDisplay }}
          </div>
          <div v-else class="text-h6 text-negative q-mt-md">Time is up! Checking arrival...</div>
          <div class="text-body2 text-grey-7 q-mt-sm">Request #{{ etaRequestId }}</div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md">
          <q-btn unelevated color="primary" label="OK" no-caps @click="showEtaMessage = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useNotificationCenter } from 'src/composables/useNotificationCenter'
import { useArrivalCheck } from 'src/composables/useArrivalCheck'

const router = useRouter()
const $q = useQuasar()
const {
  notifications,
  unreadCount,
  setRecipientEmail,
  loadNotifications,
  markAsRead,
  dismissNotification,
  clearAllNotifications,
  getNotifMessage,
} = useNotificationCenter()

const {
  arrivalCheckRequest,
  showArrivalDialog,
  showEtaMessage,
  etaRequestId,
  etaSecondsLeft,
  confirmArrival,
  reportNoArrival,
  startCustomerChecks,
} = useArrivalCheck()

const etaCountdownDisplay = computed(() => {
  const s = etaSecondsLeft.value
  if (s <= 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
})

const handleArrivalYes = async () => {
  const { error } = await confirmArrival(arrivalCheckRequest.value)
  if (error) $q.notify({ type: 'negative', message: 'Failed to update status: ' + error.message })
  else $q.notify({ type: 'positive', message: 'Great! Request is now on-going.' })
}

const handleArrivalNo = async () => {
  await reportNoArrival(arrivalCheckRequest.value)
  $q.notify({ type: 'info', message: 'Technician has been notified. Waiting for ETA...' })
}

const showNotifications = ref(false)
const activeTab = ref('home')
const customerUserId = ref(null)
const offersSubscription = ref(null)
const knownOfferPrices = ref(new Map())
const recentRequests = ref([])
const loadingRecentRequests = ref(false)

const openNotification = (notif, index) => {
  markAsRead(index)
  showNotifications.value = false
  if (notif?.routePath) {
    router.push(notif.routePath)
    return
  }
  if (notif?.requestId) {
    router.push({ path: '/incoming-offers', query: { requestId: String(notif.requestId) } })
    return
  }
  router.push('/incoming-offers')
}

const initializeIncomingOfferTracking = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  setRecipientEmail(user.email)
  const { data: customer } = await supabase
    .from('users')
    .select('user_id')
    .ilike('email', user.email)
    .maybeSingle()
  if (!customer?.user_id) return
  customerUserId.value = customer.user_id
  const { data: requests } = await supabase
    .from('request')
    .select('request_id, fixer_price')
    .eq('user_id', customer.user_id)
  knownOfferPrices.value = new Map((requests || []).map((r) => [r.request_id, r.fixer_price]))
}

const normalizeRequest = (request) => ({
  ...request,
  _id: request.id ?? request.request_id ?? request.uuid ?? null,
  _status: String(request.request_status ?? request.status ?? 'pending').toLowerCase(),
  _category: request.category ?? request.service_category ?? request.request_category ?? 'General',
  _description: request.description_of_issue ?? request.description ?? '',
})

const loadRecentRequests = async () => {
  if (!customerUserId.value) return
  loadingRecentRequests.value = true
  try {
    const { data, error } = await supabase
      .from('request')
      .select('*')
      .eq('user_id', customerUserId.value)
      .order('request_id', { ascending: false })
      .limit(2)
    if (error) throw error
    recentRequests.value = (data || []).map(normalizeRequest)
  } catch (error) {
    console.error('Failed to load recent requests:', error)
  } finally {
    loadingRecentRequests.value = false
  }
}

const subscribeToIncomingOffers = () => {
  if (!customerUserId.value) return
  offersSubscription.value?.unsubscribe()
  offersSubscription.value = supabase
    .channel(`home-incoming-offers-${customerUserId.value}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'request',
        filter: `user_id=eq.${customerUserId.value}`,
      },
      async (payload) => {
        const next = payload.new || {}
        const requestId = next.request_id
        const nextFixerPrice = next.fixer_price
        const prevFixerPrice = knownOfferPrices.value.get(requestId)
        const hasNewBid =
          nextFixerPrice !== null &&
          nextFixerPrice !== undefined &&
          (prevFixerPrice === null ||
            prevFixerPrice === undefined ||
            prevFixerPrice !== nextFixerPrice)
        knownOfferPrices.value.set(requestId, nextFixerPrice)
        if (!hasNewBid) return
        await loadNotifications()
        $q.notify({
          type: 'info',
          icon: 'notifications_active',
          message: `New offer received for request #${requestId}.`,
        })
      },
    )
    .subscribe()
}

onMounted(async () => {
  try {
    await initializeIncomingOfferTracking()
    await loadRecentRequests()
    await loadNotifications()
    subscribeToIncomingOffers()
    startCustomerChecks(customerUserId.value)
  } catch (err) {
    console.error('Failed to initialize home notifications:', err)
  }
})

onBeforeUnmount(() => {
  offersSubscription.value?.unsubscribe()
})

const goToPage = (route) => {
  if (route) router.push(route)
}

const getStatusColor = (status) => {
  const map = {
    pending: 'orange',
    assigned: 'blue',
    'in-progress': 'purple',
    'on-going': 'purple',
    completed: 'green',
    cancelled: 'red',
    accepted: 'teal',
  }
  return map[String(status || '').toLowerCase()] || 'grey'
}

const items = ref([
  { label: 'Plumbing', icon: '/icons/plumbing.png', route: '/plumbing' },
  { label: 'Carpentry', icon: '/icons/carpentry.png', route: '/carpentry' },
  { label: 'Electrical', icon: '/icons/electrical.png', route: '/electrical' },
  { label: 'Kitchen Utilities', icon: '/icons/kitchen.png', route: '/kitchen' },
  { label: 'Painters and Decorators', icon: '/icons/painters.png', route: '/painters' },
  { label: 'Drapery Seamstress', icon: '/icons/drapery.png', route: '/drapery' },
])
</script>

<style scoped>
/* Header */
.app-header {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06) !important;
}
.app-toolbar {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}
.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-brand-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}
.header-brand-name {
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.notif-btn {
  color: var(--san3a-gray-600) !important;
}

/* Notification Card */
.notif-card {
  width: 380px;
  max-width: 95vw;
  margin-top: 60px;
  border-radius: var(--san3a-radius-xl) !important;
}
.notif-card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--san3a-gray-900);
}
.notif-unread {
  background: var(--san3a-primary-light) !important;
}
.notif-avatar {
  background: var(--san3a-primary) !important;
  color: #fff !important;
}
.notif-name {
  font-weight: 600;
}

/* Page */
.page-content {
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
  background: var(--san3a-bg);
}

.home-shell {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* Hero Card */
.hero-card {
  border-radius: var(--san3a-radius-2xl);
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover));
  color: #fff;
  overflow: hidden;
  position: relative;
  margin-bottom: 28px;
  padding: 28px 24px;
  box-shadow: var(--san3a-shadow-md);
}

.hero-deco {
  position: absolute;
  right: -40px;
  top: -40px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.hero-copy {
  max-width: 560px;
}
.hero-eyebrow {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.85;
}
.hero-title {
  font-size: 28px;
  line-height: 1.15;
  font-weight: 800;
  margin-top: 8px;
  letter-spacing: -0.01em;
}
.hero-subtitle {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.65;
  opacity: 0.92;
  max-width: 56ch;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}
.hero-btn-primary {
  background: #fff !important;
  color: var(--san3a-primary) !important;
  font-weight: 700;
  padding: 8px 20px !important;
}
.hero-btn-ghost {
  color: #fff !important;
  font-weight: 600;
  border-radius: 999px;
}

/* Services Grid */
.services-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.service-item {
  cursor: pointer;
  background: #fff;
  border: 1px solid var(--san3a-gray-200);
  border-radius: var(--san3a-radius-xl);
  padding: 20px 12px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}
.service-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--san3a-shadow-lg);
  border-color: rgba(13, 115, 119, 0.28);
}
.service-item:active {
  transform: scale(0.97);
}
.service-item:focus-visible {
  outline: 3px solid rgba(13, 115, 119, 0.24);
  outline-offset: 2px;
}

.service-icon-box {
  width: 72px;
  height: 72px;
  border-radius: var(--san3a-radius-xl);
  background: linear-gradient(135deg, var(--san3a-primary-light), #c2eded);
  display: flex;
  align-items: center;
  justify-content: center;
}
.service-icon-box img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.service-label {
  margin-top: 12px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  color: var(--san3a-gray-800);
  line-height: 1.3;
}

/* Recent Requests */
.recent-card {
  background: #fff;
  border: 1px solid var(--san3a-gray-200);
  border-radius: var(--san3a-radius-2xl);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  overflow: hidden;
}
.recent-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--san3a-shadow-lg);
  border-color: rgba(13, 115, 119, 0.24);
}
.recent-card:focus-visible {
  outline: 3px solid rgba(13, 115, 119, 0.24);
  outline-offset: 2px;
}

.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
}
.recent-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--san3a-gray-900);
  line-height: 1.25;
}
.recent-sub {
  font-size: 13px;
  color: var(--san3a-gray-500);
  margin-top: 4px;
  line-height: 1.45;
}

.recent-body {
  padding: 16px 20px;
}
.recent-list {
  display: grid;
  gap: 12px;
}

.recent-item {
  border-radius: var(--san3a-radius-lg);
  padding: 14px;
  background: var(--san3a-gray-50);
  border: 1px solid var(--san3a-gray-200);
}

.recent-avatar {
  background: var(--san3a-primary) !important;
  color: #fff !important;
}

.recent-request-copy {
  flex: 1;
  min-width: 0;
}
.recent-req-id {
  font-weight: 700;
  font-size: 14px;
  color: var(--san3a-gray-900);
}
.recent-req-cat {
  font-size: 13px;
  color: var(--san3a-gray-700);
}
.recent-req-desc {
  font-size: 12px;
  color: var(--san3a-gray-600);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.page-content :deep(.q-btn:focus-visible),
.page-content :deep(.q-tab:focus-visible) {
  outline: 3px solid rgba(13, 115, 119, 0.22);
  outline-offset: 2px;
}

/* Bottom Nav */
.bottom-nav {
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover)) !important;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.12);
}
.nav-tabs {
  height: 60px;
}
.nav-tabs :deep(.q-tab) {
  min-height: 60px;
  font-size: 11px;
  text-transform: none;
  opacity: 0.75;
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.nav-tabs :deep(.q-tab--active) {
  opacity: 1;
}
.nav-tabs :deep(.q-tab__icon) {
  font-size: 24px;
}

@media (max-width: 599px) {
  .home-shell {
    padding: 18px 14px;
  }
  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .hero-title {
    font-size: 22px;
  }
  .hero-actions {
    width: 100%;
    align-items: stretch;
  }
  .services-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (min-width: 600px) {
  .services-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
