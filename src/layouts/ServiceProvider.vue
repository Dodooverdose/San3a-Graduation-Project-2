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
            @click="handleNotifClick(notif, i)"
          >
            <q-item-section avatar>
              <q-avatar size="40px" class="notif-avatar">
                <q-icon
                  :name="
                    notif.type === 'arrival-check'
                      ? 'schedule'
                      : notif.type === 'job-finished'
                        ? 'task_alt'
                        : 'build'
                  "
                  size="20px"
                />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">{{
                notif.fixerName || notif.title
              }}</q-item-label>
              <q-item-label caption>{{ getNotifMessage(notif) }}</q-item-label>
              <q-item-label caption class="text-grey-6">{{ notif.time }}</q-item-label>
              <!-- Inline ETA picker for arrival-check notifications -->
              <div v-if="notif.type === 'arrival-check' && !notif.etaSent" class="q-mt-sm">
                <div class="text-caption text-grey-8 q-mb-xs">
                  How much time left till you arrive?
                </div>
                <q-option-group
                  v-model="notifEtaSelections[notif.id]"
                  :options="etaOptions"
                  type="radio"
                  color="primary"
                  dense
                  inline
                  @click.stop
                />
                <q-btn
                  dense
                  unelevated
                  color="primary"
                  label="Send ETA"
                  icon="send"
                  size="sm"
                  no-caps
                  class="q-mt-xs"
                  :disable="!notifEtaSelections[notif.id]"
                  @click.stop="sendEtaFromNotif(notif, i)"
                />
              </div>
              <div v-else-if="notif.type === 'arrival-check' && notif.etaSent" class="q-mt-xs">
                <q-badge color="positive" label="ETA sent" />
              </div>
              <!-- Job finished notification with Done button -->
              <div v-if="notif.type === 'job-finished' && !notif.done" class="q-mt-sm">
                <q-btn
                  unelevated
                  color="positive"
                  label="Done"
                  icon="check_circle"
                  no-caps
                  size="sm"
                  @click.stop="handleJobDone(notif, i)"
                />
              </div>
              <div v-else-if="notif.type === 'job-finished' && notif.done" class="q-mt-xs">
                <q-badge color="positive" label="Completed" />
              </div>
            </q-item-section>
            <q-item-section
              v-if="notif.type !== 'arrival-check' && notif.type !== 'job-finished'"
              side
            >
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

          <transition name="tab-switch" mode="out-in">
            <div :key="activeTab" class="full-width">
              <div class="tab-header">
                <q-badge
                  v-if="requests.length"
                  color="primary"
                  :label="`${requests.length} ${activeTab === 'orders' ? 'order' : 'request'}${requests.length > 1 ? 's' : ''}`"
                  class="q-pa-sm"
                />
              </div>

              <!-- Filters (orders tab) -->
              <div
                v-if="activeTab === 'orders'"
                class="filters-row"
                style="grid-template-columns: 1fr"
              >
                <q-select
                  v-model="selectedOrderStatus"
                  :options="orderStatusOptions"
                  label="Filter by Status"
                  outlined
                  dense
                  clearable
                  emit-value
                  map-options
                  class="filter-select"
                >
                  <template #prepend><q-icon name="filter_list" /></template>
                </q-select>
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

                  <div v-if="req.attached_image" class="req-image">
                    <img
                      :src="req.attached_image"
                      alt="Attached image"
                      class="req-attached-img"
                      @click="previewImage = req.attached_image"
                    />
                  </div>

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
                    <div v-if="hasMyOffer(req)" class="offer-status">
                      <q-icon name="check_circle" color="positive" size="sm" />
                      <span>Offer submitted: {{ getMyOffer(req).offered_price }} EGP</span>
                      <q-badge
                        :color="statusColor(req.request_status)"
                        :label="req.request_status || 'pending'"
                        class="q-ml-sm"
                      />
                    </div>
                    <q-btn
                      v-if="activeTab !== 'orders' && !isOfferAccepted(req)"
                      :color="isRequestTaken(req) || hasMyOffer(req) ? 'grey-5' : 'primary'"
                      :label="hasMyOffer(req) ? 'Update Bid' : 'Place Bid'"
                      icon="gavel"
                      no-caps
                      unelevated
                      :disable="isRequestTaken(req)"
                      class="full-width q-mt-sm"
                      @click="openOfferDialog(req)"
                    />
                    <div
                      v-if="canRespondToCustomerOffer(req)"
                      class="counter-offer-section q-mt-sm"
                    >
                      <div class="counter-offer-banner">
                        <q-icon name="person" size="18px" color="green-8" />
                        <span
                          >Customer counter-offer:
                          <strong>{{ getMyOffer(req).customer_counter_price }} EGP</strong></span
                        >
                      </div>
                      <div class="row items-center q-gutter-sm q-mt-sm">
                        <q-btn
                          unelevated
                          dense
                          color="positive"
                          icon="check_circle"
                          :label="`Accept ${getMyOffer(req).customer_counter_price} EGP`"
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
        <q-tab name="profile" icon="person" label="Profile" @click="router.push('/profile')" />
      </q-tabs>
    </q-footer>

    <!-- Review / Rating Dialog -->
    <q-dialog v-model="showReviewDialog" persistent>
      <q-card style="min-width: 360px; border-radius: 20px">
        <q-card-section class="text-center">
          <q-icon name="star" size="56px" color="amber" />
          <div class="text-h6 q-mt-sm">Rate the Customer</div>
          <div class="text-body2 text-grey-7 q-mt-xs">Request #{{ reviewTarget?.request_id }}</div>
        </q-card-section>
        <q-card-section>
          <div class="text-center q-mb-md">
            <q-rating
              v-model="reviewStars"
              size="2.5em"
              color="amber"
              icon="star_border"
              icon-selected="star"
              :max="5"
            />
          </div>
          <q-input
            v-model="reviewText"
            type="textarea"
            outlined
            label="Write a description (optional)"
            autogrow
            :input-style="{ minHeight: '80px' }"
          >
            <template #prepend><q-icon name="rate_review" /></template>
          </q-input>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md">
          <q-btn
            unelevated
            color="primary"
            label="Submit Review"
            icon="send"
            no-caps
            :loading="reviewSubmitting"
            :disable="!reviewStars"
            @click="submitReview(false)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ETA Dialog (arrival check from customer) -->
    <q-dialog v-model="showEtaDialog" persistent>
      <q-card style="min-width: 340px; border-radius: 20px">
        <q-card-section class="text-center">
          <q-icon name="schedule" size="56px" color="warning" />
          <div class="text-h6 q-mt-sm">Customer is waiting!</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            For request #{{ etaDialogRequest?.requestId }}
          </div>
          <div class="text-body2 text-grey-7 q-mt-sm">How much time left till you arrive?</div>
        </q-card-section>
        <q-card-section>
          <q-option-group
            v-model="selectedEta"
            :options="etaOptions"
            type="radio"
            color="primary"
          />
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md">
          <q-btn
            unelevated
            color="primary"
            label="Send"
            icon="send"
            no-caps
            :disable="!selectedEta"
            @click="handleSubmitEta"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Job Status Popup -->
    <q-dialog v-model="showJobStatusDialog" persistent>
      <q-card style="min-width: 340px; border-radius: 20px">
        <q-card-section class="text-center">
          <q-icon name="task_alt" size="56px" color="primary" />
          <div class="text-h6 q-mt-sm">Job Status</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            Has request <strong>#{{ jobStatusTarget?.request_id }}</strong> been finished?
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md q-gutter-sm">
          <q-btn flat label="Not yet" color="grey-7" no-caps @click="handleJobStatusNo" />
          <q-btn
            unelevated
            color="positive"
            label="Yes, it's done"
            icon="check_circle"
            no-caps
            @click="handleJobStatusYes"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Image Preview Dialog -->
    <q-dialog v-model="previewImage">
      <q-card style="max-width: 90vw; max-height: 90vh">
        <q-img :src="previewImage" fit="contain" style="max-height: 80vh" />
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useNotificationCenter } from 'src/composables/useNotificationCenter'
import { useArrivalCheck } from 'src/composables/useArrivalCheck'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
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

