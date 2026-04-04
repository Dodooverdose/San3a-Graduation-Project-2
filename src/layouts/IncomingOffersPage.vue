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
        <div v-if="loading" class="state-wrap">
          <q-spinner color="primary" size="48px" />
          <div class="q-mt-md text-grey-7">Loading incoming offers...</div>
        </div>

        <div v-else-if="error" class="state-wrap">
          <q-icon name="error_outline" size="72px" color="negative" />
          <div class="state-title">Could not load offers</div>
          <div class="state-subtitle">{{ error }}</div>
          <q-btn
            unelevated
            color="primary"
            label="Retry"
            icon="refresh"
            rounded
            class="q-mt-md"
            @click="fetchIncomingOffers"
          />
        </div>

        <div v-else-if="incomingOffers.length === 0" class="state-wrap">
          <q-icon name="mark_email_read" size="72px" color="grey-4" />
          <div class="state-title">No incoming offers yet</div>
          <div class="state-subtitle">When a fixer sends a price, it will appear here.</div>
        </div>

        <div v-else class="offers-container">
          <div class="page-title">Incoming Offers</div>
          <div class="row items-center justify-between q-col-gutter-sm q-mb-md">
            <q-badge color="primary" class="q-pa-sm text-body2">
              {{ filteredOffers.length }} {{ filteredOffers.length === 1 ? 'offer' : 'offers' }}
            </q-badge>

            <q-select
              v-model="statusFilter"
              :options="statusFilterOptions"
              emit-value
              map-options
              dense
              outlined
              class="status-filter"
              label="Status"
            />
          </div>

          <div v-if="filteredOffers.length === 0" class="state-wrap state-wrap-inline">
            <q-icon name="filter_alt_off" size="56px" color="grey-4" />
            <div class="state-subtitle">No offers for selected status.</div>
          </div>

          <q-card
            v-for="req in filteredOffers"
            :key="req.request_id"
            flat
            bordered
            class="offer-card q-mb-sm"
          >
            <q-card-section class="q-py-sm">
              <div class="row items-center justify-between q-mb-xs">
                <div class="text-subtitle2 text-weight-bold">Request #{{ req.request_id }}</div>
                <q-badge
                  :color="statusColor(req.request_status)"
                  :label="req.request_status || 'pending'"
                  class="text-capitalize"
                />
              </div>

              <div class="text-body2 text-grey-8 q-mb-sm" style="white-space: pre-line">
                {{ req.description_of_issue || 'No description' }}
              </div>

              <div class="price-row q-mb-sm">
                <q-chip dense color="orange-2" text-color="orange-9" icon="build">
                  Fixer offer: {{ req.fixer_price }} EGP
                </q-chip>
                <q-chip
                  v-if="req.customer_price"
                  dense
                  color="green-2"
                  text-color="green-9"
                  icon="person"
                >
                  Your budget: {{ req.customer_price }} EGP
                </q-chip>
              </div>

              <div v-if="getFixerMessage(req)" class="fixer-message q-mb-sm">
                <div class="fixer-message-title">Fixer message</div>
                <div class="fixer-message-body">{{ getFixerMessage(req) }}</div>
              </div>

              <div v-if="req.fixerInfo" class="fixer-info q-mb-sm">
                <div class="fixer-title">Fixer Details</div>
                <div class="fixer-detail-row">
                  <q-icon name="person" size="14px" color="grey-7" />
                  <span>{{ req.fixerInfo.full_name || 'Unknown fixer' }}</span>
                </div>
                <div v-if="req.fixerInfo.phone_number" class="fixer-detail-row">
                  <q-icon name="phone" size="14px" color="grey-7" />
                  <span>{{ req.fixerInfo.phone_number }}</span>
                </div>
                <div
                  v-if="
                    req.fixerInfo.years_of_experience !== null &&
                    req.fixerInfo.years_of_experience !== undefined
                  "
                  class="fixer-detail-row"
                >
                  <q-icon name="workspace_premium" size="14px" color="grey-7" />
                  <span>{{ req.fixerInfo.years_of_experience }} years of experience</span>
                </div>
              </div>

              <div class="meta-row">
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
              </div>

              <div
                v-if="!req.request_status || req.request_status.toLowerCase() === 'pending'"
                class="action-row q-mt-sm"
              >
                <q-btn
                  unelevated
                  dense
                  color="positive"
                  icon="check_circle"
                  label="Accept"
                  class="action-btn"
                  :loading="req._accepting"
                  @click="acceptOffer(req)"
                />
                <q-btn
                  unelevated
                  dense
                  color="negative"
                  icon="cancel"
                  label="Reject"
                  class="action-btn"
                  :loading="req._rejecting"
                  @click="rejectOffer(req)"
                />
                <q-btn
                  unelevated
                  dense
                  color="orange"
                  icon="gavel"
                  label="Bargain"
                  class="action-btn"
                  @click="openBargain(req)"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-page>
    </q-page-container>

    <!-- Bargain Dialog -->
    <q-dialog v-model="bargainDialog" persistent>
      <q-card style="min-width: 300px; border-radius: 14px">
        <q-card-section>
          <div class="text-h6 text-weight-bold" style="color: #e65100">Make an Offer</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            Fixer's price:
            <strong>{{ bargainTarget?.fixer_price }} EGP</strong>
          </div>
        </q-card-section>

        <q-form ref="bargainForm">
          <q-card-section class="q-pt-none">
            <q-input
              v-model.number="bargainPrice"
              type="number"
              label="Your counter-offer (EGP)"
              outlined
              dense
              autofocus
              min="1"
              :rules="[(v) => (!!v && Number(v) > 0) || 'Enter a valid price']"
              @keyup.enter="submitBargain"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="grey-7" v-close-popup />
            <q-btn
              unelevated
              label="Send Offer"
              color="orange"
              icon="send"
              :loading="bargainLoading"
              @click="submitBargain"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
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
          label="Requests"
          @click="$router.push('/incoming-offers')"
        />
        <q-tab name="orders" icon="receipt_long" label="Orders" @click="$router.push('/orders')" />
        <q-tab name="profile" icon="person" label="Profile" @click="$router.push('/profile')" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const activeTab = ref('offers')
