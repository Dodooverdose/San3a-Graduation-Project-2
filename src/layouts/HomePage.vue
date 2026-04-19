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

    <!-- Notifications Panel -->
    <q-dialog v-model="showNotifications" position="top" seamless>
      <q-card class="notif-card">
        <q-card-section class="row items-center q-pb-sm">
          <div class="notif-card-title">{{ $t('homePage.notifications') }}</div>
          <q-space />
          <q-btn
            v-if="notifications.length > 0"
            flat
            dense
            no-caps
            :label="$t('homePage.clearAll')"
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
                        : notif.type === 'complaint-resolution'
                          ? 'gavel'
                          : 'build'
                  "
                  size="20px"
                />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="notif-name">
                {{
                  notif.type === 'completion-check' ||
                  notif.type === 'still-going-check' ||
                  notif.type === 'complaint-resolution'
                    ? notif.title || $t('homePage.notification')
                    : notif.fixerName
                }}
              </q-item-label>
              <q-item-label caption>
                {{
                  notif.type === 'completion-check' ||
                  notif.type === 'still-going-check' ||
                  notif.type === 'complaint-resolution'
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
                  :label="$t('common.yes')"
                  size="sm"
                  no-caps
                  @click.stop="handleCompletionYes(notif, i)"
                />
                <q-btn
                  dense
                  unelevated
                  color="negative"
                  :label="$t('common.no')"
                  size="sm"
                  no-caps
                  @click.stop="handleCompletionNo(notif, i)"
                />
              </div>
              <div
                v-else-if="notif.type === 'complaint-resolution' && !notif.done"
                class="row q-gutter-xs"
              >
                <q-btn
                  dense
                  unelevated
                  color="positive"
                  :label="$t('common.yes')"
                  size="sm"
                  no-caps
                  @click.stop="handleComplaintResolutionYes(notif, i)"
                />
                <q-btn
                  dense
                  unelevated
                  color="negative"
                  :label="$t('common.no')"
                  size="sm"
                  no-caps
                  @click.stop="handleComplaintResolutionNo(notif, i)"
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
                  :label="$t('common.yes')"
                  size="sm"
                  no-caps
                  @click.stop="handleStillGoingYes(notif, i)"
                />
                <q-btn
                  dense
                  unelevated
                  color="negative"
                  :label="$t('common.no')"
                  size="sm"
                  no-caps
                  @click.stop="handleStillGoingNo(notif, i)"
                />
              </div>
              <q-badge v-else-if="notif.done" color="green" :label="$t('common.done')" />
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
        <q-card-section v-else class="text-center text-grey-5 q-py-lg">{{
          $t('homePage.noOffersYet')
        }}</q-card-section>
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
                <div class="hero-eyebrow">{{ $t('homePage.welcomeBack') }}</div>
                <div class="hero-title">{{ $t('homePage.heroTitle') }}</div>
                <div class="hero-subtitle">
                  {{ $t('homePage.heroSubtitle') }}
                </div>
              </div>
              <div class="hero-actions">
                <q-btn
                  unelevated
                  no-caps
                  class="hero-btn-primary"
                  icon="assignment"
                  :label="$t('common.requests')"
                  @click="goToPage('/incoming-offers')"
                />
                <q-btn
                  flat
                  no-caps
                  class="hero-btn-ghost"
                  icon="person"
                  :label="$t('common.profile')"
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
                <div class="recent-title">{{ $t('homePage.recentRequests') }}</div>
                <div class="recent-sub">{{ $t('homePage.recentRequestsSubtitle') }}</div>
              </div>
              <q-chip outline color="primary" icon="chevron_right" clickable>{{
                $t('homePage.openRequests')
              }}</q-chip>
            </div>
            <q-separator />
            <div class="recent-body">
              <div v-if="loadingRecentRequests" class="text-center q-py-md text-grey-6">
                {{ $t('homePage.loadingRequests') }}
              </div>
              <div v-else-if="recentRequests.length === 0" class="text-center q-py-lg text-grey-6">
                {{ $t('homePage.noRequestsYet') }}
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
                        {{ req._description || $t('homePage.noDescriptionProvided') }}
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
        <q-tab name="home" icon="home" :label="$t('common.home')" @click="goToPage('/home')" />
        <q-tab
          name="offers"
          icon="handshake"
          :label="$t('common.requests')"
          @click="goToPage('/incoming-offers')"
        />
        <q-tab
          name="orders"
          icon="receipt_long"
          :label="$t('common.orders')"
          @click="goToPage('/orders')"
        />
        <q-tab
          name="profile"
          icon="person"
          :label="$t('common.profile')"
          @click="goToPage('/profile')"
        />
      </q-tabs>
    </q-footer>

    <!-- Arrival Check Dialog -->
    <q-dialog v-model="showArrivalDialog" persistent>
      <q-card style="min-width: 320px; border-radius: 20px">
        <q-card-section class="text-center">
          <q-icon name="person_pin_circle" size="56px" color="primary" />
          <div class="text-h6 q-mt-sm">{{ $t('homePage.didTechnicianArrive') }}</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            Request #{{ arrivalCheckRequest?.request_id }}
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md q-gutter-sm">
          <q-btn
            unelevated
            color="positive"
            :label="$t('common.yes')"
            icon="check"
            no-caps
            @click="handleArrivalYes"
          />
          <q-btn
            unelevated
            color="negative"
            :label="$t('common.no')"
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
          <div class="text-h6 q-mt-sm">{{ $t('homePage.technicianETA') }}</div>
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
          <div v-else class="text-h6 text-negative q-mt-md">{{ $t('homePage.timeIsUp') }}</div>
          <div class="text-body2 text-grey-7 q-mt-sm">Request #{{ etaRequestId }}</div>
        </q-card-section>
        <q-card-actions v-if="etaSecondsLeft > 0" align="center" class="q-pb-md">
          <q-btn
            unelevated
            color="primary"
            :label="$t('common.ok')"
            no-caps
            @click="showEtaMessage = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Completion Check Popup -->
    <q-dialog v-model="showCompletionCheckDialog" persistent>
      <q-card style="min-width: 340px; border-radius: 20px">
        <q-card-section class="text-center">
          <q-icon name="task_alt" size="56px" color="primary" />
          <div class="text-h6 q-mt-sm">{{ $t('homePage.requestStatus') }}</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            {{ $t('homePage.hasRequestCompleted', { id: completionCheckTarget?.request_id }) }}
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md q-gutter-sm">
          <q-btn
            flat
            :label="$t('common.no')"
            color="grey-7"
            no-caps
            @click="handleCompletionNo(completionCheckTarget)"
          />
          <q-btn
            unelevated
            color="positive"
            :label="$t('homePage.yesItsDone')"
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
          <div class="text-h6 q-mt-sm">{{ $t('homePage.requestStatus') }}</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            {{ $t('homePage.isRequestStillGoing', { id: stillGoingCheckTarget?.request_id }) }}
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md q-gutter-sm">
          <q-btn
            flat
            :label="$t('homePage.yesStillGoing')"
            color="grey-7"
            no-caps
            @click="handleStillGoingYes(stillGoingCheckTarget)"
          />
          <q-btn
            unelevated
            color="positive"
            :label="$t('homePage.noItsDone')"
            icon="check_circle"
            no-caps
            @click="handleStillGoingNo(stillGoingCheckTarget)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Complaint Resolution Popup -->
    <q-dialog v-model="showComplaintResolutionDialog" persistent>
      <q-card style="min-width: 340px; border-radius: 20px">
        <q-card-section class="text-center">
          <q-icon name="gavel" size="56px" color="primary" />
          <div class="text-h6 q-mt-sm">{{ $t('homePage.complaintResolution') }}</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            {{
              $t('homePage.complaintReviewed', {
                id: complaintResolutionTarget?.payload?.complaintId,
              })
            }}
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md q-gutter-sm">
          <q-btn
            flat
            :label="$t('common.no')"
            color="grey-7"
            no-caps
            @click="handleComplaintResolutionNo(complaintResolutionTarget)"
          />
          <q-btn
            unelevated
            color="positive"
            :label="$t('homePage.yesResolved')"
            icon="check_circle"
            no-caps
            @click="handleComplaintResolutionYes(complaintResolutionTarget)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Complaint Thank You Dialog -->
    <q-dialog v-model="showComplaintThankYouDialog">
      <q-card style="min-width: 340px; border-radius: 20px">
        <q-card-section class="text-center q-pt-lg">
          <img
            src="/icons/White.png"
            alt="San3a logo"
            style="
              width: 80px;
              height: 80px;
              object-fit: contain;
              background: #2d6a4f;
              border-radius: 16px;
              padding: 10px;
            "
          />
          <div class="text-h6 q-mt-md">{{ $t('homePage.issueResolved') }}</div>
          <div class="text-body1 q-mt-sm" style="color: #2d6a4f">
            {{ $t('homePage.thanksForChoosing') }}
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md">
          <q-btn
            unelevated
            color="primary"
            :label="$t('common.close')"
            no-caps
            @click="showComplaintThankYouDialog = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Customer Review Dialog -->
    <q-dialog v-model="showCustomerReviewDialog" persistent>
      <q-card style="min-width: 340px; border-radius: 20px">
        <q-card-section class="text-center">
          <q-icon name="rate_review" size="56px" color="amber" />
          <div class="text-h6 q-mt-sm">{{ $t('homePage.rateTechnician') }}</div>
          <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('homePage.howWasService') }}</div>
        </q-card-section>
        <q-card-section class="text-center">
          <q-rating v-model="customerReviewStars" size="2.5em" color="amber" icon="star" />
          <q-input
            v-model="customerReviewText"
            type="textarea"
            :label="$t('homePage.leaveComment')"
            filled
            autogrow
            class="q-mt-md"
          />
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md q-gutter-sm">
          <q-btn
            unelevated
            color="primary"
            :label="$t('homePage.submitReview')"
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useI18n } from 'vue-i18n'
import { useNotificationCenter } from 'src/composables/useNotificationCenter'
import { useArrivalCheck } from 'src/composables/useArrivalCheck'
import { useCustomerCompletionCheck } from 'src/composables/useCustomerCompletionCheck'

