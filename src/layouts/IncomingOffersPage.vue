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
            <q-item-section avatar
              ><q-avatar size="40px" class="notif-avatar"
                ><q-icon name="build" size="20px" /></q-avatar
            ></q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">{{ notif.fixerName }}</q-item-label>
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
          >No notifications yet</q-card-section
        >
      </q-card>
    </q-dialog>

    <q-page-container>
      <q-page class="page-content">
        <!-- Loading -->
        <div v-if="loading" class="state-center">
          <q-spinner color="primary" size="48px" />
          <div class="q-mt-md text-grey-7">Loading incoming offers...</div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-center">
          <q-icon name="error_outline" size="72px" color="negative" />
          <div class="state-title">Could not load offers</div>
          <div class="state-sub">{{ error }}</div>
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

        <!-- Empty -->
        <div v-else-if="incomingOffers.length === 0" class="state-center">
          <q-icon name="mark_email_read" size="72px" color="grey-4" />
          <div class="state-title">No incoming offers yet</div>
          <div class="state-sub">When a fixer sends a price, it will appear here.</div>
        </div>

        <!-- Offers list -->
        <div v-else class="offers-shell san3a-animate-in">
          <div class="page-title">Incoming Offers</div>
          <div class="row items-center justify-between q-mb-md">
            <q-badge color="primary" class="q-pa-sm text-body2"
              >{{ filteredOffers.length }}
              {{ filteredOffers.length === 1 ? 'offer' : 'offers' }}</q-badge
            >
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

          <div v-if="filteredOffers.length === 0" class="state-center-inline">
            <q-icon name="filter_alt_off" size="56px" color="grey-4" />
            <div class="state-sub">No offers for selected status.</div>
          </div>

          <div v-for="req in filteredOffers" :key="req.request_id" class="offer-card">
            <div class="offer-card-header">
              <span class="offer-id">Request #{{ req.request_id }}</span>
              <q-badge
                :color="statusColor(req.request_status)"
                :label="req.request_status || 'pending'"
                class="text-capitalize"
              />
            </div>

            <p class="offer-desc">{{ req.description_of_issue || 'No description' }}</p>

            <div v-if="getFixerMessage(req)" class="fixer-message">
              <div class="fixer-message-title">Fixer message</div>
              <div class="fixer-message-body">{{ getFixerMessage(req) }}</div>
            </div>

            <div class="price-row">
              <q-chip
                v-if="req.fixer_price"
                dense
                color="orange-2"
                text-color="orange-9"
                icon="build"
                >Fixer offer: {{ req.fixer_price }} EGP</q-chip
              >
              <q-chip
                v-if="req.customer_price"
                dense
                color="green-2"
                text-color="green-9"
                icon="person"
                >Your offer: {{ req.customer_price }} EGP</q-chip
              >
              <q-chip
                v-if="req.final_price"
                dense
                color="teal-2"
                text-color="teal-9"
                icon="check_circle"
                >Final price: {{ req.final_price }} EGP</q-chip
              >
            </div>

            <div v-if="req.fixerInfo" class="fixer-info">
              <div class="fixer-info-title">Fixer Details</div>
              <div class="fixer-detail-row">
                <q-icon name="person" size="14px" color="grey-7" /><span>{{
                  req.fixerInfo.full_name || 'Unknown fixer'
                }}</span>
              </div>
              <div v-if="req.fixerInfo.phone_number" class="fixer-detail-row">
                <q-icon name="phone" size="14px" color="grey-7" /><span>{{
                  req.fixerInfo.phone_number
                }}</span>
              </div>
              <div
                v-if="
                  req.fixerInfo.years_of_experience !== null &&
                  req.fixerInfo.years_of_experience !== undefined
                "
                class="fixer-detail-row"
              >
                <q-icon name="workspace_premium" size="14px" color="grey-7" /><span
                  >{{ req.fixerInfo.years_of_experience }} years of experience</span
                >
              </div>
            </div>

            <div class="meta-row">
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
            </div>

            <div v-if="isOfferActionable(req)" class="action-row">
              <q-btn
                unelevated
                dense
                color="positive"
                icon="check_circle"
                label="Accept"
                no-caps
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
                no-caps
                class="action-btn"
                :loading="req._rejecting"
                @click="rejectOffer(req)"
              />
              <q-btn
                unelevated
                dense
                color="warning"
                icon="gavel"
                label="Bargain"
                no-caps
                class="action-btn"
                @click="openBargain(req)"
              />
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>

    <!-- Bargain Dialog -->
    <q-dialog v-model="bargainDialog" persistent>
      <q-card class="bargain-card">
        <q-card-section>
          <div class="bargain-title">Make an Offer</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            Fixer's price: <strong>{{ bargainTarget?.fixer_price }} EGP</strong>
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
              color="warning"
              icon="send"
              no-caps
              :loading="bargainLoading"
              @click="submitBargain"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

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
          label="Requests"
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
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useNotificationCenter } from 'src/composables/useNotificationCenter'
import { useArrivalCheck } from 'src/composables/useArrivalCheck'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const activeTab = ref('offers')
const loading = ref(true)
const error = ref(null)
const incomingOffers = ref([])
const showNotifications = ref(false)
const {
  notifications,
  unreadCount,
  setRecipientEmail,
  loadNotifications,
  markAsRead,
  dismissNotification,
  clearAllNotifications,
  recordNotificationForRecipient,
  getNotifMessage,
} = useNotificationCenter()
const customerUserId = ref(null)
const offersSubscription = ref(null)
const messageSubscription = ref(null)
const transientFixerMessages = ref(new Map())
const myBargainChannel = ref(null)

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
  const { error: err } = await confirmArrival(arrivalCheckRequest.value)
  if (err) $q.notify({ type: 'negative', message: 'Failed to update status: ' + err.message })
  else {
    $q.notify({ type: 'positive', message: 'Great! Request is now on-going.' })
    await fetchIncomingOffers()
  }
}

