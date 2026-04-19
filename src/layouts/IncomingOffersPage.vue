<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Header -->
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <div class="header-brand">
          <div class="header-brand-icon">
            <img src="/icons/White.png" alt="Sanعa logo" class="brand-logo-mark" />
          </div>
          <span class="header-brand-name">Sanعa</span>
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
          <div class="notif-title">{{ $t('incomingOffers.notifications') }}</div>
          <q-space />
          <q-btn
            v-if="notifications.length > 0"
            flat
            dense
            no-caps
            :label="$t('incomingOffers.clearAll')"
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
                <q-icon
                  :name="
                    notif.type === 'completion-check'
                      ? 'task_alt'
                      : notif.type === 'still-going-check'
                        ? 'update'
                        : 'build'
                  "
                  size="20px"
                />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{
                  notif.type === 'completion-check' || notif.type === 'still-going-check'
                    ? notif.title || $t('incomingOffers.requestStatus')
                    : notif.fixerName
                }}
              </q-item-label>
              <q-item-label caption>
                {{
                  notif.type === 'completion-check' || notif.type === 'still-going-check'
                    ? notif.message
                    : getNotifMessage(notif)
                }}
              </q-item-label>
              <q-item-label caption class="text-grey-6">{{ notif.time }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div v-if="notif.type === 'completion-check' && !notif.done" class="row q-gutter-xs">
                <q-btn
                  dense
                  unelevated
                  color="positive"
                  label="Yes"
                  size="sm"
                  no-caps
                  @click.stop="handleCompletionYes(notif, i)"
                />
                <q-btn
                  dense
                  unelevated
                  color="negative"
                  label="No"
                  size="sm"
                  no-caps
                  @click.stop="handleCompletionNo(notif, i)"
                />
              </div>
              <div
                v-else-if="notif.type === 'still-going-check' && !notif.done"
                class="row q-gutter-xs"
              >
                <q-btn
                  dense
                  unelevated
                  color="positive"
                  label="Yes"
                  size="sm"
                  no-caps
                  @click.stop="handleStillGoingYes(notif, i)"
                />
                <q-btn
                  dense
                  unelevated
                  color="negative"
                  label="No"
                  size="sm"
                  no-caps
                  @click.stop="handleStillGoingNo(notif, i)"
                />
              </div>
              <q-badge v-else-if="notif.done" color="green" label="Done" />
              <div v-else class="row q-gutter-xs">
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
          >{{ $t('incomingOffers.noNotifications') }}</q-card-section
        >
      </q-card>
    </q-dialog>

    <q-page-container>
      <q-page class="page-content">
        <!-- Loading -->
        <div v-if="loading" class="state-center">
          <q-spinner color="primary" size="48px" />
          <div class="q-mt-md text-grey-7">{{ $t('incomingOffers.loadingOffers') }}</div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-center">
          <q-icon name="error_outline" size="72px" color="negative" />
          <div class="state-title">{{ $t('incomingOffers.couldNotLoad') }}</div>
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
          <div class="state-title">{{ $t('incomingOffers.noOffersTitle') }}</div>
          <div class="state-sub">{{ $t('incomingOffers.noOffersSubtitle') }}</div>
        </div>

        <!-- Offers list -->
        <div v-else class="offers-shell san3a-animate-in">
          <div class="page-title">{{ $t('incomingOffers.incomingOffersTitle') }}</div>
          <div class="row items-center justify-between q-mb-md">
            <q-badge color="primary" class="q-pa-sm text-body2"
              >{{ filteredOffers.length }}
              {{ filteredOffers.length === 1 ? 'offer' : 'offers' }}</q-badge
            >
            <q-select
              v-model="professionFilter"
              :options="professionFilterOptions"
              emit-value
              map-options
              dense
              outlined
              class="status-filter"
              :label="$t('incomingOffers.profession')"
            />
          </div>

          <div v-if="filteredOffers.length === 0" class="state-center-inline">
            <q-icon name="filter_alt_off" size="56px" color="grey-4" />
            <div class="state-sub">{{ $t('incomingOffers.noOffersStatus') }}</div>
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

            <div v-if="req.final_price" class="price-row q-mb-sm">
              <q-chip dense color="teal-2" text-color="teal-9" icon="check_circle"
                >{{ $t('incomingOffers.finalPrice', { amount: req.final_price }) }}</q-chip
              >
            </div>

            <!-- Multiple Offers -->
            <div class="offers-list">
              <div class="offers-list-title">
                <q-icon name="people" size="16px" color="primary" />
                <span
                  >{{ req.offers.length }} {{ req.offers.length === 1 ? 'offer' : 'offers' }}</span
                >
              </div>
              <div
                v-for="offer in req.offers"
                :key="offer.offer_id"
                class="single-offer"
                :class="{
                  'offer-accepted': offer.status === 'accepted',
                  'offer-rejected': offer.status === 'rejected',
                }"
              >
                <div class="single-offer-header">
                  <div class="fixer-name-row">
                    <q-icon name="person" size="16px" color="grey-7" />
                    <span class="fixer-name">{{
                      offer.fixerInfo?.full_name || $t('incomingOffers.unknownFixer')
                    }}</span>
                  </div>
                  <q-badge
                    :color="
                      offer.status === 'accepted'
                        ? 'green'
                        : offer.status === 'rejected'
                          ? 'red'
                          : 'orange'
                    "
                    :label="offer.status"
                    class="text-capitalize"
                  />
                </div>

                <div v-if="offer.fixerInfo" class="fixer-info-compact">
                  <span v-if="offer.fixerInfo.phone_number">
                    <q-icon name="phone" size="12px" color="grey-6" />
                    {{ offer.fixerInfo.phone_number }}
                  </span>
                  <span v-if="offer.fixerInfo.years_of_experience != null">
                    <q-icon name="workspace_premium" size="12px" color="grey-6" />
                    {{ offer.fixerInfo.years_of_experience }} yrs
                  </span>
                </div>

                <div v-if="offer.fixer_message" class="fixer-message">
                  <div class="fixer-message-title">{{ $t('incomingOffers.message') }}</div>
                  <div class="fixer-message-body">{{ offer.fixer_message }}</div>
                </div>

                <div class="price-row">
                  <q-chip dense color="orange-2" text-color="orange-9" icon="build"
                    >{{ $t('incomingOffers.offerAmount', { amount: offer.offered_price }) }}</q-chip
                  >
                  <q-chip
                    v-if="offer.customer_counter_price"
                    dense
                    color="green-2"
                    text-color="green-9"
                    icon="person"
                    >{{ $t('incomingOffers.yourCounter', { amount: offer.customer_counter_price }) }}</q-chip
                  >
                </div>

                <div v-if="isOfferActionable(req) && offer.status === 'pending'" class="action-row">
                  <q-btn
                    unelevated
                    dense
                    color="positive"
                    icon="check_circle"
                    :label="$t('incomingOffers.accept')"
                    no-caps
                    class="action-btn"
                    :loading="offer._accepting"
                    @click="acceptOffer(req, offer)"
                  />
                  <q-btn
                    unelevated
                    dense
                    color="negative"
                    icon="cancel"
                    :label="$t('incomingOffers.reject')"
                    no-caps
                    class="action-btn"
                    :loading="offer._rejecting"
                    @click="rejectOffer(offer)"
                  />
                  <q-btn
                    unelevated
                    dense
                    color="warning"
                    icon="gavel"
                    :label="$t('incomingOffers.bargain')"
                    no-caps
                    class="action-btn"
                    @click="openBargain(offer)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>

    <!-- Bargain Dialog -->
    <q-dialog v-model="bargainDialog" persistent>
      <q-card class="bargain-card">
        <q-card-section>
          <div class="bargain-title">{{ $t('incomingOffers.makeCounterOffer') }}</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            {{ $t('incomingOffers.fixerPrice', { amount: bargainTarget?.offered_price }) }}
          </div>
        </q-card-section>
        <q-form ref="bargainForm">
          <q-card-section class="q-pt-none">
            <q-input
              v-model.number="bargainPrice"
              type="number"
              :label="$t('incomingOffers.yourCounterOffer')"
              outlined
              dense
              autofocus
              min="1"
              :rules="[(v) => (!!v && Number(v) > 0) || $t('incomingOffers.enterValidPrice')]"
              @keyup.enter="submitBargain"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="grey-7" v-close-popup />
            <q-btn
              unelevated
              :label="$t('incomingOffers.sendOffer')"
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
        <q-tab name="home" icon="home" :label="$t('common.home')" @click="$router.push('/home')" />
        <q-tab
          name="offers"
          icon="handshake"
          :label="$t('common.requests')"
          @click="$router.push('/incoming-offers')"
        />
        <q-tab name="orders" icon="receipt_long" :label="$t('common.orders')" @click="$router.push('/orders')" />
        <q-tab name="profile" icon="person" :label="$t('common.profile')" @click="$router.push('/profile')" />
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
    <q-dialog v-model="showEtaMessage" persistent>
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
        <q-card-actions v-if="etaSecondsLeft > 0" align="center" class="q-pb-md">
          <q-btn unelevated color="primary" label="OK" no-caps @click="showEtaMessage = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Completion Check Popup -->
    <q-dialog v-model="showCompletionCheckDialog" persistent>
      <q-card style="min-width: 340px; border-radius: 20px">
        <q-card-section class="text-center">
          <q-icon name="task_alt" size="56px" color="primary" />
          <div class="text-h6 q-mt-sm">Request Status</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            Has request <strong>#{{ completionCheckTarget?.request_id }}</strong> been completed?
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md q-gutter-sm">
          <q-btn
            flat
            label="No"
            color="grey-7"
            no-caps
            @click="handleCompletionNo(completionCheckTarget)"
          />
          <q-btn
            unelevated
            color="positive"
            label="Yes, it's done"
            icon="check_circle"
            no-caps
            @click="handleCompletionYes(completionCheckTarget)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Still Going Check Popup -->
    <q-dialog v-model="showStillGoingCheckDialog" persistent>
      <q-card style="min-width: 340px; border-radius: 20px">
        <q-card-section class="text-center">
          <q-icon name="update" size="56px" color="warning" />
          <div class="text-h6 q-mt-sm">Request Status</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            Is request <strong>#{{ stillGoingCheckTarget?.request_id }}</strong> still going?
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md q-gutter-sm">
          <q-btn
            flat
            label="Yes, still going"
            color="grey-7"
            no-caps
            @click="handleStillGoingYes(stillGoingCheckTarget)"
          />
          <q-btn
            unelevated
            color="positive"
            label="No, it's done"
            icon="check_circle"
            no-caps
            @click="handleStillGoingNo(stillGoingCheckTarget)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Customer Review Dialog -->
    <q-dialog v-model="showCustomerReviewDialog" persistent>
      <q-card style="min-width: 340px; border-radius: 20px">
        <q-card-section class="text-center">
          <q-icon name="rate_review" size="56px" color="amber" />
          <div class="text-h6 q-mt-sm">Rate the Technician</div>
          <div class="text-body2 text-grey-7 q-mt-xs">How was the service?</div>
        </q-card-section>
        <q-card-section class="text-center">
          <q-rating v-model="customerReviewStars" size="2.5em" color="amber" icon="star" />
          <q-input
            v-model="customerReviewText"
            type="textarea"
            label="Leave a comment (optional)"
            filled
            autogrow
            class="q-mt-md"
          />
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md q-gutter-sm">
          <q-btn
            unelevated
            color="primary"
            label="Submit Review"
            no-caps
            :loading="customerReviewSubmitting"
            :disable="customerReviewStars === 0"
            @click="onSubmitCustomerReview()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { supabase } from 'src/boot/supabase'
