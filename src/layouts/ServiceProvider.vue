<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Header -->
    <q-header class="app-header-teal">
      <q-toolbar class="app-toolbar">
        <div class="header-brand">
          <div class="header-brand-icon-w">
            <img src="/icons/White.png" alt="San3a logo" class="brand-logo-mark" />
          </div>
          <span class="header-brand-name-w">San3a</span>
        </div>
        <q-space />
        <q-btn
          flat
          round
          dense
          icon="notifications"
          class="notif-btn-w"
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
            @click="markAsRead(i)"
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
        <q-card-section v-else class="text-center text-grey-5 q-py-lg"
          >No Offers Yet</q-card-section
        >
      </q-card>
    </q-dialog>

    <q-page-container>
      <q-page class="page-content">
        <div v-if="loading" class="state-center">
          <q-spinner-dots size="48px" color="primary" />
        </div>

        <div v-else class="dashboard-shell san3a-animate-in">
          <!-- Welcome -->
          <div class="welcome-card">
            <div class="welcome-deco"></div>
            <div class="welcome-content">
              <div class="welcome-name">Welcome, {{ fullName }}!</div>
              <div class="welcome-specialty">
                <q-badge :color="specialtyColor" class="spec-badge">{{ specialtyLabel }}</q-badge>
                <img
                  v-if="specialtyIcon"
                  :src="specialtyIcon"
                  :alt="specialtyLabel"
                  class="spec-icon"
                />
              </div>
              <div class="welcome-meta">
                You are registered as a <strong>{{ specialtyLabel }}</strong
                >.
                <span v-if="yearsOfExperience !== null">
                  You have <strong>{{ yearsOfExperience }}</strong> year{{
                    yearsOfExperience === 1 ? '' : 's'
                  }}
                  of experience.</span
                >
              </div>
            </div>
          </div>

          <!-- Tab switcher -->
          <q-tabs
            v-model="activeTab"
            dense
            no-caps
            class="section-tabs"
            active-color="primary"
            indicator-color="primary"
            align="justify"
          >
            <q-tab
              name="requests"
              icon="request_page"
              label="Incoming Requests"
              @click="setActiveTab('requests')"
            />
            <q-tab
              name="orders"
              icon="receipt_long"
              label="Accepted Orders"
              @click="setActiveTab('orders')"
            />
          </q-tabs>

          <transition name="tab-switch" mode="out-in">
            <div :key="activeTab" class="full-width">
              <div class="tab-header">
                <div class="tab-title">
                  {{ activeTab === 'orders' ? 'Accepted Orders' : 'Incoming Requests' }}
                </div>
                <q-badge
                  v-if="requests.length"
                  color="primary"
                  :label="`${requests.length} ${activeTab === 'orders' ? 'order' : 'request'}${requests.length > 1 ? 's' : ''}`"
                  class="q-pa-sm"
                />
              </div>

              <!-- Filters (requests tab only) -->
              <div v-if="activeTab === 'requests'" class="filters-row">
                <q-select
                  v-model="selectedDistricts"
                  :options="cairoDistricts"
                  label="Filter by District"
                  outlined
                  dense
                  multiple
                  use-chips
                  clearable
                  class="filter-select"
                >
                  <template #prepend><q-icon name="location_city" /></template>
                </q-select>
                <q-select
                  v-model="selectedPaymentMethod"
                  :options="paymentMethodOptions"
                  label="Filter by Payment"
                  outlined
                  dense
                  clearable
                  emit-value
                  map-options
                  class="filter-select"
                >
                  <template #prepend><q-icon name="payments" /></template>
                </q-select>
              </div>

              <!-- Loading -->
              <div v-if="requestsLoading" class="state-center-sm">
                <q-spinner color="primary" size="48px" />
                <div class="q-mt-md text-grey-7">Loading requests...</div>
              </div>

              <!-- Error -->
              <div v-else-if="requestsError" class="state-center-sm">
                <q-icon name="error" size="64px" color="negative" />
                <div class="state-title">Failed to load requests</div>
                <div class="state-sub">{{ requestsError }}</div>
                <q-btn
                  flat
                  color="primary"
                  label="Retry"
                  icon="refresh"
                  class="q-mt-sm"
                  @click="activeTab === 'orders' ? fetchAcceptedOrders() : fetchRequests()"
                />
              </div>

              <!-- Empty -->
              <div v-else-if="filteredRequests.length === 0" class="state-center-sm">
                <q-icon name="inbox" size="64px" color="grey-4" />
                <div class="state-title">
                  {{
                    activeTab === 'orders'
                      ? 'No accepted orders yet.'
                      : selectedDistricts.length
                        ? 'No requests in selected districts.'
                        : 'No requests available for your specialty yet.'
                  }}
                </div>
              </div>

              <!-- Request Cards -->
              <div v-else class="request-list">
                <div v-for="req in filteredRequests" :key="req.request_id" class="req-card">
                  <div class="req-header">
                    <span class="req-id">Request #{{ req.request_id }}</span>
                    <div class="row q-gutter-xs">
                      <q-badge
                        v-if="req.urgency"
                        :color="req.urgency === 'urgent' ? 'red' : 'blue'"
                        :label="req.urgency"
                      />
                      <q-badge
                        :color="statusColor(req.request_status)"
                        :label="req.request_status || 'pending'"
                      />
                    </div>
                  </div>

                  <div v-if="req.customer_name" class="req-customer">
                    <q-icon name="person" size="16px" color="grey-7" />
                    <span>{{ req.customer_name }}</span>
                  </div>

                  <p class="req-desc">{{ req.description_of_issue || 'No description' }}</p>

                  <div class="req-meta">
                    <div v-if="req.request_date" class="meta-item">
                      <q-icon name="event" size="14px" color="grey-6" /><span>{{
                        formatDate(req.request_date)
                      }}</span>
                    </div>
                    <div v-if="req.schedule_time" class="meta-item">
                      <q-icon name="schedule" size="14px" color="grey-6" /><span
                        >Scheduled: {{ formatDate(req.schedule_time) }}</span
                      >
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
                    <div v-if="req.customer_price" class="meta-item price">
                      <q-icon name="sell" size="14px" color="green-7" /><span
                        >Customer budget: {{ req.customer_price }} EGP</span
                      >
                    </div>
                  </div>

                  <!-- Action area -->
                  <div class="req-actions">
                    <div v-if="req.myOffer" class="offer-status">
                      <q-icon name="check_circle" color="positive" size="sm" />
                      <span>Offer submitted: {{ req.myOffer.offered_price }} EGP</span>
                      <q-badge
                        :color="
                          req.myOffer.status === 'accepted'
                            ? 'green'
                            : req.myOffer.status === 'rejected'
                              ? 'red'
                              : 'orange'
                        "
                        :label="req.myOffer.status"
                        class="q-ml-sm"
                      />
                    </div>
                    <q-btn
                      v-if="activeTab !== 'orders' && (!req.myOffer || isOfferAccepted(req))"
                      :color="isOfferAccepted(req) ? 'grey-5' : 'primary'"
                      :label="isOfferAccepted(req) ? 'Place Bid (Accepted)' : 'Place Bid'"
                      icon="gavel"
                      no-caps
                      unelevated
                      class="full-width q-mt-sm"
                      :disable="isOfferAccepted(req)"
                      @click="openOfferDialog(req)"
                    />
                    <div
                      v-if="canRespondToCustomerOffer(req)"
                      class="row items-center q-gutter-sm q-mt-sm"
                    >
                      <q-btn
                        unelevated
                        dense
                        color="positive"
                        icon="check_circle"
                        label="Accept Customer Offer"
                        no-caps
                        :loading="acceptingCounterOfferId === req.request_id"
                        @click="acceptCustomerOffer(req)"
                      />
                      <q-btn
                        unelevated
                        dense
                        color="warning"
                        icon="gavel"
                        label="Bargain"
                        no-caps
                        @click="openCounterOfferDialog(req)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </q-page>
    </q-page-container>

    <!-- Offer Dialog -->
    <q-dialog v-model="offerDialogOpen" persistent>
      <q-card class="offer-dialog">
        <q-card-section>
          <div class="dialog-title">Place Your Bid</div>
          <div v-if="offerTarget" class="text-caption text-grey-7 q-mt-xs">
            Request #{{ offerTarget.request_id }}
            <span v-if="offerTarget.customer_price">
              — Customer budget: {{ offerTarget.customer_price }} EGP</span
            >
          </div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="offerPrice"
            type="number"
            outlined
            label="Your Price (EGP)"
            prefix="EGP"
            :rules="[(val) => val > 0 || 'Price must be greater than 0']"
            class="q-mb-md"
          >
            <template #prepend><q-icon name="sell" /></template>
          </q-input>
          <q-input
            v-model="offerMessage"
            type="textarea"
            outlined
            label="Message (optional)"
            autogrow
            :input-style="{ minHeight: '80px' }"
          >
            <template #prepend><q-icon name="message" /></template>
          </q-input>
        </q-card-section>
        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Cancel" color="grey-7" @click="offerDialogOpen = false" />
          <q-btn
            label="Submit Offer"
            color="primary"
            icon="send"
            no-caps
            unelevated
            :loading="offerSubmitting"
            :disable="!offerPrice || offerPrice <= 0"
            @click="submitOffer"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Bottom Nav -->
    <q-footer elevated class="bottom-nav">
      <q-tabs
        v-model="navTab"
        active-color="white"
        indicator-color="transparent"
        class="nav-tabs"
        narrow-indicator
        dense
      >
        <q-tab
          name="requests"
          icon="request_page"
          label="Requests"
          @click="setActiveTab('requests')"
        />
        <q-tab name="orders" icon="receipt_long" label="Orders" @click="setActiveTab('orders')" />
        <q-tab name="profile" icon="person" label="Profile" @click="goToPage('/profile')" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useNotificationCenter } from 'src/composables/useNotificationCenter'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const {
  notifications,
  unreadCount,
  setRecipientEmail,
  loadNotifications,
  markAsRead,
  recordNotificationForRecipient,
} = useNotificationCenter()

