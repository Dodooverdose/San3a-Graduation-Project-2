<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
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
            @click="markAsRead(i)"
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
        <div v-if="loading" class="flex flex-center" style="min-height: 300px">
          <q-spinner-dots size="48px" color="primary" />
        </div>

        <div v-else class="dashboard-card">
          <div class="text-h5 text-center q-mb-sm">Welcome, {{ fullName }}!</div>
          <div class="specialty-row q-mb-lg">
            <q-badge
              :color="specialtyColor"
              class="text-subtitle1"
              style="padding: 8px 20px; font-size: 16px"
            >
              {{ specialtyLabel }}
            </q-badge>
            <img
              v-if="specialtyIcon"
              :src="specialtyIcon"
              :alt="specialtyLabel"
              style="height: 36px; object-fit: contain"
            />
          </div>

          <div class="text-body1 text-grey-7 text-center q-mb-lg">
            You are registered as a <strong>{{ specialtyLabel }}</strong
            >.
            <span v-if="yearsOfExperience !== null">
              You have <strong>{{ yearsOfExperience }}</strong> year{{
                yearsOfExperience === 1 ? '' : 's'
              }}
              of experience.
            </span>
          </div>

          <q-separator class="q-my-md full-width" />

          <transition name="tab-switch" mode="out-in">
            <div :key="activeTab" class="full-width">
              <div class="row items-center justify-between full-width q-mb-sm">
                <div class="text-h6">
                  {{ activeTab === 'orders' ? 'Accepted Orders' : 'Incoming Requests' }}
                </div>
                <q-badge
                  v-if="requests.length"
                  color="primary"
                  :label="
                    activeTab === 'orders'
                      ? `${requests.length} order${requests.length > 1 ? 's' : ''}`
                      : `${requests.length} request${requests.length > 1 ? 's' : ''}`
                  "
                  class="text-body2 q-pa-sm"
                />
              </div>

              <div v-if="activeTab === 'requests'" class="filters-row q-gutter-md q-mb-md">
                <q-select
                  v-model="selectedDistricts"
                  :options="cairoDistricts"
                  label="Filter by District"
                  filled
                  outlined
                  multiple
                  use-chips
                  clearable
                  class="filter-select"
                >
                  <template #prepend>
                    <q-icon name="location_city" />
                  </template>
                </q-select>

                <q-select
                  v-model="selectedPaymentMethod"
                  :options="paymentMethodOptions"
                  label="Filter by Payment Method"
                  filled
                  outlined
                  clearable
                  emit-value
                  map-options
                  class="filter-select"
                >
                  <template #prepend>
                    <q-icon name="payments" />
                  </template>
                </q-select>
              </div>

              <!-- Loading requests -->
              <div v-if="requestsLoading" class="text-center q-pa-xl full-width">
                <q-spinner color="primary" size="48px" />
                <div class="q-mt-md text-grey-7">Loading requests...</div>
              </div>

              <!-- Error -->
              <div v-else-if="requestsError" class="text-center q-pa-xl full-width">
                <q-icon name="error" size="64px" color="negative" />
                <div class="text-h6 text-negative q-mt-md">Failed to load requests</div>
                <div class="text-body2 text-grey-7 q-mt-sm">{{ requestsError }}</div>
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
              <div v-else-if="filteredRequests.length === 0" class="text-center q-pa-xl full-width">
                <q-icon name="inbox" size="64px" color="grey-5" />
                <div class="text-h6 text-grey-6 q-mt-md">
                  {{
                    activeTab === 'orders'
                      ? 'No accepted orders yet.'
                      : selectedDistricts.length
                        ? 'No requests in selected districts.'
                        : `No requests available for your specialty yet.`
                  }}
                </div>
              </div>

              <!-- Request Cards -->
              <div v-else class="row q-col-gutter-md full-width">
                <div v-for="req in filteredRequests" :key="req.request_id" class="col-12">
                  <q-card bordered flat class="request-card-item">
                    <q-card-section>
                      <div class="row items-center justify-between q-mb-sm">
                        <div class="text-subtitle1 text-weight-bold">
                          Request #{{ req.request_id }}
                        </div>
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

                      <div v-if="req.customer_name" class="row items-center q-mb-sm">
                        <q-icon name="person" size="xs" color="grey-7" class="q-mr-xs" />
                        <span class="text-body2 text-weight-medium">{{ req.customer_name }}</span>
                      </div>

                      <div class="text-body2 q-mb-md" style="white-space: pre-line">
                        {{ req.description_of_issue || 'No description' }}
                      </div>

                      <q-separator class="q-mb-sm" />

                      <div class="request-details">
                        <div v-if="req.request_date" class="detail-row">
                          <q-icon name="event" size="xs" color="grey-7" />
                          <span>{{ formatDate(req.request_date) }}</span>
                        </div>
                        <div v-if="req.schedule_time" class="detail-row">
                          <q-icon name="schedule" size="xs" color="grey-7" />
                          <span>Scheduled: {{ formatDate(req.schedule_time) }}</span>
                        </div>
                        <div v-if="req.service_location" class="detail-row">
                          <q-icon name="location_on" size="xs" color="grey-7" />
                          <span>{{ req.service_location }}</span>
                        </div>
                        <div v-if="req.payment_method" class="detail-row">
                          <q-icon name="payments" size="xs" color="grey-7" />
                          <span class="text-capitalize">{{ req.payment_method }}</span>
                        </div>
                        <div v-if="req.customer_price" class="detail-row">
                          <q-icon name="sell" size="xs" color="green-7" />
                          <span class="text-weight-medium text-green-9"
                            >Customer budget: {{ req.customer_price }} EGP</span
                          >
                        </div>
                      </div>
                    </q-card-section>

                    <q-separator />

                    <q-card-section class="q-py-sm">
                      <div v-if="req.myOffer" class="row items-center q-gutter-sm">
                        <q-icon name="check_circle" color="positive" size="sm" />
                        <span class="text-body2 text-positive text-weight-medium"
                          >Offer submitted: {{ req.myOffer.offered_price }} EGP</span
                        >
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
                        class="full-width"
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
                          :loading="acceptingCounterOfferId === req.request_id"
                          @click="acceptCustomerOffer(req)"
                        />
                        <q-btn
                          unelevated
                          dense
                          color="orange"
                          icon="gavel"
                          label="Bargain"
                          @click="openCounterOfferDialog(req)"
                        />
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </q-page>
    </q-page-container>

    <!-- Offer Dialog -->
    <q-dialog v-model="offerDialogOpen" persistent>
      <q-card style="width: 400px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Place Your Bid</div>
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
            filled
            outlined
            label="Your Price (EGP)"
            prefix="EGP"
            :rules="[(val) => val > 0 || 'Price must be greater than 0']"
            class="q-mb-md"
          >
            <template #prepend>
              <q-icon name="sell" />
            </template>
          </q-input>

          <q-input
            v-model="offerMessage"
            type="textarea"
            filled
            outlined
            label="Message (optional)"
            autogrow
            :input-style="{ minHeight: '80px' }"
          >
            <template #prepend>
              <q-icon name="message" />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Cancel" color="grey-7" @click="offerDialogOpen = false" />
          <q-btn
            label="Submit Offer"
            color="primary"
            icon="send"
            :loading="offerSubmitting"
            :disable="!offerPrice || offerPrice <= 0"
            @click="submitOffer"
          />
        </q-card-actions>
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

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const showNotifications = ref(false)
const activeTab = ref('requests')
const notifications = ref([])
const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