const showNotifications = ref(false)
const activeTab = ref('requests')
const navTab = ref('requests')

const { showEtaDialog, etaDialogRequest, selectedEta, listenForArrivalChecks, submitEta } =
  useArrivalCheck()

const etaOptions = [
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '20 minutes', value: 20 },
  { label: '25 minutes', value: 25 },
  { label: '30 minutes', value: 30 },
]

const etaDialogQueue = ref([])

const etaPendingIds = new Set()

const promptEtaDialog = async (requestId, customerId) => {
  if (etaDialogRequest.value?.requestId === requestId && showEtaDialog.value) return
  if (etaDialogQueue.value.some((q) => q.requestId === requestId)) return
  if (etaPendingIds.has(requestId)) return
  etaPendingIds.add(requestId)

  try {
    // Skip if the request is no longer in 'accepted' status (already on-going/completed)
    const { data: reqRow } = await supabase
      .from('request')
      .select('request_status')
      .eq('request_id', requestId)
      .maybeSingle()
    const st = (reqRow?.request_status || '').toLowerCase()
    if (st === 'on-going' || st === 'completed' || st === 'cancelled') return

    // Re-check after async gap
    if (etaDialogRequest.value?.requestId === requestId && showEtaDialog.value) return
    if (etaDialogQueue.value.some((q) => q.requestId === requestId)) return

    const item = { requestId, customerId }
    if (showEtaDialog.value) {
      etaDialogQueue.value.push(item)
    } else {
      etaDialogRequest.value = item
      selectedEta.value = null
      showEtaDialog.value = true
    }
  } finally {
    etaPendingIds.delete(requestId)
  }
}

