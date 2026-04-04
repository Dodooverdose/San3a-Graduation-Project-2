<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="fixed-top">
      <q-toolbar>
        <q-toolbar-title style="display: flex; align-items: center">
          Sanعa
          <img src="/icons/White.png" alt="San3a" style="height: 40px; margin-left: 10px" />
        </q-toolbar-title>
        <q-space />
        <q-btn
          flat
          round
          dense
          icon="notifications"
          aria-label="Notifications"
          @click="showNotifications = !showNotifications"
        >
          <q-badge v-if="unreadCount > 0" color="red" floating>{{ unreadCount }}</q-badge>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-dialog v-model="showNotifications" position="top" seamless>
      <q-card style="width: 380px; max-width: 95vw; margin-top: 60px">
        <q-card-section class="row items-center q-pb-sm">
          <div class="text-h6">Notifications</div>
          <q-space />
          <q-btn flat dense round icon="close" @click="showNotifications = false" />
        </q-card-section>
        <q-separator />
        <q-list v-if="notifications.length > 0" separator>
          <q-item
            v-for="(notif, i) in notifications"
            :key="i"
            :class="{ 'bg-blue-1': !notif.read }"
            clickable
            @click="openNotification(notif, i)"
          >
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white" icon="build" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ notif.fixerName }}</q-item-label>
              <q-item-label caption>{{ notif.message }}</q-item-label>
              <q-item-label caption class="text-grey-6">{{ notif.time }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-section v-else class="text-center text-grey-5 q-py-lg">
          No notifications yet
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-page-container>
      <q-page class="page-content">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <q-spinner color="primary" size="48px" />
          <div class="q-mt-md text-grey-7">Loading your orders...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="empty-state">
          <q-icon name="error_outline" size="72px" color="red-3" />
          <div class="empty-title">Something went wrong</div>
          <div class="empty-subtitle">{{ error }}</div>
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

        <!-- Full-page empty state (no orders at all) -->
        <div v-else-if="allOrders.length === 0" class="empty-state">
          <q-icon name="receipt_long" size="80px" color="grey-4" />
          <div class="empty-title">No orders yet</div>
          <div class="empty-subtitle">Your service requests will appear here</div>
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
        <div v-else class="orders-container">
          <div class="page-title">My Orders</div>
          <div class="orders-summary q-mb-md">
            <q-badge color="primary" class="q-pa-sm text-body2">
              {{ allOrders.length }} total {{ allOrders.length === 1 ? 'order' : 'orders' }}
            </q-badge>
          </div>

          <q-list class="category-list">
            <q-expansion-item
              v-for="cat in categories"
              :key="cat.key"
              group="categories"
              class="category-section q-mb-sm"
              header-class="category-header"
              expand-icon-class="text-white"
            >
              <template #header>
                <q-item-section avatar>
                  <q-avatar size="42px" class="category-avatar">
                    <img :src="cat.icon" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="category-name">{{ cat.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="groupedOrders[cat.key]?.length ? 'white' : 'grey-4'"
                    :text-color="groupedOrders[cat.key]?.length ? 'green-9' : 'grey-7'"
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

              <!-- Category has orders -->
              <div v-if="groupedOrders[cat.key]?.length" class="q-pa-sm">
                <q-card
                  v-for="req in groupedOrders[cat.key]"
                  :key="req.request_id"
                  flat
                  bordered
                  class="order-card q-mb-sm"
                >
                  <q-card-section class="q-py-sm">
                    <div class="row items-center justify-between q-mb-xs">
                      <div class="text-subtitle2 text-weight-bold ellipsis" style="max-width: 65%">
                        Request #{{ req.request_id }}
                      </div>
                      <q-badge
                        :color="statusColor(req.request_status)"
                        :label="req.request_status || 'pending'"
                        class="text-capitalize"
                      />
                    </div>
                    <div class="text-body2 text-grey-8 q-mb-sm order-desc">
                      {{ req.description_of_issue || 'No description' }}
                    </div>
                    <div class="order-meta">
                      <div v-if="req.request_date" class="meta-item">
                        <q-icon name="event" size="14px" color="grey-6" />
                        <span>{{ formatDate(req.request_date) }}</span>
                      </div>
                      <div v-if="req.service_location" class="meta-item">
                        <q-icon name="location_on" size="14px" color="grey-6" />
                        <span>{{ req.service_location }}</span>
                      </div>
                      <div v-if="req.payment_method" class="meta-item">
                        <q-icon name="payments" size="14px" color="grey-6" />
                        <span class="text-capitalize">{{ req.payment_method }}</span>
                      </div>
                      <div v-if="req.schedule_time" class="meta-item">
                        <q-icon name="schedule" size="14px" color="grey-6" />
                        <span>{{ formatDate(req.schedule_time) }}</span>
                      </div>
                    </div>
                    <div v-if="req.urgency === 'urgent'" class="q-mt-xs">
                      <q-badge color="red" label="Urgent" size="sm" />
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Category empty -->
              <div v-else class="category-empty">
                <q-icon name="inbox" size="32px" color="grey-4" />
                <span class="text-grey-5">No {{ cat.label.toLowerCase() }} orders yet</span>
              </div>
            </q-expansion-item>
          </q-list>
        </div>
      </q-page>
    </q-page-container>

    <!-- Bottom Navigation Bar -->
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
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const router = useRouter()
const $q = useQuasar()
const activeTab = ref('orders')
const loading = ref(true)
const error = ref(null)
const allOrders = ref([])
const showNotifications = ref(false)
const notifications = ref([])
const customerUserId = ref(null)
const offersSubscription = ref(null)
const knownOfferPrices = ref(new Map())
const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

const markAsRead = (index) => {
  notifications.value[index].read = true
}

const openNotification = (notif, index) => {
  markAsRead(index)
  showNotifications.value = false
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
  for (const cat of categories) {
    groups[cat.key] = allOrders.value.filter((o) => o.service_type === cat.key)
  }
  return groups
})

const statusColor = (status) => {
  const map = { pending: 'orange', accepted: 'blue', completed: 'green', cancelled: 'red' }
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

    // Look up user_id from users table
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
      if (tech) {
        userId = tech.technician_id
      }
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

    if (fetchErr) {
      error.value = fetchErr.message
    } else {
      allOrders.value = data || []
    }
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

        const notificationItem = {
          fixerName: 'Fixer',
          message: `Sent an offer of ${nextFixerPrice} EGP for request #${requestId}.`,
          time: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          read: false,
          requestId,
        }

        notifications.value.unshift(notificationItem)

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
  subscribeToIncomingOffers()
})

onBeforeUnmount(() => {
  offersSubscription.value?.unsubscribe()
})
</script>

<style scoped>
.page-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 80px;
  min-height: 100%;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 48px 24px;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 48px 24px;
  text-align: center;
}