const handleArrivalNo = async () => {
  await reportNoArrival(arrivalCheckRequest.value)
  $q.notify({ type: 'info', message: 'Technician has been notified. Waiting for ETA...' })
}
const statusFilter = ref('all')
const statusFilterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const requestIdFilter = computed(() => {
  const raw = route.query.requestId
  return raw ? String(raw) : null
})

const filteredOffers = computed(() => {
  let offers = incomingOffers.value
  if (requestIdFilter.value)
    return offers.filter((r) => String(r.request_id) === requestIdFilter.value)
  if (statusFilter.value === 'ongoing') {
    return offers.filter((r) => {
      const status = (r.request_status || 'pending').toLowerCase()
      return status !== 'completed' && status !== 'cancelled'
    })
  }
  if (statusFilter.value === 'all') return offers
  return offers.filter((r) => (r.request_status || 'pending').toLowerCase() === statusFilter.value)
})

const isOfferActionable = (req) => {
  const status = (req.request_status || 'pending').toLowerCase()
  return status === 'pending'
}

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
  return new Date(utcStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const setTransientFixerMessage = (requestId, message) => {
  const next = new Map(transientFixerMessages.value)
  if (message) next.set(requestId, message)
  else next.delete(requestId)
  transientFixerMessages.value = next
}

const getFixerMessage = (req) =>
  transientFixerMessages.value.get(req.request_id) || req.fixer_message || ''

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

const fetchIncomingOffers = async () => {
  loading.value = true
  error.value = null
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      error.value = 'You must be signed in.'
      loading.value = false
      return
    }
    setRecipientEmail(user.email)
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
    const { data: requestsData, error: requestsErr } = await supabase
      .from('request')
      .select(
        'request_id, user_id, request_status, description_of_issue, request_date, schedule_time, service_location, payment_method, customer_price, fixer_price, final_price, technician_id, fixer_message',
      )
      .eq('user_id', customer.user_id)
      .not('technician_id', 'is', null)
      .order('request_id', { ascending: false })

    if (requestsErr) {
      error.value = requestsErr.message
      incomingOffers.value = []
    } else {
      const requestRows = requestsData || []
      const technicianIds = [...new Set(requestRows.map((r) => r.technician_id).filter(Boolean))]
      let technicianMap = {}
      if (technicianIds.length) {
        const { data: techRows } = await supabase
          .from('technician')
          .select('technician_id, full_name, email, phone_number, years_of_experience')
          .in('technician_id', technicianIds)
        technicianMap = (techRows || []).reduce((acc, t) => {
          acc[t.technician_id] = t
          return acc
        }, {})
      }
      incomingOffers.value = requestRows.map((r) => ({
        ...r,
        fixerInfo: r.technician_id ? technicianMap[r.technician_id] || null : null,
      }))
    }
    await loadNotifications()
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
      () => fetchIncomingOffers(),
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

const subscribeToFixerBidNotifications = () => {
  if (!customerUserId.value) return
  myBargainChannel.value = supabase
    .channel(`bargain-customer-${customerUserId.value}`)
    .on('broadcast', { event: 'fixer-bid-notification' }, ({ payload }) => {
      if (!payload) return
      notifications.value.unshift({
        id: `rt-customer-${payload.requestId}-${Date.now()}`,
        title: `Fixer ${payload.fixerName || 'Fixer'}`,
        fixerName: `Fixer ${payload.fixerName || 'Fixer'}`,
        message: payload.message
          ? `Sent an offer of ${payload.price} EGP for request #${payload.requestId}.\n\ud83d\udcac "${payload.message}"`
          : `Sent an offer of ${payload.price} EGP for request #${payload.requestId}.`,
        time: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        read: false,
        requestId: payload.requestId,
        routePath: `/incoming-offers?requestId=${payload.requestId}`,
        icon: 'build',
        type: 'offer',
        payload,
      })
      void loadNotifications()
      $q.notify({
        type: 'info',
        icon: 'notifications_active',
        message: `New offer received for request #${payload.requestId}.`,
      })
      fetchIncomingOffers()
    })
    .subscribe()
}

const acceptOffer = async (req) => {
  req._accepting = true
  const { error: reqErr } = await supabase
    .from('request')
    .update({
      request_status: 'accepted',
      final_price: req.fixer_price,
    })
    .eq('request_id', req.request_id)

  req._accepting = false
  if (reqErr)
    $q.notify({
      type: 'negative',
      message: 'Failed to accept: ' + reqErr.message,
    })
  else {
    req.request_status = 'accepted'
    $q.notify({ type: 'positive', message: 'Offer accepted!' })
    await fetchIncomingOffers()
  }
}

const rejectOffer = async (req) => {
  req._rejecting = true
  const { error: err } = await supabase
    .from('request')
    .update({
      fixer_price: null,
      technician_id: null,
    })
    .eq('request_id', req.request_id)
  req._rejecting = false
  if (err) $q.notify({ type: 'negative', message: 'Failed to reject: ' + err.message })
  else {
    $q.notify({ type: 'warning', message: 'Offer rejected.' })
    await fetchIncomingOffers()
  }
}

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

const waitForSubscribed = (channel) =>
  new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('Channel subscription timed out')), 6000)
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeoutId)
        resolve()
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        clearTimeout(timeoutId)
        reject(new Error(`Channel subscription failed: ${status}`))
      }
    })
  })

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
    console.warn('[Bargain] 0 rows updated')
    $q.notify({ type: 'warning', message: 'Update blocked — check database permissions.' })
  } else {
    bargainTarget.value.customer_price = price
    bargainDialog.value = false
    let fixerEmail = bargainTarget.value.fixerInfo?.email || null
    if (!fixerEmail && bargainTarget.value.technician_id) {
      const { data: technicianRow } = await supabase
        .from('technician')
        .select('email')
        .eq('technician_id', bargainTarget.value.technician_id)
        .maybeSingle()
      fixerEmail = technicianRow?.email || null
    }
    if (fixerEmail) {
      const savedNotification = await recordNotificationForRecipient(fixerEmail, {
        title: 'Customer',
        message: `Sent a counter-offer of ${price} EGP for request #${bargainTarget.value.request_id}.`,
        requestId: bargainTarget.value.request_id,
        routePath: '/service-provider?tab=requests',
        type: 'counter-offer',
        icon: 'handshake',
        payload: { requestId: bargainTarget.value.request_id, price },
      })
      if (!savedNotification) {
        console.warn('Counter-offer notification not saved.')
        $q.notify({
          type: 'warning',
          message: 'Counter-offer sent, but notification persistence failed.',
        })
      }
    } else {
      console.warn('Counter-offer notification skipped: fixer email not found.')
      $q.notify({
        type: 'warning',
        message: 'Counter-offer sent, but fixer email was not found for notification.',
      })
    }
    $q.notify({ type: 'positive', message: 'Your offer has been sent!' })
    const target = bargainTarget.value
    if (target.technician_id) {
      const fixerChannel = supabase.channel(`bargain-fixer-${target.technician_id}`)
      try {
        await waitForSubscribed(fixerChannel)
        const sendStatus = await fixerChannel.send({
          type: 'broadcast',
          event: 'customer-bargain-notification',
          payload: { requestId: target.request_id, price },
        })
        if (sendStatus !== 'ok') console.warn('Counter-offer broadcast send status:', sendStatus)
      } catch (broadcastError) {
        console.warn('Counter-offer broadcast failed:', broadcastError)
      } finally {
        supabase.removeChannel(fixerChannel)
      }
    }
  }
}