const showNextEtaDialog = () => {
  if (etaDialogQueue.value.length > 0) {
    const next = etaDialogQueue.value.shift()
    etaDialogRequest.value = next
    selectedEta.value = null
    showEtaDialog.value = true
  }
}

const autoShowPendingEtaChecks = async () => {
  const candidates = []
  for (let i = 0; i < notifications.value.length; i++) {
    const notif = notifications.value[i]
    if (notif.read || notif.done || notif.etaSent) continue
    if (notif.type === 'arrival-check') {
      candidates.push({ notif, index: i })
    }
  }
  if (!candidates.length) return

  // Batch-check request statuses to skip on-going/completed
  const requestIds = [...new Set(candidates.map((c) => c.notif.payload?.requestId || c.notif.requestId).filter(Boolean))]
  let skipIds = new Set()
  if (requestIds.length) {
    const { data } = await supabase
      .from('request')
      .select('request_id, request_status')
      .in('request_id', requestIds)
    if (data) {
      for (const r of data) {
        const st = (r.request_status || '').toLowerCase()
        if (st === 'on-going' || st === 'completed' || st === 'cancelled') {
          skipIds.add(r.request_id)
        }
      }
    }
  }

  for (const { notif } of candidates) {
    const rid = notif.payload?.requestId || notif.requestId
    if (rid && skipIds.has(Number(rid))) continue
    promptEtaDialog(rid, notif.payload?.customerId)
  }
}

const autoShowPendingJobStatus = () => {
  for (let i = 0; i < notifications.value.length; i++) {
    const notif = notifications.value[i]
    if (notif.read || notif.done) continue
    if (notif.type === 'job-finished') {
      promptJobStatus(notif.payload?.requestId || notif.requestId, notif.payload?.userId)
    }
  }
}

const handleSubmitEta = async () => {
  const result = await submitEta(selectedEta.value, etaDialogRequest.value)
  if (result?.blocked) {
    $q.notify({
      type: 'warning',
      message: `ETA is still active (${result.remaining} remaining). Wait for it to expire or customer response.`,
    })
    return
  }
  $q.notify({ type: 'positive', message: `ETA of ${selectedEta.value} minutes sent to customer.` })
  showNextEtaDialog()
}

const notifEtaSelections = ref({})

// ── Review / Rating state ──
const showReviewDialog = ref(false)
const reviewTarget = ref(null)
const reviewStars = ref(0)
const reviewText = ref('')
const reviewSubmitting = ref(false)
const reviewNotifIndex = ref(null)
const ongoingChannel = ref(null)
const ongoingDbChannel = ref(null)

const showJobStatusDialog = ref(false)
const jobStatusTarget = ref(null)
const jobStatusQueue = ref([])