const showNotifications = ref(false)
const activeTab = ref('requests')
const navTab = ref('requests')

const goToPage = (r) => {
  if (r) router.push(r)
}

const setActiveTab = async (tab) => {
  activeTab.value = tab
  navTab.value = tab
  if (tab === 'orders') {
    await fetchAcceptedOrders()
    return
  }
  await fetchRequests()
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

const loading = ref(true)
const fullName = ref('')
const specialty = ref('')
const technicianId = ref(null)
const yearsOfExperience = ref(null)
const requests = ref([])
const requestsLoading = ref(false)
const requestsError = ref(null)
const selectedDistricts = ref([])
const selectedPaymentMethod = ref(null)
const offerDialogOpen = ref(false)
const offerTarget = ref(null)
const offerPrice = ref(null)
const offerMessage = ref('')
const offerSubmitting = ref(false)
const acceptingCounterOfferId = ref(null)
const customerOfferEventsChannel = supabase.channel('customer-offer-events')
const myBargainChannel = ref(null)

const cairoDistricts = [
  'Downtown / Wust El-Balad',
  'Abdeen',
  'Azbakeya',
  "Bab El-Sha'reya",
  'El-Gamaliya',
  'El-Mosky',
  'El-Darb El-Ahmar',
  'El-Khalifa',
  'El-Sayeda Zeinab',
  'Zamalek',
  'Garden City',
  'Bulaq',
  'Shubra',
  'Rod El-Farag',
  'El-Sharabiya',
  'El-Zawya El-Hamra',
  'El-Wayli',
  'Abbassia',
  'Heliopolis / Masr El-Gedida',
  'Nasr City',
  'Ain Shams',
  'El-Matareya',
  'El-Marg',
  'El-Salam',
  'Maadi',
  'Misr El-Kadima / Old Cairo',
  'Basatin',
  'Helwan',
  '15th of May City',
  'Tura',
  'New Cairo / El-Tagammu',
  'Rehab City',
  'Madinaty',
  'Shorouk City',
  'Obour City',
  'Badr City',
  'Dokki',
  'Mohandessin',
  'Agouza',
  'Imbaba',
  'Bulaq El-Dakrour',
  'El-Haram',
  'Faisal',
  'El-Omraniya',
  'Giza',
  '6th of October City',
  'Sheikh Zayed',
  'Hadayek El-Ahram',
]

const paymentMethodOptions = [
  { label: 'Cash', value: 'cash' },
  { label: 'Instapay', value: 'instapay' },
]

const specialtyMap = {
  plumber: { label: 'Plumber', icon: '/icons/plumbing.png', color: 'blue' },
  electrician: { label: 'Electrician', icon: '/icons/electrical.png', color: 'amber-8' },
  carpenter: { label: 'Carpenter', icon: '/icons/carpentry.png', color: 'brown' },
  painter: { label: 'Painter', icon: '/icons/painters.png', color: 'purple' },
  kitchen_fitter: { label: 'Kitchen Fitter', icon: '/icons/kitchen.png', color: 'green' },
  drapery_seamstress: { label: 'Drapery Seamstress', icon: '/icons/drapery.png', color: 'pink' },
}

const specialtyLabel = ref('Service Provider')
const specialtyIcon = ref(null)
const specialtyColor = ref('primary')

const filteredRequests = computed(() => {
  if (activeTab.value === 'orders') return requests.value
  return requests.value.filter((request) => {
    const matchesDistrict =
      !selectedDistricts.value.length || selectedDistricts.value.includes(request.service_location)
    const matchesPayment =
      !selectedPaymentMethod.value || request.payment_method === selectedPaymentMethod.value
    return matchesDistrict && matchesPayment
  })
})

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

const statusColor = (status) =>
  ({ pending: 'orange', accepted: 'blue', completed: 'green', cancelled: 'red' })[
    status?.toLowerCase()
  ] || 'grey'
const isOfferAccepted = (req) => {
  const rs = (req?.request_status || '').toLowerCase()
  const ms = (req?.myOffer?.status || '').toLowerCase()
  return rs === 'accepted' || ms === 'accepted'
}
const canRespondToCustomerOffer = (req) => {
  if (!req?.myOffer) return false
  if ((req.myOffer.status || 'pending').toLowerCase() !== 'pending') return false
  if (
    req.myOffer.customer_counter_price === null ||
    req.myOffer.customer_counter_price === undefined
  )
    return false
  const co = Number(req.myOffer.customer_counter_price)
  const mo = Number(req.myOffer.offered_price)
  if (!Number.isFinite(co) || !Number.isFinite(mo)) return false
  return co !== mo
}

const fetchRequests = async () => {
  if (!specialty.value || !technicianId.value) return
  requestsLoading.value = true
  requestsError.value = null
  const { data, error } = await supabase
    .from('request')
    .select('*, users:user_id(full_name, email)')
    .eq('service_type', specialty.value)
    .order('request_date', { ascending: false })
  if (error) {
    requestsError.value = error.message
    requestsLoading.value = false
    return
  }
  const baseRequests = data || []
  const requestIds = baseRequests.map((r) => r.request_id).filter(Boolean)
  let myOffersByRequest = {}

  if (requestIds.length) {
    const { data: myOffers, error: myOffersError } = await supabase
      .from('request_offers')
      .select('offer_id, request_id, offered_price, customer_counter_price, status, fixer_message')
      .eq('technician_id', technicianId.value)
      .in('request_id', requestIds)
      .order('updated_at', { ascending: false })

    if (myOffersError) {
      requestsError.value = myOffersError.message
      requestsLoading.value = false
      return
    }

    myOffersByRequest = (myOffers || []).reduce((acc, offer) => {
      if (!acc[offer.request_id]) acc[offer.request_id] = offer
      return acc
    }, {})
  }

  requests.value = baseRequests.map((r) => ({
    ...r,
    customer_name: r.users?.full_name || null,
    customer_email: r.users?.email || null,
    myOffer:
      myOffersByRequest[r.request_id] ||
      (r.fixer_price && r.technician_id === technicianId.value
        ? {
            offer_id: `legacy-${r.request_id}-${technicianId.value}`,
            request_id: r.request_id,
            offered_price: r.fixer_price,
            customer_counter_price: r.customer_price,
            status: r.request_status || 'pending',
            fixer_message: null,
            _legacy: true,
          }
        : null),
  }))
  requestsLoading.value = false
}

const fetchAcceptedOrders = async () => {
  if (!specialty.value || !technicianId.value) return
  requestsLoading.value = true
  requestsError.value = null
  const { data, error } = await supabase
    .from('request')
    .select('*, users:user_id(full_name, email)')
    .eq('service_type', specialty.value)
    .eq('request_status', 'accepted')
    .eq('technician_id', technicianId.value)
    .order('request_date', { ascending: false })
  if (error) {
    requestsError.value = error.message
    requestsLoading.value = false
    return
  }
  const baseRequests = data || []
  const requestIds = baseRequests.map((r) => r.request_id).filter(Boolean)
  let myOffersByRequest = {}

  if (requestIds.length) {
    const { data: myOffers } = await supabase
      .from('request_offers')
      .select('offer_id, request_id, offered_price, customer_counter_price, status, fixer_message')
      .eq('technician_id', technicianId.value)
      .in('request_id', requestIds)

    myOffersByRequest = (myOffers || []).reduce((acc, offer) => {
      if (!acc[offer.request_id] || offer.status === 'accepted') acc[offer.request_id] = offer
      return acc
    }, {})
  }

  requests.value = baseRequests.map((r) => ({
    ...r,
    customer_name: r.users?.full_name || null,
    customer_email: r.users?.email || null,
    myOffer:
      myOffersByRequest[r.request_id] ||
      (r.fixer_price && r.technician_id === technicianId.value
        ? {
            offer_id: `legacy-${r.request_id}-${technicianId.value}`,
            request_id: r.request_id,
            offered_price: r.fixer_price,
            customer_counter_price: r.customer_price,
            status: r.request_status || 'accepted',
            fixer_message: null,
            _legacy: true,
          }
        : null),
  }))
  requestsLoading.value = false
}

const openOfferDialog = (req) => {
  offerTarget.value = req
  offerPrice.value = req.myOffer?.offered_price || req.customer_price || null
  offerMessage.value = ''
  offerDialogOpen.value = true
}
const openCounterOfferDialog = (req) => {
  offerTarget.value = req
  offerPrice.value =
    req.myOffer?.customer_counter_price || req.customer_price || req.myOffer?.offered_price || null
  offerMessage.value = ''
  offerDialogOpen.value = true
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

const acceptCustomerOffer = async (req) => {
  if (!req?.request_id || !req?.myOffer?.offer_id) return
  const acceptedPrice = Number(req.myOffer.customer_counter_price)
  if (!Number.isFinite(acceptedPrice) || acceptedPrice <= 0) {
    $q.notify({ type: 'warning', message: 'Customer offer is invalid.' })
    return
  }
  acceptingCounterOfferId.value = req.request_id
  const { error: offerError } = await supabase
    .from('request_offers')
    .update({ status: 'accepted', offered_price: acceptedPrice })
    .eq('offer_id', req.myOffer.offer_id)
    .eq('technician_id', technicianId.value)

  if (!offerError) {
    await supabase
      .from('request_offers')
      .update({ status: 'rejected' })
      .eq('request_id', req.request_id)
      .neq('offer_id', req.myOffer.offer_id)
      .eq('status', 'pending')
  }

  const { data: updatedRequest, error: requestError } = await supabase
    .from('request')
    .update({
      fixer_price: acceptedPrice,
      request_status: 'accepted',
      technician_id: technicianId.value,
      final_price: acceptedPrice,
      customer_price: acceptedPrice,
    })
    .eq('request_id', req.request_id)
    .select('request_id, fixer_price, customer_price, request_status, technician_id')
    .maybeSingle()
  acceptingCounterOfferId.value = null
  if (offerError || requestError) {
    $q.notify({
      type: 'negative',
      message: 'Failed to accept customer offer: ' + (offerError?.message || requestError?.message),
    })
    return
  }
  if (!updatedRequest) {
    $q.notify({
      type: 'negative',
      message: 'Offer was not accepted. Please refresh and try again.',
    })
    return
  }
  $q.notify({ type: 'positive', message: 'Customer offer accepted. Order confirmed!' })
  await fetchRequests()
}

const submitOffer = async () => {
  if (!offerTarget.value || !offerPrice.value || offerPrice.value <= 0) return
  if (!technicianId.value) {
    $q.notify({ type: 'negative', message: 'Technician profile not loaded. Please sign in again.' })
    return
  }
  const normalizedPrice = Number(offerPrice.value)
  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
    $q.notify({ type: 'warning', message: 'Please enter a valid bid amount.' })
    return
  }
  offerSubmitting.value = true
  const trimmedMessage = (offerMessage.value || '').trim()
  const { data: savedOffer, error } = await supabase
    .from('request_offers')
    .upsert(
      {
        request_id: offerTarget.value.request_id,
        technician_id: technicianId.value,
        offered_price: normalizedPrice,
        fixer_message: trimmedMessage || null,
        status: 'pending',
      },
      { onConflict: 'request_id,technician_id' },
    )
    .select('offer_id, request_id, technician_id, offered_price, status, fixer_message')
    .maybeSingle()
  offerSubmitting.value = false
  if (error) {
    $q.notify({ type: 'negative', message: 'Failed to submit offer: ' + error.message })
    return
  }
  if (!savedOffer) {
    $q.notify({
      type: 'negative',
      message: 'Offer was not saved (0 rows updated). Check database policy (RLS) or row filter.',
    })
    return
  }

  await supabase
    .from('request')
    .update({ request_status: 'pending' })
    .eq('request_id', offerTarget.value.request_id)
    .eq('request_status', 'pending')

  let customerEmail = offerTarget.value.customer_email || null
  if (!customerEmail && offerTarget.value.user_id) {
    const { data: customerRow } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', offerTarget.value.user_id)
      .maybeSingle()
    customerEmail = customerRow?.email || null
  }
  if (customerEmail) {
    const savedNotification = await recordNotificationForRecipient(customerEmail, {
      title: `Fixer ${fullName.value || 'Fixer'}`,
      message: `Sent an offer of ${normalizedPrice} EGP for request #${offerTarget.value.request_id}.`,
      requestId: offerTarget.value.request_id,
      routePath: `/incoming-offers?requestId=${offerTarget.value.request_id}`,
      type: 'offer',
      icon: 'build',
      payload: {
        requestId: offerTarget.value.request_id,
        price: normalizedPrice,
        fixerName: fullName.value,
      },
    })
    if (!savedNotification) {
      console.warn('Offer notification not saved.')
      $q.notify({ type: 'warning', message: 'Offer sent, but notification persistence failed.' })
    }
  } else {
    console.warn('Offer notification skipped: customer email not found.')
    $q.notify({ type: 'warning', message: 'Offer sent, but customer email was not found.' })
  }

  if (trimmedMessage && offerTarget.value.user_id) {
    await customerOfferEventsChannel.send({
      type: 'broadcast',
      event: 'fixer-bid-message',
      payload: {
        customerUserId: offerTarget.value.user_id,
        requestId: offerTarget.value.request_id,
        offerId: savedOffer.offer_id,
        message: trimmedMessage,
      },
    })
  }
  $q.notify({ type: 'positive', message: 'Offer submitted successfully!' })
  offerDialogOpen.value = false

  if (offerTarget.value.user_id) {
    const customerChannel = supabase.channel(`bargain-customer-${offerTarget.value.user_id}`)
    try {
      await waitForSubscribed(customerChannel)
      const sendStatus = await customerChannel.send({
        type: 'broadcast',
        event: 'fixer-bid-notification',
        payload: {
          requestId: offerTarget.value.request_id,
          offerId: savedOffer.offer_id,
          price: normalizedPrice,
          fixerName: fullName.value,
        },
      })
      if (sendStatus !== 'ok') console.warn('Offer broadcast send status:', sendStatus)
    } catch (broadcastError) {
      console.warn('Offer broadcast failed:', broadcastError)
    } finally {
      supabase.removeChannel(customerChannel)
    }
  }
  await fetchRequests()
}

const subscribeToCounterOffers = () => {
  if (!technicianId.value) return
  myBargainChannel.value = supabase
    .channel(`bargain-fixer-${technicianId.value}`)
    .on('broadcast', { event: 'customer-bargain-notification' }, ({ payload }) => {
      if (!payload) return
      notifications.value.unshift({
        id: `rt-fixer-${payload.requestId}-${Date.now()}`,
        title: 'Customer',
        fixerName: 'Customer',
        message: `Sent a counter-offer of ${payload.price} EGP for request #${payload.requestId}.`,
        time: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        read: false,
        requestId: payload.requestId,
        routePath: '/service-provider?tab=requests',
        icon: 'handshake',
        type: 'counter-offer',
        payload,
      })
      void loadNotifications()
      $q.notify({
        type: 'info',
        icon: 'notifications_active',
        message: `Customer counter-offer received for request #${payload.requestId}.`,
      })
      fetchRequests()
    })
    .subscribe()
}

onMounted(async () => {
  customerOfferEventsChannel.subscribe()
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/signin')
      return
    }
    setRecipientEmail(user.email)
    const { data: tech } = await supabase
      .from('technician')
      .select('*')
      .ilike('email', user.email)
      .maybeSingle()
    if (tech) {
      technicianId.value = tech.technician_id
      fullName.value = tech.full_name || 'Fixer'
      specialty.value = (tech.specialty || '').toLowerCase().trim()
      yearsOfExperience.value = tech.years_of_experience ?? null
    } else {
      const meta = user.user_metadata || {}
      fullName.value = meta.full_name || 'Fixer'
      specialty.value = (meta.specialty || '').toLowerCase().trim()
      yearsOfExperience.value = meta.years_of_experience ?? null
    }
    const info = specialtyMap[specialty.value]
    if (info) {
      specialtyLabel.value = info.label
      specialtyIcon.value = info.icon
      specialtyColor.value = info.color
    }
    if (technicianId.value) subscribeToCounterOffers()
    await loadNotifications()
    const initialTab = route.query.tab === 'orders' ? 'orders' : 'requests'
    await setActiveTab(initialTab)
  } catch (err) {
    console.error('Failed to load user data:', err)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  customerOfferEventsChannel.unsubscribe()
  myBargainChannel.value?.unsubscribe()
})
</script>