onMounted(async () => {
  await fetchIncomingOffers()
  await loadNotifications()
  subscribeToIncomingOffers()
  subscribeToFixerMessages()
  subscribeToFixerBidNotifications()
  startCustomerChecks(customerUserId.value)
})
onBeforeUnmount(() => {
  offersSubscription.value?.unsubscribe()
  messageSubscription.value?.unsubscribe()
  myBargainChannel.value?.unsubscribe()
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
}
.state-center {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
}
.state-center-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0 24px;
}
.state-title {
  margin-top: 16px;
  font-size: 22px;
  font-weight: 700;
  color: var(--san3a-gray-800);
}
.state-sub {
  margin-top: 8px;
  font-size: 15px;
  color: var(--san3a-gray-500);
}

.offers-shell {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 16px;
}
.page-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--san3a-primary);
  margin-bottom: 10px;
  letter-spacing: -0.01em;
  line-height: 1.2;
}
.status-filter {
  width: 160px;
}

.offer-card {
  background: #fff;
  border: 1px solid var(--san3a-gray-200);
  border-radius: var(--san3a-radius-xl);
  padding: 20px;
  margin-bottom: 14px;
  transition:
    box-shadow 0.2s,
    transform 0.2s,
    border-color 0.2s;
}
.offer-card:hover {
  box-shadow: var(--san3a-shadow-md);
  transform: translateY(-2px);
  border-color: rgba(13, 115, 119, 0.24);
}
.offer-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.offer-id {
  font-size: 15px;
  font-weight: 700;
  color: var(--san3a-gray-900);
}
.offer-desc {
  font-size: 14px;
  color: var(--san3a-gray-700);
  line-height: 1.6;
  margin: 0 0 12px;
  white-space: pre-line;
}
.price-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--san3a-gray-500);
}