const router = useRouter()
const $q = useQuasar()
const { t } = useI18n()
const notificationCenter = useNotificationCenter()
const {
  notifications,
  unreadCount,
  setRecipientEmail,
  loadNotifications,
  markAsRead,
  dismissNotification,
  clearAllNotifications,
  getNotifMessage,
} = notificationCenter

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
  if (error)
    $q.notify({ type: 'negative', message: t('homePage.failedUpdateStatus') + error.message })
  else $q.notify({ type: 'positive', message: t('homePage.requestOngoing') })
}

const handleArrivalNo = async () => {
  await reportNoArrival(arrivalCheckRequest.value)
  $q.notify({ type: 'info', message: t('homePage.technicianNotified') })
}

const onSubmitCustomerReview = async (skip = false) => {
  const success = await submitCustomerReview(skip)
  if (success) {
    $q.notify({
      type: 'positive',
      message: skip ? t('homePage.requestCompleted') : t('homePage.reviewSubmitted'),
    })
  }
}

const showNotifications = ref(false)
watch(showNotifications, (open) => {
  if (open) loadNotifications()
})
const activeTab = ref('home')
const customerUserId = ref(null)
const offersSubscription = ref(null)
const knownOfferPrices = ref(new Map())
const recentRequests = ref([])
const loadingRecentRequests = ref(false)