const loading = ref(true)
const error = ref(null)
const incomingOffers = ref([])
const showNotifications = ref(false)
const notifications = ref([])
const customerUserId = ref(null)
const offersSubscription = ref(null)
const messageSubscription = ref(null)
const knownOfferPrices = ref(new Map())
const transientFixerMessages = ref(new Map())
const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)
const statusFilter = ref('all')
const statusFilterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const requestIdFilter = computed(() => {
  const raw = route.query.requestId
  if (!raw) return null
  return String(raw)
})

const filteredOffers = computed(() => {
  let offers = incomingOffers.value

  if (requestIdFilter.value) {
    offers = offers.filter((r) => String(r.request_id) === requestIdFilter.value)
    return offers
  }

  if (statusFilter.value === 'all') {
    return offers
  }
  return offers.filter((r) => (r.request_status || 'pending').toLowerCase() === statusFilter.value)
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

const setTransientFixerMessage = (requestId, message) => {
  const next = new Map(transientFixerMessages.value)
  if (message) {
    next.set(requestId, message)
  } else {
    next.delete(requestId)
  }
  transientFixerMessages.value = next
}

const getFixerMessage = (req) => {
  return transientFixerMessages.value.get(req.request_id) || req.fixer_message || ''
}

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

const fetchIncomingOffers = async () => {
  loading.value = true
  error.value = null

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      error.value = 'You must be signed in to view incoming offers.'
      loading.value = false
      return
    }

    const { data: customer } = await supabase
      .from('users')
      .select('user_id')
      .ilike('email', user.email)
      .maybeSingle()

    if (!customer?.user_id) {
      customerUserId.value = null
      incomingOffers.value = []
      loading.value = false
      return
    }

    customerUserId.value = customer.user_id

    const { data, error: fetchErr } = await supabase
      .from('request')
      .select('*')
      .eq('user_id', customer.user_id)
      .not('fixer_price', 'is', null)
      .order('request_date', { ascending: false })

    if (fetchErr) {
      error.value = fetchErr.message
      incomingOffers.value = []
    } else {
      const offers = data || []
      const technicianIds = [...new Set(offers.map((r) => r.technician_id).filter(Boolean))]

      let technicianMap = {}
      if (technicianIds.length) {
        const { data: techRows } = await supabase
          .from('technician')
          .select('technician_id, full_name, phone_number, years_of_experience')
          .in('technician_id', technicianIds)

        technicianMap = (techRows || []).reduce((acc, t) => {
          acc[t.technician_id] = t
          return acc
        }, {})
      }

      incomingOffers.value = offers.map((r) => ({
        ...r,
        fixerInfo: r.technician_id ? technicianMap[r.technician_id] || null : null,
      }))

      knownOfferPrices.value = new Map(
        incomingOffers.value.map((offer) => [offer.request_id, offer.fixer_price]),
      )
    }
  } catch (err) {
    error.value = 'An unexpected error occurred.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const subscribeToIncomingOffers = () => {
  if (!customerUserId.value) return

  offersSubscription.value?.unsubscribe()

  offersSubscription.value = supabase
    .channel(`incoming-offers-${customerUserId.value}`)
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

        if (hasNewBid) {
          const notificationItem = {
            fixerName: next.technician_id ? 'Fixer' : 'System',
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
            message: `New fixer bid received for request #${requestId}.`,
          })
          fetchIncomingOffers()
        }
      },
    )
    .subscribe()
}