import { useNotificationCenter } from 'src/composables/useNotificationCenter'
import { useArrivalCheck } from 'src/composables/useArrivalCheck'
import { useCustomerCompletionCheck } from 'src/composables/useCustomerCompletionCheck'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const { t } = useI18n()
const activeTab = ref('offers')
const loading = ref(true)
const error = ref(null)
const incomingOffers = ref([])
const showNotifications = ref(false)
const notificationCenter = useNotificationCenter()
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
} = notificationCenter
watch(showNotifications, (open) => {
  if (open) loadNotifications()
})

const {
  showCustomerReviewDialog,
  customerReviewStars,
  customerReviewText,
  customerReviewSubmitting,
  showCompletionCheckDialog,
  completionCheckTarget,
  showStillGoingCheckDialog,
  stillGoingCheckTarget,
  handleCompletionYes,
  handleCompletionNo,
  handleStillGoingYes,
  handleStillGoingNo,
  submitCustomerReview,
  handleCompletionNotifClick,
  autoShowPendingChecks,
} = useCustomerCompletionCheck(notificationCenter)
const customerUserId = ref(null)
const offersSubscription = ref(null)
const messageSubscription = ref(null)
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
  if (err) $q.notify({ type: 'negative', message: t('common.failedUpdateStatus') + ': ' + err.message })
  else {
    $q.notify({ type: 'positive', message: t('common.requestOngoing') })
    await fetchIncomingOffers()
  }
}