<style scoped>
.app-header-teal {
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover)) !important;
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
.header-brand-icon-w {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}
.header-brand-name-w {
  color: #fff;
  font-size: 22px;
  font-weight: 800;
}
.notif-btn-w {
  color: rgba(255, 255, 255, 0.9) !important;
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
  display: flex;
  justify-content: center;
  padding: 24px 16px 80px;
}
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 48px 24px;
}
.state-center-sm {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
}
.state-title {
  margin-top: 16px;
  font-size: 18px;
  font-weight: 700;
  color: var(--san3a-gray-700);
}
.state-sub {
  margin-top: 6px;
  font-size: 14px;
  color: var(--san3a-gray-500);
}

.dashboard-shell {
  width: 100%;
  max-width: 760px;
}

.welcome-card {
  border-radius: var(--san3a-radius-2xl);
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover));
  color: #fff;
  overflow: hidden;
  position: relative;
  padding: 24px;
  margin-bottom: 28px;
  box-shadow: var(--san3a-shadow-md);
}
.welcome-deco {
  position: absolute;
  right: -30px;
  top: -30px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}
.welcome-content {
  position: relative;
  z-index: 1;
  text-align: center;
}
.welcome-name {
  font-size: 22px;
  font-weight: 800;
}
.welcome-specialty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}
.spec-badge {
  font-size: 14px !important;
  padding: 6px 16px !important;
}
.spec-icon {
  height: 36px;
  object-fit: contain;
}
.welcome-meta {
  margin-top: 12px;
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.6;
  max-width: 62ch;
  margin-left: auto;
  margin-right: auto;
}