const promptJobStatus = async (requestId, userId) => {
  // Don't duplicate if already queued or showing
  if (jobStatusTarget.value?.request_id === requestId) return
  if (jobStatusQueue.value.some((q) => q.request_id === requestId)) return

  // Skip if the request is already completed
  const { data: reqRow } = await supabase
    .from('request')
    .select('request_status')
    .eq('request_id', requestId)
    .maybeSingle()
  if ((reqRow?.request_status || '').toLowerCase() === 'completed') return

  const item = { request_id: requestId, user_id: userId }
  if (showJobStatusDialog.value) {
    jobStatusQueue.value.push(item)
  } else {
    jobStatusTarget.value = item
    showJobStatusDialog.value = true
  }
}

const showNextJobStatus = () => {
  if (jobStatusQueue.value.length > 0) {
    jobStatusTarget.value = jobStatusQueue.value.shift()
    showJobStatusDialog.value = true
  }
}

const handleJobStatusYes = () => {
  showJobStatusDialog.value = false
  // Open the review dialog
  reviewTarget.value = {
    request_id: jobStatusTarget.value.request_id,
    user_id: jobStatusTarget.value.user_id,
  }
  reviewNotifIndex.value = null
  reviewStars.value = 0
  reviewText.value = ''
  showReviewDialog.value = true
}

const handleJobStatusNo = () => {
  showJobStatusDialog.value = false
  jobStatusTarget.value = null
  showNextJobStatus()
}

const handleJobDone = (notif, index) => {
  markAsRead(index)
  promptJobStatus(notif.payload?.requestId || notif.requestId, notif.payload?.userId)
}

const submitReview = async (skip = false) => {
  if (!reviewTarget.value) return
  reviewSubmitting.value = true

  // Look up user_id if missing
  let userId = reviewTarget.value.user_id
  if (!userId) {
    const { data: reqRow } = await supabase
      .from('request')
      .select('user_id')
      .eq('request_id', reviewTarget.value.request_id)
      .maybeSingle()
    userId = reqRow?.user_id
  }

  // Save technician rating
  if (!skip && reviewStars.value > 0) {
    const techRatingData = {
      technician_rating: reviewStars.value,
      technician_text: reviewText.value.trim() || null,
      technician_timestamp: new Date().toISOString(),
    }

    // Check if a rating row already exists for this request
    const { data: existingRating } = await supabase
      .from('rating')
      .select('review_id')
      .eq('request_id', reviewTarget.value.request_id)
      .maybeSingle()

    let ratingError
    if (existingRating) {
      const { error } = await supabase
        .from('rating')
        .update(techRatingData)
        .eq('request_id', reviewTarget.value.request_id)
      ratingError = error
    } else {
      const { error } = await supabase.from('rating').insert({
        request_id: reviewTarget.value.request_id,
        technician_id: technicianId.value,
        user_id: userId,
        ...techRatingData,
      })
      ratingError = error
    }

    if (ratingError) {
      console.error('Rating save failed:', ratingError)
      $q.notify({ type: 'negative', message: 'Review save failed: ' + ratingError.message })
    }
  }

  // Send completion-check notification to customer instead of marking completed immediately
  if (userId) {
    const { data: customerRow, error: userLookupErr } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', userId)
      .maybeSingle()

    if (userLookupErr) {
      console.error('Customer email lookup failed:', userLookupErr)
    }

    const customerEmail = customerRow?.email
    if (customerEmail) {
      const result = await recordNotificationForRecipient(customerEmail, {
        title: 'Completion Check',
        message: `Has request #${reviewTarget.value.request_id} been completed?`,
        requestId: reviewTarget.value.request_id,
        routePath: '/orders',
        type: 'completion-check',
        icon: 'help_outline',
        payload: {
          requestId: reviewTarget.value.request_id,
          technicianId: technicianId.value,
          userId: userId,
          type: 'completion-check',
        },
      })
      if (!result) {
        console.error('Failed to send completion-check notification to customer:', customerEmail)
        $q.notify({ type: 'warning', message: 'Could not notify the customer. Please try again.' })
      }
    } else {
      console.error('Could not find customer email for user_id:', userId)
      $q.notify({ type: 'warning', message: 'Customer email not found — notification not sent.' })
    }
  } else {
    console.error('No user_id available to send completion-check notification')
    $q.notify({ type: 'warning', message: 'Customer info missing — notification not sent.' })
  }

  // Mark notification as done
  if (reviewNotifIndex.value !== null && notifications.value[reviewNotifIndex.value]) {
    notifications.value[reviewNotifIndex.value].done = true
  }

  reviewSubmitting.value = false
  showReviewDialog.value = false
  reviewTarget.value = null
  reviewNotifIndex.value = null

  $q.notify({ type: 'positive', message: 'Review submitted! Waiting for customer confirmation.' })

  if (activeTab.value === 'orders') {
    await fetchAcceptedOrders()
  } else {
    await fetchRequests()
  }
}