const handleArrivalNo = async () => {
  await reportNoArrival(arrivalCheckRequest.value)
  $q.notify({ type: 'info', message: t('common.technicianNotified') })
}

const onSubmitCustomerReview = async (skip = false) => {
  const success = await submitCustomerReview(skip)
  if (success) {
    $q.notify({
      type: 'positive',
      message: skip ? t('common.requestCompleted') : t('common.reviewSubmitted'),
    })
  }
}
const professionFilter = ref('all')
const professionFilterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Plumbing', value: 'plumber' },
  { label: 'Carpentry', value: 'carpenter' },
  { label: 'Electrical', value: 'electrician' },
  { label: 'Kitchen Utilities', value: 'kitchen_fitter' },
  { label: 'Painters', value: 'painter' },
  { label: 'Drapery', value: 'drapery_seamstress' },
]

const requestIdFilter = computed(() => {
  const raw = route.query.requestId
  return raw ? String(raw) : null
})

const filteredOffers = computed(() => {
  let offers = incomingOffers.value
  if (requestIdFilter.value)
    return offers.filter((r) => String(r.request_id) === requestIdFilter.value)
  if (professionFilter.value === 'all') return offers
  return offers.filter((r) => r.service_type === professionFilter.value)
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

const openNotification = (notif, index) => {
  if (handleCompletionNotifClick(notif, index)) {
    showNotifications.value = false
    return
  }
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

    // Fetch requests that are not completed
    const { data: requestsData, error: requestsErr } = await supabase
      .from('request')
      .select(
        'request_id, user_id, request_status, description_of_issue, request_date, schedule_time, service_location, payment_method, customer_price, fixer_price, final_price, technician_id, fixer_message, service_type',
      )
      .eq('user_id', customer.user_id)
      .neq('request_status', 'completed')
      .order('request_id', { ascending: false })

    if (requestsErr) {
      error.value = requestsErr.message
      incomingOffers.value = []
    } else {
      const requestRows = requestsData || []
      const requestIds = requestRows.map((r) => r.request_id)

      // Fetch all offers for these requests
      let offersMap = {}
      if (requestIds.length) {
        const { data: offersData } = await supabase
          .from('request_offers')
          .select(
            '*, technician:technician_id(technician_id, full_name, email, phone_number, years_of_experience)',
          )
          .in('request_id', requestIds)
          .order('created_at', { ascending: false })
        ;(offersData || []).forEach((o) => {
          if (!offersMap[o.request_id]) offersMap[o.request_id] = []
          offersMap[o.request_id].push({
            ...o,
            fixerInfo: o.technician || null,
          })
        })
      }

      // Build final list – include requests with request_offers entries
      // AND legacy requests that have fixer_price set directly on the row
      const result = requestRows
        .map((r) => {
          let offers = offersMap[r.request_id] || []
          // Legacy: if no request_offers rows but fixer_price exists, synthesize an offer
          if (offers.length === 0 && r.fixer_price && r.technician_id) {
            offers = [
              {
                offer_id: `legacy-${r.request_id}`,
                request_id: r.request_id,
                technician_id: r.technician_id,
                offered_price: r.fixer_price,
                customer_counter_price: r.customer_price || null,
                fixer_message: r.fixer_message || null,
                status: r.request_status === 'accepted' ? 'accepted' : 'pending',
                fixerInfo: null,
                _legacy: true,
              },
            ]
          }
          return { ...r, offers }
        })
        .filter((r) => r.offers.length > 0)

      // Fetch technician info for legacy offers missing fixerInfo
      const legacyTechIds = [
        ...new Set(
          result.flatMap((r) =>
            r.offers.filter((o) => o._legacy && !o.fixerInfo).map((o) => o.technician_id),
          ),
        ),
      ]
      if (legacyTechIds.length) {
        const { data: techRows } = await supabase
          .from('technician')
          .select('technician_id, full_name, email, phone_number, years_of_experience')
          .in('technician_id', legacyTechIds)
        const techMap = {}
        ;(techRows || []).forEach((t) => {
          techMap[t.technician_id] = t
        })
        result.forEach((r) => {
          r.offers.forEach((o) => {
            if (o._legacy && !o.fixerInfo && techMap[o.technician_id]) {
              o.fixerInfo = techMap[o.technician_id]
            }
          })
        })
      }
      incomingOffers.value = result
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
        event: '*',
        schema: 'public',
        table: 'request',
        filter: `user_id=eq.${customerUserId.value}`,
      },
      () => fetchIncomingOffers(),
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'request_offers',
      },
      () => fetchIncomingOffers(),
    )
    .subscribe()
}