// Complaint resolution state
const showComplaintResolutionDialog = ref(false)
const complaintResolutionTarget = ref(null)
const showComplaintThankYouDialog = ref(false)

const handleComplaintResolutionYes = async (notif, index) => {
  try {
    if (typeof index === 'number') {
      notifications.value[index] = { ...notifications.value[index], done: true }
      markAsRead(index)
    }
    showComplaintResolutionDialog.value = false
    showNotifications.value = false
    showComplaintThankYouDialog.value = true
  } catch (err) {
    console.error('Complaint resolution Yes failed:', err)
  }
}

const handleComplaintResolutionNo = async (notif, index) => {
  const complaintId = notif?.payload?.complaintId || notif?.notif?.payload?.complaintId
  try {
    if (complaintId) {
      const { error: updateErr } = await supabase
        .from('complaint')
        .update({ status: 'Unsolved' })
        .eq('complaint_id', complaintId)
      if (updateErr) console.error('Failed to revert complaint status:', updateErr)

      // Notify admin to re-review
      const { data: admins, error: adminErr } = await supabase.from('admin').select('email')
      if (adminErr) console.error('Failed to fetch admins:', adminErr)
      if (admins?.length) {
        for (const admin of admins) {
          const { error: notifErr } = await supabase.from('notification_center').insert({
            recipient_email: admin.email.trim().toLowerCase(),
            title: 'Complaint Re-review Required',
            message: `Complainant rejected the resolution for complaint #${complaintId}. Please re-review the issue.`,
            notification_type: 'general',
            icon: 'warning',
            payload: { complaintId, type: 'complaint-re-review' },
          })
          if (notifErr) console.error('Failed to notify admin:', notifErr)
        }
      }
    }
    if (typeof index === 'number') {
      notifications.value[index] = { ...notifications.value[index], done: true }
      markAsRead(index)
    }
    showComplaintResolutionDialog.value = false
    showNotifications.value = false
    $q.notify({
      type: 'info',
      message: t('homePage.adminNotified'),
      position: 'top',
    })
  } catch (err) {
    console.error('Complaint resolution No failed:', err)
    $q.notify({
      type: 'negative',
      message: t('homePage.somethingWrong'),
      position: 'top',
    })
  }
}

const openNotification = (notif, index) => {
  if (notif.type === 'complaint-resolution' && !notif.done) {
    complaintResolutionTarget.value = notif
    showComplaintResolutionDialog.value = true
    showNotifications.value = false
    return
  }
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
    autoShowPendingChecks()
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

const items = computed(() => [
  { label: t('services.plumbing'), icon: '/icons/plumbing.png', route: '/plumbing' },
  { label: t('services.carpentry'), icon: '/icons/carpentry.png', route: '/carpentry' },
  { label: t('services.electrical'), icon: '/icons/electrical.png', route: '/electrical' },
  { label: t('services.kitchenUtilities'), icon: '/icons/kitchen.png', route: '/kitchen' },
  { label: t('services.paintersAndDecorators'), icon: '/icons/painters.png', route: '/painters' },
  { label: t('services.draperySeamstress'), icon: '/icons/drapery.png', route: '/drapery' },
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