const handleNotifClick = (notif, index) => {
  if (notif.type === 'arrival-check') {
    markAsRead(index)
    showNotifications.value = false
    if (notif.payload?.requestId) {
      promptEtaDialog(notif.payload.requestId, notif.payload.customerId)
    }
    return
  }
  if (notif.type === 'job-finished') {
    markAsRead(index)
    if (!notif.done) handleJobDone(notif, index)
    return
  }
  markAsRead(index)
}

const sendEtaFromNotif = async (notif, index) => {
  const minutes = notifEtaSelections.value[notif.id]
  if (!minutes) return
  const requestData = {
    requestId: notif.payload?.requestId || notif.requestId,
    customerId: notif.payload?.customerId,
  }
  const result = await submitEta(minutes, requestData)
  if (result?.blocked) {
    $q.notify({
      type: 'warning',
      message: `ETA is still active (${result.remaining} remaining). Wait for it to expire or customer response.`,
    })
    return
  }
  markAsRead(index)
  notifications.value[index].etaSent = true
  $q.notify({ type: 'positive', message: `ETA of ${minutes} minutes sent to customer.` })
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

const loading = ref(true)
const fullName = ref('')
const specialty = ref('')
const technicianId = ref(null)
const yearsOfExperience = ref(null)
const requests = ref([])
const myOffers = ref({})
const requestsLoading = ref(false)
const requestsError = ref(null)
const selectedDistricts = ref([])
const selectedPaymentMethod = ref(null)
const selectedOrderStatus = ref(null)
const orderStatusOptions = [
  { label: 'All', value: null },
  { label: 'Accepted', value: 'accepted' },
  { label: 'On-going', value: 'on-going' },
  { label: 'Completed', value: 'completed' },
]
const offerDialogOpen = ref(false)
const previewImage = ref(null)
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
  if (activeTab.value === 'orders') {
    if (!selectedOrderStatus.value) return requests.value
    return requests.value.filter(
      (r) => (r.request_status || '').toLowerCase() === selectedOrderStatus.value,
    )
  }
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
  ({
    pending: 'orange',
    accepted: 'blue',
    'on-going': 'purple',
    completed: 'green',
    cancelled: 'red',
  })[status?.toLowerCase()] || 'grey'
const getMyOffer = (req) => myOffers.value[req.request_id] || null
const hasMyOffer = (req) => !!getMyOffer(req)

const isOfferAccepted = (req) => (req?.request_status || '').toLowerCase() === 'accepted'

const isRequestTaken = (req) => {
  const st = (req?.request_status || '').toLowerCase()
  return st === 'accepted' || st === 'on-going'
}

const canRespondToCustomerOffer = (req) => {
  const offer = getMyOffer(req)
  if (!offer) return false
  if ((req.request_status || 'pending').toLowerCase() !== 'pending') return false
  if (offer.customer_counter_price === null || offer.customer_counter_price === undefined)
    return false
  const cp = Number(offer.customer_counter_price)
  const fp = Number(offer.offered_price)
  if (!Number.isFinite(cp) || !Number.isFinite(fp)) return false
  return cp !== fp
}

const fetchMyOffers = async () => {
  if (!technicianId.value) return
  const { data } = await supabase
    .from('request_offers')
    .select('*')
    .eq('technician_id', technicianId.value)
  const map = {}
  ;(data || []).forEach((o) => {
    map[o.request_id] = o
  })
  myOffers.value = map
}

const fetchRequests = async () => {
  if (!specialty.value || !technicianId.value) return
  requestsLoading.value = true
  requestsError.value = null
  const { data, error } = await supabase
    .from('request')
    .select('*, users:user_id(full_name, email)')
    .eq('service_type', specialty.value)
    .eq('request_status', 'pending')
    .order('request_date', { ascending: false })
  if (error) {
    requestsError.value = error.message
    requestsLoading.value = false
    return
  }
  await fetchMyOffers()
  requests.value = (data || []).map((r) => ({
    ...r,
    customer_name: r.users?.full_name || null,
    customer_email: r.users?.email || null,
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
    .eq('technician_id', technicianId.value)
    .or(
      'request_status.eq.accepted,request_status.eq.Accepted,request_status.eq.on-going,request_status.eq.On-going,request_status.eq.completed,request_status.eq.Completed',
    )
    .order('request_date', { ascending: false })
  if (error) {
    requestsError.value = error.message
    requestsLoading.value = false
    return
  }
  requests.value = (data || []).map((r) => ({
    ...r,
    customer_name: r.users?.full_name || null,
    customer_email: r.users?.email || null,
  }))
  requestsLoading.value = false
}

const openOfferDialog = (req) => {
  offerTarget.value = req
  const existing = getMyOffer(req)
  offerPrice.value = existing?.offered_price || req.customer_price || null
  offerMessage.value = ''
  offerDialogOpen.value = true
}
const openCounterOfferDialog = (req) => {
  offerTarget.value = req
  const existing = getMyOffer(req)
  offerPrice.value = existing?.customer_counter_price || existing?.offered_price || null
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
  if (!req?.request_id) return
  const offer = getMyOffer(req)
  if (!offer) return
  const acceptedPrice = Number(offer.customer_counter_price)
  if (!Number.isFinite(acceptedPrice) || acceptedPrice <= 0) {
    $q.notify({ type: 'warning', message: 'Customer offer is invalid.' })
    return
  }
  acceptingCounterOfferId.value = req.request_id
  const { error: offerErr } = await supabase
    .from('request_offers')
    .update({ offered_price: acceptedPrice, status: 'accepted' })
    .eq('offer_id', offer.offer_id)
  if (offerErr) {
    acceptingCounterOfferId.value = null
    $q.notify({ type: 'negative', message: 'Failed to accept: ' + offerErr.message })
    return
  }
  const { error: requestError } = await supabase
    .from('request')
    .update({
      fixer_price: acceptedPrice,
      request_status: 'accepted',
      technician_id: technicianId.value,
      final_price: acceptedPrice,
    })
    .eq('request_id', req.request_id)
  acceptingCounterOfferId.value = null
  if (requestError) {
    $q.notify({
      type: 'negative',
      message: 'Failed to accept customer offer: ' + requestError.message,
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
  const { data: upsertedOffer, error } = await supabase
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
    .select()
    .maybeSingle()
  offerSubmitting.value = false
  if (error) {
    $q.notify({ type: 'negative', message: 'Failed to submit offer: ' + error.message })
    return
  }
  if (!upsertedOffer) {
    $q.notify({
      type: 'negative',
      message: 'Offer was not saved (0 rows updated). Check database policy (RLS) or row filter.',
    })
    return
  }

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
    const notifMsg = trimmedMessage
      ? `Sent an offer of ${normalizedPrice} EGP for request #${offerTarget.value.request_id}.\n💬 "${trimmedMessage}"`
      : `Sent an offer of ${normalizedPrice} EGP for request #${offerTarget.value.request_id}.`
    const savedNotification = await recordNotificationForRecipient(customerEmail, {
      title: `Fixer ${fullName.value || 'Fixer'}`,
      message: notifMsg,
      requestId: offerTarget.value.request_id,
      routePath: `/incoming-offers?requestId=${offerTarget.value.request_id}`,
      type: 'offer',
      icon: 'build',
      payload: {
        requestId: offerTarget.value.request_id,
        price: normalizedPrice,
        fixerName: fullName.value,
        message: trimmedMessage || null,
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
          price: normalizedPrice,
          fixerName: fullName.value,
          message: trimmedMessage || null,
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
    if (technicianId.value) subscribeToOngoingStatus()
    if (technicianId.value) listenForArrivalChecks(technicianId.value, promptEtaDialog)
    if (technicianId.value) await ensureOngoingNotifications(user.email)
    await loadNotifications()
    await autoShowPendingEtaChecks()
    autoShowPendingJobStatus()
    const initialTab = route.query.tab === 'orders' ? 'orders' : 'requests'
    await setActiveTab(initialTab)
  } catch (err) {
    console.error('Failed to load user data:', err)
  } finally {
    loading.value = false
  }
})

// On page load, check for on-going requests that don't have a job-finished notification yet
const ensureOngoingNotifications = async (techEmail) => {
  if (!technicianId.value || !techEmail) return
  const email = techEmail.trim().toLowerCase()

  // Find all on-going requests assigned to this technician
  const { data: ongoingRequests } = await supabase
    .from('request')
    .select('request_id, user_id')
    .eq('technician_id', technicianId.value)
    .eq('request_status', 'on-going')

  if (!ongoingRequests?.length) return

  for (const req of ongoingRequests) {
    // Check if a job-finished notification already exists for this request
    const { data: existing } = await supabase
      .from('notification_center')
      .select('id')
      .eq('recipient_email', email)
      .eq('notification_type', 'job-finished')
      .eq('request_id', String(req.request_id))
      .limit(1)

    if (existing?.length) continue

    await recordNotificationForRecipient(email, {
      title: 'Job Status',
      message: `Has the request #${req.request_id} been finished?`,
      requestId: req.request_id,
      routePath: '/service-provider?tab=orders',
      type: 'job-finished',
      icon: 'task_alt',
      payload: {
        requestId: req.request_id,
        userId: req.user_id,
        type: 'job-finished',
      },
    })

    // Auto-show job status popup
    promptJobStatus(req.request_id, req.user_id)
  }
}

const subscribeToOngoingStatus = () => {
  if (!technicianId.value) return

  // Broadcast listener (for when customer triggers confirmArrival while tech is online)
  ongoingChannel.value = supabase
    .channel(`job-ongoing-${technicianId.value}`)
    .on('broadcast', { event: 'job-ongoing' }, async ({ payload }) => {
      if (!payload) return

      await loadNotifications()
      promptJobStatus(payload.requestId, payload.userId)

      if (activeTab.value === 'orders') await fetchAcceptedOrders()
      else await fetchRequests()
    })
    .subscribe()

  // Postgres changes listener (catches status changes from any source)
  ongoingDbChannel.value = supabase
    .channel(`ongoing-db-${technicianId.value}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'request',
      },
      async ({ new: updated }) => {
        if (!updated) return
        if (updated.technician_id !== technicianId.value) return
        if ((updated.request_status || '').toLowerCase() !== 'on-going') return

        // Check if we already have a job-finished notification for this request
        const alreadyExists = notifications.value.some(
          (n) => n.type === 'job-finished' && String(n.requestId) === String(updated.request_id),
        )
        if (alreadyExists) return

        // Look up technician email to persist the notification
        const { data: tech } = await supabase
          .from('technician')
          .select('email')
          .eq('technician_id', technicianId.value)
          .maybeSingle()
        const techEmail = tech?.email

        if (techEmail) {
          await recordNotificationForRecipient(techEmail, {
            title: 'Job Status',
            message: `Has the request #${updated.request_id} been finished?`,
            requestId: updated.request_id,
            routePath: '/service-provider?tab=orders',
            type: 'job-finished',
            icon: 'task_alt',
            payload: {
              requestId: updated.request_id,
              userId: updated.user_id,
              type: 'job-finished',
            },
          })
        }

        // Auto-show job status popup
        promptJobStatus(updated.request_id, updated.user_id)

        if (activeTab.value === 'orders') await fetchAcceptedOrders()
        else await fetchRequests()
      },
    )
    .subscribe()
}

onBeforeUnmount(() => {
  customerOfferEventsChannel.unsubscribe()
  myBargainChannel.value?.unsubscribe()
  ongoingChannel.value?.unsubscribe()
  ongoingDbChannel.value?.unsubscribe()
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
.req-image {
  margin-bottom: 12px;
}
.req-attached-img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: var(--san3a-radius-md);
  border: 1px solid var(--san3a-gray-200);
  cursor: pointer;
  transition: opacity 0.2s;
}
.req-attached-img:hover {
  opacity: 0.85;
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

.counter-offer-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(76, 175, 80, 0.08);
  border: 1px solid rgba(76, 175, 80, 0.25);
  border-radius: var(--san3a-radius-md);
  font-size: 14px;
  color: var(--san3a-gray-800);
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