.section-tabs {
  margin-bottom: 22px;
  border-radius: var(--san3a-radius-lg);
  background: var(--san3a-gray-100);
  padding: 4px;
}
.section-tabs :deep(.q-tab) {
  border-radius: var(--san3a-radius-md);
  font-weight: 600;
  min-height: 44px;
}
.section-tabs :deep(.q-tab--active) {
  background: #fff;
  box-shadow: var(--san3a-shadow-sm);
}

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px;
}
.tab-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--san3a-gray-900);
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.filters-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 18px;
}
.filter-select {
  width: 100%;
}

.request-list {
  display: grid;
  gap: 14px;
}
.req-card {
  background: #fff;
  border: 1px solid var(--san3a-gray-200);
  border-radius: var(--san3a-radius-xl);
  padding: 20px;
  transition:
    box-shadow 0.2s,
    transform 0.2s,
    border-color 0.2s;
}
.req-card:hover {
  box-shadow: var(--san3a-shadow-md);
  transform: translateY(-2px);
  border-color: rgba(13, 115, 119, 0.24);
}
.req-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.req-id {
  font-size: 15px;
  font-weight: 700;
  color: var(--san3a-gray-900);
}
.req-customer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--san3a-gray-700);
  margin-bottom: 8px;
}
.req-desc {
  font-size: 14px;
  color: var(--san3a-gray-700);
  line-height: 1.6;
  margin: 0 0 12px;
  white-space: pre-line;
}
.req-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--san3a-gray-500);
}
.meta-item.price {
  color: var(--san3a-success);
  font-weight: 600;
}
.req-actions {
  border-top: 1px solid var(--san3a-gray-200);
  padding-top: 12px;
}
.offer-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--san3a-success);
  font-weight: 600;
}

.offer-dialog {
  width: 420px;
  max-width: 95vw;
  border-radius: var(--san3a-radius-xl) !important;
}
.dialog-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--san3a-gray-900);
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

.tab-switch-enter-active,
.tab-switch-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}
.tab-switch-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.99);
}
.tab-switch-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
}

@media (max-width: 600px) {
  .page-content {
    padding: 18px 14px 80px;
  }
  .tab-title {
    font-size: 19px;
  }
  .filters-row {
    grid-template-columns: 1fr;
  }
}
</style>
