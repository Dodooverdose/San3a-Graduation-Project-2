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

    <!-- Notifications -->
    <q-dialog v-model="showNotifications" position="top" seamless>
      <q-card class="notif-card">
        <q-card-section class="row items-center q-pb-sm">
          <div class="notif-title">Notifications</div>
          <q-space />
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
            <q-item-section avatar
              ><q-avatar size="40px" class="notif-avatar"
                ><q-icon name="build" size="20px" /></q-avatar
            ></q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">{{ notif.fixerName }}</q-item-label>
              <q-item-label caption>{{ notif.message }}</q-item-label>
              <q-item-label caption class="text-grey-6">{{ notif.time }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-section v-else class="text-center text-grey-5 q-py-lg"
          >No notifications yet</q-card-section
        >
      </q-card>
    </q-dialog>

    <q-page-container>
      <q-page class="page-content">
        <!-- Loading -->
        <div v-if="loading" class="state-center">
          <q-spinner color="primary" size="48px" />
          <div class="q-mt-md text-grey-7">Loading your orders...</div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-center">
          <q-icon name="error_outline" size="72px" color="negative" />
          <div class="state-title">Something went wrong</div>
          <div class="state-sub">{{ error }}</div>
          <q-btn
            unelevated
            color="primary"
            label="Retry"
            icon="refresh"
            class="q-mt-lg"
            rounded
            @click="fetchAllOrders"
          />
        </div>

        <!-- Empty -->
        <div v-else-if="allOrders.length === 0" class="state-center">
          <q-icon name="receipt_long" size="80px" color="grey-4" />
          <div class="state-title">No orders yet</div>
          <div class="state-sub">Your service requests will appear here</div>
          <q-btn
            unelevated
            color="primary"
            label="Browse Services"
            icon="home"
            class="q-mt-lg"
            rounded
            @click="$router.push('/home')"
          />
        </div>

        <!-- Orders Dashboard -->
        <div v-else class="orders-shell san3a-animate-in">
          <div class="page-title">My Orders</div>
          <div class="orders-summary q-mb-md">
            <q-badge color="primary" class="q-pa-sm text-body2"
              >{{ allOrders.length }} total
              {{ allOrders.length === 1 ? 'order' : 'orders' }}</q-badge
            >
          </div>

          <div class="category-list">
            <q-expansion-item
              v-for="cat in categories"
              :key="cat.key"
              group="categories"
              class="category-section"
              header-class="category-header"
              expand-icon-class="text-white"
            >
              <template #header>
                <q-item-section avatar>
                  <q-avatar size="42px" class="category-avatar"><img :src="cat.icon" /></q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="category-name">{{ cat.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="groupedOrders[cat.key]?.length ? 'white' : 'grey-4'"
                    :text-color="groupedOrders[cat.key]?.length ? 'primary' : 'grey-7'"
                    :label="
                      (groupedOrders[cat.key]?.length || 0) +
                      ' ' +
                      ((groupedOrders[cat.key]?.length || 0) === 1 ? 'order' : 'orders')
                    "
                    class="q-pa-xs text-caption"
                    rounded
                  />
                </q-item-section>
              </template>

              <div v-if="groupedOrders[cat.key]?.length" class="q-pa-sm">
                <div v-for="req in groupedOrders[cat.key]" :key="req.request_id" class="order-card">
                  <div class="order-card-header">
                    <span class="order-id">Request #{{ req.request_id }}</span>
                    <q-badge
                      :color="statusColor(req.request_status)"
                      :label="req.request_status || 'pending'"
                      class="text-capitalize"
                    />
                  </div>
                  <p class="order-desc">{{ req.description_of_issue || 'No description' }}</p>
                  <div class="order-meta">
                    <div v-if="req.request_date" class="meta-item">
                      <q-icon name="event" size="14px" color="grey-6" /><span>{{
                        formatDate(req.request_date)
                      }}</span>
                    </div>
                    <div v-if="req.service_location" class="meta-item">
                      <q-icon name="location_on" size="14px" color="grey-6" /><span>{{
                        req.service_location
                      }}</span>
                    </div>
                    <div v-if="req.payment_method" class="meta-item">
                      <q-icon name="payments" size="14px" color="grey-6" /><span
                        class="text-capitalize"
                        >{{ req.payment_method }}</span
                      >
                    </div>
                    <div v-if="req.schedule_time" class="meta-item">
                      <q-icon name="schedule" size="14px" color="grey-6" /><span>{{
                        formatDate(req.schedule_time)
                      }}</span>
                    </div>
                  </div>
                  <q-badge
                    v-if="req.urgency === 'urgent'"
                    color="red"
                    label="Urgent"
                    size="sm"
                    class="q-mt-xs"
                  />
                </div>
              </div>

              <div v-else class="category-empty">
                <q-icon name="inbox" size="32px" color="grey-4" />
                <span>No {{ cat.label.toLowerCase() }} orders yet</span>
              </div>
            </q-expansion-item>
          </div>
        </div>
      </q-page>
    </q-page-container>

    <!-- Bottom Nav -->
    <q-footer elevated class="bottom-nav">
      <q-tabs
        v-model="activeTab"
        active-color="white"
        indicator-color="transparent"
        class="nav-tabs"
        narrow-indicator
        dense
      >
        <q-tab name="home" icon="home" label="Home" @click="$router.push('/home')" />
        <q-tab
          name="offers"
          icon="handshake"
          label="Offers"
          @click="$router.push('/incoming-offers')"
        />
        <q-tab name="orders" icon="receipt_long" label="Orders" @click="$router.push('/orders')" />
        <q-tab name="profile" icon="person" label="Profile" @click="$router.push('/profile')" />
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
          <div class="text-body1 q-mt-xs">
            The time left is <strong>{{ etaMinutes }} minutes</strong>
          </div>
          <div
            v-if="etaSecondsLeft > 0"
            class="text-h5 q-mt-sm"
            style="font-variant-numeric: tabular-nums; color: var(--san3a-primary)"
          >
            {{ etaCountdownDisplay }}
          </div>
          <div v-else class="text-body2 text-negative q-mt-sm">Time is up!</div>
          <div class="text-body2 text-grey-7 q-mt-xs">For request #{{ etaRequestId }}</div>
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
const activeTab = ref('orders')
const loading = ref(true)
const error = ref(null)
const allOrders = ref([])
const showNotifications = ref(false)
const { notifications, unreadCount, setRecipientEmail, loadNotifications, markAsRead } =
  useNotificationCenter()
const customerUserId = ref(null)
const offersSubscription = ref(null)
const knownOfferPrices = ref(new Map())

const {
  arrivalCheckRequest,
  showArrivalDialog,
  showEtaMessage,
  etaMinutes,
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
  const { error: err } = await confirmArrival(arrivalCheckRequest.value)
  if (err) $q.notify({ type: 'negative', message: 'Failed to update status: ' + err.message })
  else $q.notify({ type: 'positive', message: 'Great! Request is now on-going.' })
}

const handleArrivalNo = async () => {
  await reportNoArrival(arrivalCheckRequest.value)
  $q.notify({ type: 'info', message: 'Technician has been notified. Waiting for ETA...' })
}

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

const categories = [
  { key: 'plumber', label: 'Plumbing', icon: '/icons/plumbing.png' },
  { key: 'carpenter', label: 'Carpentry', icon: '/icons/carpentry.png' },
  { key: 'electrician', label: 'Electrical', icon: '/icons/electrical.png' },
  { key: 'kitchen_fitter', label: 'Kitchen Utilities', icon: '/icons/kitchen.png' },
  { key: 'painter', label: 'Painters and Decorators', icon: '/icons/painters.png' },
  { key: 'drapery_seamstress', label: 'Drapery Seamstress', icon: '/icons/drapery.png' },
]

const groupedOrders = computed(() => {
  const groups = {}
  for (const cat of categories)
    groups[cat.key] = allOrders.value.filter((o) => o.service_type === cat.key)
  return groups
})

const statusColor = (status) => {
  const map = {
    pending: 'orange',
    accepted: 'blue',
    'on-going': 'purple',
    completed: 'green',
    cancelled: 'red',
  }
  return map[status?.toLowerCase()] || 'grey'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const utcStr = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  const d = new Date(utcStr)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fetchAllOrders = async () => {
  loading.value = true
  error.value = null
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      error.value = 'You must be signed in to view orders.'
      loading.value = false
      return
    }
    setRecipientEmail(user.email)
    let userId = null
    const { data: customer } = await supabase
      .from('users')
      .select('user_id')
      .ilike('email', user.email)
      .maybeSingle()
    if (customer) {
      userId = customer.user_id
      customerUserId.value = customer.user_id
    }
    if (!userId) {
      const { data: tech } = await supabase
        .from('technician')
        .select('technician_id')
        .ilike('email', user.email)
        .maybeSingle()
      if (tech) userId = tech.technician_id
    }
    if (!userId) {
      allOrders.value = []
      loading.value = false
      return
    }
    const { data, error: fetchErr } = await supabase
      .from('request')
      .select('*')
      .eq('user_id', userId)
      .order('request_date', { ascending: false })
    if (fetchErr) error.value = fetchErr.message
    else allOrders.value = data || []
  } catch (err) {
    error.value = 'An unexpected error occurred.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchAllOrders)

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

const subscribeToIncomingOffers = () => {
  if (!customerUserId.value) return
  offersSubscription.value?.unsubscribe()
  offersSubscription.value = supabase
    .channel(`orders-incoming-offers-${customerUserId.value}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'request',
        filter: `user_id=eq.${customerUserId.value}`,
      },
      (payload) => {
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
        void loadNotifications()
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
  await initializeIncomingOfferTracking()
  await loadNotifications()
  subscribeToIncomingOffers()
  startCustomerChecks(customerUserId.value)
})

onBeforeUnmount(() => {
  offersSubscription.value?.unsubscribe()
})
</script>

<style scoped>
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
.notif-card {
  width: 380px;
  max-width: 95vw;
  margin-top: 60px;
  border-radius: var(--san3a-radius-xl) !important;
}
.notif-title {
  font-size: 18px;
  font-weight: 700;
}
.notif-unread {
  background: var(--san3a-primary-light) !important;
}
.notif-avatar {
  background: var(--san3a-primary) !important;
  color: #fff !important;
}

.page-content {
  background: var(--san3a-bg);
  padding-bottom: 80px;
  min-height: 100vh;
}
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 48px 24px;
  text-align: center;
  min-height: 60vh;
}
.state-title {
  margin-top: 20px;
  font-size: 22px;
  font-weight: 700;
  color: var(--san3a-gray-800);
}
.state-sub {
  margin-top: 8px;
  font-size: 15px;
  color: var(--san3a-gray-500);
}

.orders-shell {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 16px;
}
.page-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--san3a-primary);
  margin-bottom: 6px;
  letter-spacing: -0.01em;
  line-height: 1.2;
}
.orders-summary {
  display: flex;
  align-items: center;
}
.category-list {
  display: grid;
  gap: 14px;
}

.category-section {
  border-radius: var(--san3a-radius-xl) !important;
  overflow: hidden;
  border: 1px solid var(--san3a-gray-200);
  margin-bottom: 0;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}
.category-section:hover {
  box-shadow: var(--san3a-shadow-sm);
  border-color: rgba(13, 115, 119, 0.24);
}
.category-section :deep(.category-header) {
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover)) !important;
  color: white;
  min-height: 60px;
}
.category-avatar {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}
.category-avatar img {
  padding: 4px;
}
.category-name {
  font-weight: 700;
  font-size: 15px;
  color: white;
  line-height: 1.25;
}
.category-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  color: var(--san3a-gray-400);
  font-size: 14px;
}

.order-card {
  background: #fff;
  border: 1px solid var(--san3a-gray-200);
  border-radius: var(--san3a-radius-lg);
  padding: 16px;
  margin-bottom: 10px;
  transition:
    box-shadow 0.2s,
    transform 0.2s,
    border-color 0.2s;
}
.order-card:hover {
  box-shadow: var(--san3a-shadow-md);
  transform: translateY(-2px);
  border-color: rgba(13, 115, 119, 0.22);
}
.order-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.order-id {
  font-size: 14px;
  font-weight: 700;
  color: var(--san3a-gray-900);
}
.order-desc {
  font-size: 14px;
  color: var(--san3a-gray-700);
  line-height: 1.5;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.order-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--san3a-gray-500);
}

.page-content :deep(.q-btn:focus-visible),
.page-content :deep(.q-tab:focus-visible),
.page-content :deep(.q-expansion-item:focus-within) {
  outline: 3px solid rgba(13, 115, 119, 0.22);
  outline-offset: 2px;
}

.page-content :deep(.q-field--outlined .q-field__control:hover) {
  border-color: rgba(13, 115, 119, 0.32) !important;
}

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

@media (max-width: 600px) {
  .orders-shell {
    padding: 18px 14px;
  }
  .page-title {
    font-size: 24px;
  }
}
</style>