const subscribeToFixerMessages = () => {
  messageSubscription.value?.unsubscribe()

  messageSubscription.value = supabase
    .channel('customer-offer-events')
    .on('broadcast', { event: 'fixer-bid-message' }, ({ payload }) => {
      if (!payload || !customerUserId.value) return
      if (String(payload.customerUserId) !== String(customerUserId.value)) return
      setTransientFixerMessage(payload.requestId, payload.message)
    })
    .subscribe()
}

const acceptOffer = async (req) => {
  req._accepting = true
  const { error: err } = await supabase
    .from('request')
    .update({
      request_status: 'accepted',
      final_price: req.fixer_price,
    })
    .eq('request_id', req.request_id)
  req._accepting = false
  if (err) {
    $q.notify({ type: 'negative', message: 'Failed to accept: ' + err.message })
  } else {
    req.request_status = 'accepted'
    $q.notify({ type: 'positive', message: 'Offer accepted!' })
  }
}

const rejectOffer = async (req) => {
  req._rejecting = true
  const { error: err } = await supabase
    .from('request')
    .update({ request_status: 'cancelled' })
    .eq('request_id', req.request_id)
  req._rejecting = false
  if (err) {
    $q.notify({ type: 'negative', message: 'Failed to reject: ' + err.message })
  } else {
    req.request_status = 'cancelled'
    $q.notify({ type: 'warning', message: 'Offer rejected.' })
  }
}

// Bargain
const bargainDialog = ref(false)
const bargainTarget = ref(null)
const bargainPrice = ref(null)
const bargainLoading = ref(false)
const bargainForm = ref(null)

const openBargain = (req) => {
  bargainTarget.value = req
  bargainPrice.value = req.customer_price ? Number(req.customer_price) : null
  bargainDialog.value = true
}

const submitBargain = async () => {
  const valid = await bargainForm.value?.validate()
  if (!valid) return
  const price = Number(bargainPrice.value)
  if (!price || price <= 0) return
  bargainLoading.value = true
  const { data, error: err } = await supabase
    .from('request')
    .update({ customer_price: price })
    .eq('request_id', bargainTarget.value.request_id)
    .select()
  bargainLoading.value = false
  if (err) {
    console.error('[Bargain] Supabase error:', err)
    $q.notify({ type: 'negative', message: 'Failed to save offer: ' + err.message })
  } else if (!data || data.length === 0) {
    console.warn('[Bargain] 0 rows updated — check RLS policies on the request table.')
    $q.notify({
      type: 'warning',
      message: 'Update blocked — check database permissions.',
    })
  } else {
    bargainTarget.value.customer_price = price
    bargainDialog.value = false
    $q.notify({ type: 'positive', message: 'Your offer has been sent!' })
  }
}

onMounted(async () => {
  await fetchIncomingOffers()
  subscribeToIncomingOffers()
  subscribeToFixerMessages()
})

onBeforeUnmount(() => {
  offersSubscription.value?.unsubscribe()
  messageSubscription.value?.unsubscribe()
})
</script>

<style scoped>
.page-content {
  padding-bottom: 80px;
}

.state-wrap {
  min-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
}

.state-title {
  margin-top: 16px;
  font-size: 22px;
  font-weight: 700;
  color: #2e3d36;
}

.state-subtitle {
  margin-top: 8px;
  font-size: 15px;
  color: #90a4ae;
}

.offers-container {
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
  padding: 20px 16px;
}

.status-filter {
  width: 150px;
}

.state-wrap-inline {
  min-height: auto;
  padding: 20px 0 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #1b5e20;
  margin-bottom: 8px;
}

.offer-card {
  border-radius: 12px !important;
  border-color: #e8eeeb !important;
}

.price-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-row {
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

.fixer-info {
  border: 1px solid #e8eeeb;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fafdfb;
}

.fixer-title {
  font-size: 12px;
  font-weight: 700;
  color: #2e7d32;
  margin-bottom: 6px;
}

.fixer-detail-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #455a64;
}

.fixer-message {
  border-left: 3px solid #f9a825;
  background: #fff8e1;
  border-radius: 8px;
  padding: 8px 10px;
}

.fixer-message-title {
  font-size: 12px;
  font-weight: 700;
  color: #e65100;
  margin-bottom: 2px;
}

.fixer-message-body {
  font-size: 13px;
  color: #5d4037;
  white-space: pre-line;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  border-radius: 20px;
  font-size: 12px;
  padding: 0 14px;
}
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