const subscribeToFixerMessages = () => {
  messageSubscription.value?.unsubscribe()
  messageSubscription.value = supabase
    .channel('customer-offer-events')
    .on('broadcast', { event: 'fixer-bid-message' }, () => {
      fetchIncomingOffers()
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

const acceptOffer = async (req, offer) => {
  offer._accepting = true
  // Mark this offer as accepted
  const { error: offerErr } = await supabase
    .from('request_offers')
    .update({ status: 'accepted' })
    .eq('offer_id', offer.offer_id)
  if (offerErr) {
    offer._accepting = false
    $q.notify({ type: 'negative', message: t('common.failedAccept') + ': ' + offerErr.message })
    return
  }
  // Reject all other pending offers for this request
  await supabase
    .from('request_offers')
    .update({ status: 'rejected' })
    .eq('request_id', req.request_id)
    .neq('offer_id', offer.offer_id)
    .eq('status', 'pending')
  // Update request with chosen technician
  const { error: reqErr } = await supabase
    .from('request')
    .update({
      request_status: 'accepted',
      technician_id: offer.technician_id,
      fixer_price: offer.offered_price,
      final_price: offer.offered_price,
      fixer_message: offer.fixer_message || null,
    })
    .eq('request_id', req.request_id)

  offer._accepting = false
  if (reqErr)
    $q.notify({ type: 'negative', message: t('common.failedUpdateRequest') + ': ' + reqErr.message })
  else {
    $q.notify({ type: 'positive', message: t('common.offerAccepted') })
    await fetchIncomingOffers()
  }
}

const rejectOffer = async (offer) => {
  offer._rejecting = true
  const { error: err } = await supabase
    .from('request_offers')
    .update({ status: 'rejected' })
    .eq('offer_id', offer.offer_id)
  offer._rejecting = false
  if (err) $q.notify({ type: 'negative', message: t('common.failedReject') + ': ' + err.message })
  else {
    $q.notify({ type: 'warning', message: t('common.offerRejected') })
    await fetchIncomingOffers()
  }
}

const bargainDialog = ref(false)
const bargainTarget = ref(null)
const bargainPrice = ref(null)
const bargainLoading = ref(false)
const bargainForm = ref(null)

const openBargain = (offer) => {
  bargainTarget.value = offer
  bargainPrice.value = offer.customer_counter_price ? Number(offer.customer_counter_price) : null
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
    .from('request_offers')
    .update({ customer_counter_price: price })
    .eq('offer_id', bargainTarget.value.offer_id)
    .select()
  bargainLoading.value = false
  if (err) {
    console.error('[Bargain] Supabase error:', err)
    $q.notify({ type: 'negative', message: t('common.failedSaveOffer') + ': ' + err.message })
  } else if (!data || data.length === 0) {
    console.warn('[Bargain] 0 rows updated')
    $q.notify({ type: 'warning', message: t('common.updateBlocked') })
  } else {
    bargainTarget.value.customer_counter_price = price
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
          message: t('common.counterOfferNotifFailed'),
        })
      }
    } else {
      console.warn('Counter-offer notification skipped: fixer email not found.')
      $q.notify({
        type: 'warning',
        message: t('common.fixerEmailNotFound'),
      })
    }
    $q.notify({ type: 'positive', message: t('common.offerSent') })
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
    await fetchIncomingOffers()
  }
}

onMounted(async () => {
  await fetchIncomingOffers()
  await loadNotifications()
  autoShowPendingChecks()
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

.offers-list {
  margin-top: 8px;
}
.offers-list-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--san3a-primary);
  margin-bottom: 10px;
}
.single-offer {
  border: 1px solid var(--san3a-gray-200);
  border-radius: var(--san3a-radius-lg);
  padding: 12px;
  margin-bottom: 10px;
  background: var(--san3a-gray-50);
  transition: border-color 0.2s;
}
.single-offer:hover {
  border-color: rgba(13, 115, 119, 0.24);
}
.single-offer.offer-accepted {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.05);
}
.single-offer.offer-rejected {
  opacity: 0.6;
}
.single-offer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.fixer-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.fixer-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--san3a-gray-800);
}
.fixer-info-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--san3a-gray-500);
  margin-bottom: 8px;
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