const goToPage = (route) => {
  if (route) router.push(route)
}

const setActiveTab = async (tab) => {
  activeTab.value = tab
  if (tab === 'orders') {
    await fetchAcceptedOrders()
    return
  }
  await fetchRequests()
}

const markAsRead = (index) => {
  notifications.value[index].read = true
}

const acceptOffer = (index) => {
  const notif = notifications.value[index]
  $q.notify({ type: 'positive', message: `Accepted offer from ${notif.fixerName}` })
  notifications.value.splice(index, 1)
}

const declineOffer = (index) => {
  const notif = notifications.value[index]
  $q.notify({ type: 'warning', message: `Declined offer from ${notif.fixerName}` })
  notifications.value.splice(index, 1)
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
  const baseRequests = requests.value

  if (activeTab.value === 'orders') {
    return baseRequests
  }

  return baseRequests.filter((request) => {
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
  const d = new Date(utcStr)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusColor = (status) => {
  const map = { pending: 'orange', accepted: 'blue', completed: 'green', cancelled: 'red' }
  return map[status?.toLowerCase()] || 'grey'
}

const isOfferAccepted = (req) => {
  const requestStatus = (req?.request_status || '').toLowerCase()
  const myOfferStatus = (req?.myOffer?.status || '').toLowerCase()
  return requestStatus === 'accepted' || myOfferStatus === 'accepted'
}

const canRespondToCustomerOffer = (req) => {
  if (!req?.myOffer) return false
  if ((req.myOffer.status || 'pending').toLowerCase() !== 'pending') return false
  if (req.technician_id !== technicianId.value) return false
  if (req.customer_price === null || req.customer_price === undefined) return false

  const customerOffer = Number(req.customer_price)
  const myOffer = Number(req.myOffer.offered_price)
  if (!Number.isFinite(customerOffer) || !Number.isFinite(myOffer)) return false

  return customerOffer !== myOffer
}

const fetchRequests = async () => {
  if (!specialty.value) return
  requestsLoading.value = true
  requestsError.value = null

  // Query requests matching this technician's specialty
  const { data, error } = await supabase
    .from('request')
    .select('*, users:user_id(full_name)')
    .eq('service_type', specialty.value)
    .order('request_date', { ascending: false })

  if (error) {
    requestsError.value = error.message
    requestsLoading.value = false
    return
  }

  requests.value = (data || []).map((r) => ({
    ...r,
    customer_name: r.users?.full_name || null,
    myOffer:
      r.fixer_price && r.technician_id === technicianId.value
        ? {
            offered_price: r.fixer_price,
            status: r.request_status || 'pending',
          }
        : null,
  }))

  requestsLoading.value = false
}

const fetchAcceptedOrders = async () => {
  if (!specialty.value) return

  requestsLoading.value = true
  requestsError.value = null

  const { data, error } = await supabase
    .from('request')
    .select('*, users:user_id(full_name)')
    .eq('service_type', specialty.value)
    .eq('request_status', 'accepted')
    .order('request_date', { ascending: false })

  if (error) {
    requestsError.value = error.message
    requestsLoading.value = false
    return
  }

  requests.value = (data || []).map((r) => ({
    ...r,
    customer_name: r.users?.full_name || null,
    myOffer:
      r.fixer_price && r.technician_id === technicianId.value
        ? {
            offered_price: r.fixer_price,
            status: r.request_status || 'accepted',
          }
        : null,
  }))

  requestsLoading.value = false
}

const openOfferDialog = (req) => {
  offerTarget.value = req
  offerPrice.value = req.fixer_price || req.customer_price || null
  offerMessage.value = ''
  offerDialogOpen.value = true
}

const openCounterOfferDialog = (req) => {
  offerTarget.value = req
  offerPrice.value = req.customer_price || req.fixer_price || null
  offerMessage.value = ''
  offerDialogOpen.value = true
}

const acceptCustomerOffer = async (req) => {
  if (!req?.request_id) return
  const acceptedPrice = Number(req.customer_price)
  if (!Number.isFinite(acceptedPrice) || acceptedPrice <= 0) {
    $q.notify({ type: 'warning', message: 'Customer offer is invalid.' })
    return
  }

  acceptingCounterOfferId.value = req.request_id

  const { data: updatedRequest, error } = await supabase
    .from('request')
    .update({
      fixer_price: acceptedPrice,
      request_status: 'accepted',
      technician_id: technicianId.value,
      final_price: acceptedPrice,
    })
    .eq('request_id', req.request_id)
    .eq('technician_id', technicianId.value)
    .select('request_id, fixer_price, customer_price, request_status, technician_id')
    .maybeSingle()

  acceptingCounterOfferId.value = null

  if (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to accept customer offer: ' + error.message,
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
    $q.notify({
      type: 'negative',
      message: 'Technician profile not loaded. Please sign in again and retry.',
    })
    return
  }

  const normalizedPrice = Number(offerPrice.value)
  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
    $q.notify({ type: 'warning', message: 'Please enter a valid bid amount.' })
    return
  }

  offerSubmitting.value = true

  const trimmedMessage = (offerMessage.value || '').trim()
  const { data: updatedRequest, error } = await supabase
    .from('request')
    .update({
      fixer_price: normalizedPrice,
      request_status: 'pending',
      technician_id: technicianId.value,
    })
    .eq('request_id', offerTarget.value.request_id)
    .select('request_id, fixer_price, technician_id, request_status')
    .maybeSingle()

  offerSubmitting.value = false

  if (error) {
    $q.notify({ type: 'negative', message: 'Failed to submit offer: ' + error.message })
    return
  }

  if (!updatedRequest) {
    $q.notify({
      type: 'negative',
      message:
        'Offer was not saved (0 rows updated). This is usually caused by a database policy (RLS) or row filter mismatch.',
    })
    return
  }

  if (trimmedMessage && offerTarget.value.user_id) {
    await customerOfferEventsChannel.send({
      type: 'broadcast',
      event: 'fixer-bid-message',
      payload: {
        customerUserId: offerTarget.value.user_id,
        requestId: offerTarget.value.request_id,
        message: trimmedMessage,
      },
    })
  }

  $q.notify({ type: 'positive', message: 'Offer submitted successfully!' })
  offerDialogOpen.value = false

  // Broadcast notification to customer via their specific channel
  if (offerTarget.value.user_id) {
    const customerChannel = supabase.channel(`bargain-customer-${offerTarget.value.user_id}`)
    await customerChannel.send({
      type: 'broadcast',
      event: 'fixer-bid-notification',
      payload: {
        requestId: offerTarget.value.request_id,
        price: normalizedPrice,
        fixerName: fullName.value,
      },
    })
    supabase.removeChannel(customerChannel)
  }

  await fetchRequests()
}

const subscribeToCounterOffers = () => {
  if (!technicianId.value) return

  // Listen on fixer-specific channel
  myBargainChannel.value = supabase
    .channel(`bargain-fixer-${technicianId.value}`)
    .on('broadcast', { event: 'customer-bargain-notification' }, ({ payload }) => {
      if (!payload) return

      const notif = {
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
      }
      notifications.value.unshift(notif)
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

    // Look up technician from DB for accurate data
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
      // Fallback to user_metadata
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

    // Subscribe to customer counter-offer notifications
    if (technicianId.value) {
      subscribeToCounterOffers()
    }

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
.page-content {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
  padding-bottom: 72px;
}

.dashboard-card {
  width: 100%;
  max-width: 650px;
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.specialty-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.full-width {
  width: 100%;
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.filter-select {
  width: 100%;
}

.request-card-item {
  border-radius: 12px;
  transition: box-shadow 0.2s;
}
.request-card-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.request-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
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

@media (max-width: 600px) {
  .filters-row {
    grid-template-columns: 1fr;
  }
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
</style>
