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

    <!-- Notifications Panel -->
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
            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn
                  dense
                  flat
                  round
                  color="positive"
                  icon="check"
                  size="sm"
                  @click.stop="acceptOffer(i)"
                />
                <q-btn
                  dense
                  flat
                  round
                  color="negative"
                  icon="close"
                  size="sm"
                  @click.stop="declineOffer(i)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-section v-else class="text-center text-grey-5 q-py-lg">
          No Offers Yet
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-page-container>
      <q-page class="page-content">
        <div class="home-shell q-pa-md">
          <q-card flat bordered class="hero-card q-mb-lg">
            <q-card-section class="hero-card__content">
              <div class="hero-copy">
                <div class="hero-eyebrow">Welcome back</div>
                <div class="hero-title">What do you need help with today?</div>
                <div class="hero-subtitle">
                  Pick a service, review your latest requests, or jump straight into the requests tab.
                </div>
              </div>

              <div class="hero-actions">
                <q-btn
                  color="white"
                  text-color="primary"
                  unelevated
                  icon="assignment"
                  label="Requests"
                  @click="goToPage('/incoming-offers')"
                />
                <q-btn flat color="white" icon="person" label="Profile" @click="goToPage('/profile')" />
              </div>
            </q-card-section>
          </q-card>

          <div class="home-grid">
          <div
            v-for="(item, idx) in items"
            :key="idx"
            class="grid-item"
            @click="goToPage(item.route)"
          >
            <q-card flat bordered class="icon-card">
              <div class="icon-box">
                <img :src="item.icon" alt="icon" />
              </div>
              <div class="label">{{ item.label }}</div>
            </q-card>
          </div>

          </div>

          <q-card flat bordered class="recent-requests-card q-mt-lg" @click="goToPage('/incoming-offers')">
            <q-card-section class="row items-center justify-between q-pb-sm">
              <div>
                <div class="text-subtitle1 text-weight-bold">Recent Requests</div>
                <div class="text-caption text-grey-7">A quick look at your latest two requests</div>
              </div>
              <q-chip outline color="primary" icon="chevron_right">Open Requests</q-chip>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <div v-if="loadingRecentRequests" class="text-center q-py-md text-grey-6">
                Loading recent requests...
              </div>

              <div v-else-if="recentRequests.length === 0" class="text-center q-py-lg text-grey-6">
                No requests yet. Create your first request from the service categories above.
              </div>

              <div v-else class="recent-list">
                <div v-for="req in recentRequests" :key="req._id" class="recent-request-item">
                  <div class="row items-start no-wrap q-gutter-sm">
                    <q-avatar size="40px" color="primary" text-color="white" icon="assignment" />
                    <div class="recent-request-copy">
                      <div class="row items-center q-gutter-sm q-mb-xs">
                        <div class="text-weight-medium">Request #{{ req._id }}</div>
                        <q-badge :color="getStatusColor(req._status)">{{ req._status }}</q-badge>
                      </div>
                      <div class="text-body2 text-grey-8">
                        {{ req._category }}
                      </div>
                      <div class="text-caption text-grey-6 recent-request-description">
                        {{ req._description || 'No description provided' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
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
  </q-layout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useNotificationCenter } from 'src/composables/useNotificationCenter'

const router = useRouter()
const $q = useQuasar()
const { notifications, unreadCount, setRecipientEmail, loadNotifications, markAsRead } =
  useNotificationCenter()

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

const acceptOffer = (index) => {
  const notif = notifications.value[index]
  markAsRead(index)
  $q.notify({ type: 'positive', message: `Accepted offer from ${notif.fixerName}` })
}

const declineOffer = (index) => {
  const notif = notifications.value[index]
  markAsRead(index)
  $q.notify({ type: 'warning', message: `Declined offer from ${notif.fixerName}` })
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
.page-content {
  display: flex;
  flex-direction: column;
  padding-bottom: 72px; /* space for fixed bottom nav */
}

.home-shell {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.hero-card {
  border-radius: 20px;
  background: linear-gradient(135deg, #1b5e20, #43a047 55%, #66bb6a);
  color: #ffffff;
  overflow: hidden;
  position: relative;
}

.hero-card::after {
  content: '';
  position: absolute;
  right: -40px;
  top: -40px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.hero-card__content {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  position: relative;
  z-index: 1;
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
  line-height: 1.1;
  font-weight: 800;
  margin-top: 6px;
}

.hero-subtitle {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.6;
  max-width: 520px;
  opacity: 0.92;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.home-grid {
  width: 100%;
  max-width: 900px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  justify-items: center;
  padding: 12px 0 0;
}

.grid-item {
  width: 100%;
  cursor: pointer;
}

.icon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 12px 14px;
  border-radius: 16px !important;
  background: #f7f9f8;
  border: 1px solid #e8eeeb !important;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.icon-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.15);
}

.icon-card:active {
  transform: scale(0.97);
}

.icon-box {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-box img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.label {
  margin-top: 12px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  color: #2e3d36;
  line-height: 1.3;
}

.recent-requests-card {
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #f7fbf8);
  border: 1px solid #e3ece6 !important;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.recent-requests-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(28, 72, 41, 0.08);
}

.recent-list {
  display: grid;
  gap: 12px;
}

.recent-request-item {
  border-radius: 14px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #edf2ee;
}

.recent-request-copy {
  flex: 1;
  min-width: 0;
}

.recent-request-description {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 599px) {
  .hero-card__content {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-title {
    font-size: 24px;
  }

  .hero-actions {
    width: 100%;
    align-items: stretch;
  }

  .hero-actions .q-btn {
    width: 100%;
  }
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