.fixer-info {
  border: 1px solid var(--san3a-gray-200);
  border-radius: var(--san3a-radius-lg);
  padding: 10px 12px;
  background: var(--san3a-gray-50);
  margin-bottom: 12px;
}
.fixer-info-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--san3a-primary);
  margin-bottom: 6px;
}
.fixer-detail-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--san3a-gray-600);
  margin-bottom: 2px;
}

.fixer-message {
  border-left: 3px solid var(--san3a-warning);
  background: var(--san3a-warning-light);
  border-radius: var(--san3a-radius-md);
  padding: 8px 10px;
  margin-bottom: 12px;
}
.fixer-message-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--san3a-secondary);
  margin-bottom: 2px;
}
.fixer-message-body {
  font-size: 13px;
  color: var(--san3a-gray-700);
  white-space: pre-line;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.action-btn {
  border-radius: 999px !important;
  font-size: 13px;
  padding: 4px 16px !important;
  font-weight: 700;
}

.bargain-card {
  min-width: 300px;
  border-radius: var(--san3a-radius-xl) !important;
}
.bargain-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--san3a-secondary);
}

.page-content :deep(.q-btn:focus-visible),
.page-content :deep(.q-tab:focus-visible),
.page-content :deep(.q-field__control:focus-within) {
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
  .offers-shell {
    padding: 18px 14px;
  }
  .page-title {
    font-size: 24px;
  }
  .status-filter {
    width: 140px;
  }
}
</style>