.empty-title {
  margin-top: 20px;
  font-size: 22px;
  font-weight: 700;
  color: #2e3d36;
}

.empty-subtitle {
  margin-top: 8px;
  font-size: 15px;
  color: #90a4ae;
}

/* Dashboard */
.orders-container {
  width: 100%;
  max-width: 540px;
  padding: 20px 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #1b5e20;
  margin-bottom: 4px;
}

.orders-summary {
  display: flex;
  align-items: center;
}

/* Category sections */
.category-list {
  border-radius: 16px;
  overflow: hidden;
}

.category-section {
  border-radius: 14px !important;
  overflow: hidden;
  border: 1px solid #e0e8e3;
}

.category-section :deep(.category-header) {
  background: linear-gradient(135deg, #2e7d32, #43a047);
  color: white;
  min-height: 56px;
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
}

.category-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
}

/* Order cards */
.order-card {
  border-radius: 12px !important;
  border-color: #e8eeeb !important;
  transition: box-shadow 0.2s ease;
}

.order-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.order-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
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
  color: #78909c;
}

/* Bottom Navigation */
.bottom-nav {
  background: linear-gradient(135deg, #2e7d32, #388e3c) !important;
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
  transition: opacity 0.2s ease;
}

.nav-tabs :deep(.q-tab--active) {
  opacity: 1;
}

.nav-tabs :deep(.q-tab__icon) {
  font-size: 24px;
}
</style>
