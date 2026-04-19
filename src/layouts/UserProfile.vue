<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="app-header-teal">
      <q-toolbar class="app-toolbar">
        <div class="header-brand">
          <div class="header-brand-icon-w">
            <img src="/icons/White.png" alt="Sanعa logo" class="brand-logo-mark" />
          </div>
          <span class="header-brand-name-w">{{ $t('userProfile.headerTitle') }}</span>
        </div>
        <q-space />
        <q-btn
          flat
          no-caps
          icon="logout"
          :label="$t('common.logOut')"
          class="header-logout-btn"
          @click="logout"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="profile-page">
        <div v-if="loading" class="state-center">
          <q-spinner-dots size="48px" color="primary" />
          <div class="text-grey-7 q-mt-sm">{{ $t('userProfile.loadingProfile') }}</div>
        </div>

        <div v-else class="profile-wrap san3a-animate-in">
          <section class="profile-hero">
            <div class="hero-left">
              <q-btn
                flat
                round
                class="avatar-btn"
                aria-label="Change profile picture"
                @click="openFilePicker"
              >
                <q-avatar size="112px" class="profile-avatar">
                  <img :src="avatarUrl" alt="Profile picture" />
                </q-avatar>
                <div class="avatar-overlay">
                  <q-icon name="camera_alt" size="20px" color="white" />
                </div>
              </q-btn>
              <input
                ref="fileInputRef"
                class="visually-hidden"
                type="file"
                accept="image/*"
                @change="onFileChange"
              />

              <div>
                <div class="hero-name-row">
                  <h1 class="hero-name">{{ profileName || $t('userProfile.unknownUser') }}</h1>
                  <q-badge
                    :color="isTechnician ? 'primary' : 'secondary'"
                    text-color="white"
                    class="role-badge"
                  >
                    {{ isTechnician ? $t('userProfile.technician') : $t('userProfile.customer') }}
                  </q-badge>
                  <q-badge
                    v-if="isVerifiedAccount"
                    color="positive"
                    text-color="white"
                    class="verify-badge"
                  >
                    <q-icon name="verified" size="12px" class="q-mr-xs" />
                    {{ $t('common.verified') }}
                  </q-badge>
                </div>
                <div class="hero-subline">{{ profileEmail || $t('userProfile.noEmailFound') }}</div>
                <div class="hero-meta">
                  <span>{{ roleCity }}</span>
                  <span>{{ $t('userProfile.joined', { date: memberSinceLabel }) }}</span>
                  <span v-if="isTechnician">{{
                    $t('userProfile.completedJobs', { count: jobsCompleted })
                  }}</span>
                </div>
                <div v-if="totalRatings > 0" class="hero-rating">
                  <q-rating
                    :model-value="averageRating"
                    size="20px"
                    color="amber"
                    icon="star"
                    icon-half="star_half"
                    icon-selected="star"
                    readonly
                  />
                  <span class="rating-text">{{ averageRating }}</span>
                  <span class="rating-count"
                    >({{ totalRatings }}
                    {{ totalRatings === 1 ? $t('common.review') : $t('common.reviews') }})</span
                  >
                </div>
              </div>
            </div>

            <div class="hero-right">
              <q-btn
                unelevated
                no-caps
                color="primary"
                icon="edit"
                :label="editing ? $t('userProfile.cancelEditing') : $t('userProfile.editProfile')"
                @click="toggleEditing"
              />
            </div>
          </section>

          <section v-if="completionPercent < 100" class="completion-card">
            <div class="completion-ring">
              <q-circular-progress
                show-value
                :value="completionPercent"
                size="82px"
                :thickness="0.18"
                color="primary"
                track-color="grey-3"
                class="text-primary text-weight-bold"
              >
                {{ completionPercent }}%
              </q-circular-progress>
            </div>
            <div class="completion-content">
              <div class="completion-title">{{ $t('userProfile.completeProfile') }}</div>
              <div class="completion-sub">{{ $t('userProfile.completeProfileSub') }}</div>
              <ul class="missing-list" v-if="missingItems.length">
                <li v-for="item in missingItems" :key="item">
                  <q-icon name="warning" size="14px" color="warning" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
          </section>

          <section class="profile-grid">
            <div class="left-col">
              <q-card flat bordered class="profile-card">
                <q-card-section>
                  <div class="card-head">
                    <div class="card-title">{{ $t('userProfile.personalInfo') }}</div>
                    <q-icon name="person" color="grey-6" />
                  </div>

                  <div class="form-grid">
                    <q-input
                      v-model="form.full_name"
                      :label="$t('userProfile.fullName')"
                      outlined
                      dense
                      :readonly="!editing"
                    />
                    <q-input
                      v-model="form.phone_number"
                      :label="$t('userProfile.phoneNumber')"
                      outlined
                      dense
                      :readonly="!editing"
                      prefix="+20"
                      mask="### #### ####"
                      unmasked-value
                      :rules="[
                        (val) =>
                          !val || /^[0-9]{10,11}$/.test(val) || $t('userProfile.invalidPhone'),
                      ]"
                    />
                    <q-input
                      :model-value="profileEmail"
                      :label="$t('common.email')"
                      outlined
                      dense
                      readonly
                    >
                      <template #append>
                        <q-icon v-if="emailVerified" name="check_circle" color="positive" />
                      </template>
                    </q-input>
                    <q-select
                      v-if="isTechnician"
                      v-model="form.specialty"
                      :options="specialtyOptions"
                      :label="$t('userProfile.specialty')"
                      outlined
                      dense
                      emit-value
                      map-options
                      :readonly="!editing"
                    />
                    <q-input
                      v-if="isTechnician"
                      v-model.number="form.years_of_experience"
                      type="number"
                      min="0"
                      :label="$t('userProfile.yearsOfExperience')"
                      outlined
                      dense
                      :readonly="!editing"
                    />
                  </div>
                </q-card-section>
              </q-card>

              <q-card flat bordered class="profile-card">
                <q-card-section>
                  <div class="card-head">
                    <div class="card-title">{{ $t('userProfile.security') }}</div>
                    <q-icon name="security" color="grey-6" />
                  </div>

                  <div class="security-row">
                    <div>
                      <div class="row-title">{{ $t('userProfile.passwordTitle') }}</div>
                      <div class="row-sub">{{ $t('userProfile.passwordSub') }}</div>
                    </div>
                    <q-btn
                      flat
                      color="primary"
                      no-caps
                      :label="$t('common.change')"
                      @click="goToPage('/reset-password')"
                    />
                  </div>

                  <div class="security-row">
                    <div>
                      <div class="row-title">{{ $t('userProfile.twoFactor') }}</div>
                      <div class="row-sub">{{ $t('userProfile.twoFactorSub') }}</div>
                    </div>
                    <q-toggle v-model="twoFactorEnabled" color="primary" disable />
                  </div>
                </q-card-section>
              </q-card>

              <q-card flat bordered class="profile-card">
                <q-card-section>
                  <div class="card-head">
                    <div class="card-title">{{ $t('userProfile.preferences') }}</div>
                    <q-icon name="settings" color="grey-6" />
                  </div>

                  <div class="pref-row">
                    <q-icon name="language" color="grey-6" />
                    <span>{{ $t('userProfile.language') }}</span>
                    <q-space />
                    <q-select
                      v-model="language"
                      :options="languageOptions"
                      dense
                      outlined
                      emit-value
                      map-options
                      style="min-width: 140px"
                    />
                  </div>

                  <div class="pref-row">
                    <q-icon name="dark_mode" color="grey-6" />
                    <span>{{ $t('userProfile.darkMode') }}</span>
                    <q-space />
                    <q-toggle v-model="darkMode" color="primary" />
                  </div>
                </q-card-section>
              </q-card>

              <q-card v-if="isTechnician" flat bordered class="profile-card">
                <q-card-section>
                  <div class="card-head">
                    <div class="card-title">{{ $t('userProfile.servicesExpertise') }}</div>
                    <q-icon name="construction" color="grey-6" />
                  </div>

                  <div class="chips-wrap">
                    <q-chip
                      v-for="service in serviceChips"
                      :key="service"
                      dense
                      color="primary"
                      text-color="white"
                      class="service-chip"
                    >
                      {{ service }}
                    </q-chip>
                    <div v-if="serviceChips.length === 0" class="row-sub">
                      {{ $t('userProfile.noServicesYet') }}
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="right-col">
              <q-card flat bordered class="profile-card">
                <q-card-section>
                  <div class="card-head">
                    <div class="card-title">{{ $t('userProfile.accountStats') }}</div>
                    <q-icon name="trending_up" color="grey-6" />
                  </div>
                  <div class="stats-list">
                    <div class="stats-item" v-for="item in statItems" :key="item.label">
                      <div class="stats-label">{{ item.label }}</div>
                      <div class="stats-value">{{ item.value }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <q-card flat bordered class="profile-card">
                <q-card-section>
                  <div class="card-head">
                    <div class="card-title">{{ $t('userProfile.verificationStatus') }}</div>
                    <q-icon name="verified_user" color="grey-6" />
                  </div>

                  <div class="verify-row">
                    <span>{{ $t('userProfile.emailVerified') }}</span>
                    <q-badge :color="emailVerified ? 'positive' : 'warning'" text-color="white">
                      {{ emailVerified ? $t('common.verified') : $t('common.pending') }}
                    </q-badge>
                  </div>
                  <div v-if="isTechnician" class="verify-row">
                    <span>{{ $t('userProfile.technicianVerification') }}</span>
                    <q-badge :color="isVerifiedAccount ? 'positive' : 'warning'" text-color="white">
                      {{ technicianVerificationLabel }}
                    </q-badge>
                  </div>
                </q-card-section>
              </q-card>

              <q-card flat bordered class="profile-card">
                <q-card-section>
                  <div class="card-head">
                    <div class="card-title">{{ $t('userProfile.recentActivity') }}</div>
                    <q-icon name="history" color="grey-6" />
                  </div>

                  <div v-if="recentActivity.length === 0" class="row-sub">
                    {{ $t('userProfile.noRecentActivity') }}
                  </div>
                  <div v-else class="activity-list">
                    <div v-for="item in recentActivity" :key="item.id" class="activity-item">
                      <div class="activity-main">{{ item.title }}</div>
                      <div class="activity-time">{{ item.time }}</div>
                    </div>
                  </div>

                  <q-btn
                    unelevated
                    no-caps
                    color="negative"
                    icon="report_problem"
                    :label="$t('userProfile.fileComplaint')"
                    class="full-width q-mt-md"
                    @click="openComplaintDialog"
                  />
                </q-card-section>
              </q-card>
            </div>
          </section>

          <transition name="slide-up">
            <div v-if="editing" class="sticky-save">
              <q-btn
                flat
                no-caps
                :label="$t('userProfile.discard')"
                color="grey-7"
                @click="discardChanges"
              />
              <q-btn
                unelevated
                no-caps
                color="primary"
                :label="$t('userProfile.saveChanges')"
                :loading="saving"
                @click="saveProfile"
              />
            </div>
          </transition>

          <!-- Complaint Dialog -->
          <q-dialog v-model="showComplaintDialog" persistent>
            <q-card style="min-width: 420px; max-width: 520px">
              <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ $t('userProfile.fileComplaint') }}</div>
                <q-space />
                <q-btn icon="close" flat round dense @click="showComplaintDialog = false" />
              </q-card-section>

              <q-card-section>
                <q-form @submit.prevent="submitComplaint" class="q-gutter-md">
                  <q-select
                    v-if="isTechnician"
                    v-model="complaintForm.request_id"
                    :options="technicianRequestOptions"
                    outlined
                    dense
                    :label="$t('userProfile.selectRequest')"
                    emit-value
                    map-options
                    :rules="[(val) => !!val || $t('userProfile.selectRequestRequired')]"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          {{ $t('userProfile.noRequestsFound') }}
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>

                  <q-select
                    v-else
                    v-model="complaintForm.request_id"
                    :options="userRequestOptions"
                    outlined
                    dense
                    :label="$t('userProfile.selectRequest')"
                    emit-value
                    map-options
                    :rules="[(val) => !!val || $t('userProfile.selectRequestRequired')]"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          {{ $t('userProfile.noRequestsFound') }}
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>

                  <q-select
                    v-model="complaintForm.issue_type"
                    :options="activeIssueTypeOptions"
                    outlined
                    dense
                    :label="$t('userProfile.issueType')"
                    :rules="[(val) => !!val || $t('userProfile.selectIssueType')]"
                  />

                  <q-input
                    v-model="complaintForm.description"
                    :label="$t('userProfile.description')"
                    outlined
                    type="textarea"
                    rows="4"
                    :rules="[
                      (val) => (!!val && val.trim().length > 0) || $t('userProfile.describeIssue'),
                    ]"
                  />

                  <q-btn
                    type="submit"
                    unelevated
                    no-caps
                    color="negative"
                    :label="$t('userProfile.submitComplaint')"
                    class="full-width"
                    :loading="submittingComplaint"
                  />
                </q-form>
              </q-card-section>
            </q-card>
          </q-dialog>
        </div>
      </q-page>
    </q-page-container>

    <q-footer v-if="!loading" elevated class="bottom-nav">
      <q-tabs
        v-model="activeTab"
        active-color="white"
        indicator-color="transparent"
        class="nav-tabs"
        dense
      >
        <template v-if="isTechnician">
          <q-tab
            name="requests"
            icon="request_page"
            :label="$t('common.requests')"
            @click="goToPage('/service-provider')"
          />
          <q-tab
            name="orders"
            icon="receipt_long"
            :label="$t('common.orders')"
            @click="goToPage({ path: '/service-provider', query: { tab: 'orders' } })"
          />
          <q-tab
            name="profile"
            icon="person"
            :label="$t('common.profile')"
            @click="goToPage('/profile')"
          />
        </template>
        <template v-else>
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
        </template>
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const router = useRouter()
const $q = useQuasar()

const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const activeTab = ref('profile')
const darkMode = ref($q.dark.isActive)
const language = ref(localStorage.getItem('san3a-locale') || 'en-US')
const twoFactorEnabled = ref(false)

const fileInputRef = ref(null)
const avatarUrl = ref('/icons/pfp.png')
let objectUrl = null

const profileName = ref('')
const profileEmail = ref('')
const memberSince = ref(null)
const roleCity = ref('Cairo')
const userRole = ref('customer')
const customerId = ref(null)
const technicianId = ref(null)
const technicianVerificationStatus = ref('pending')
const technicianIsVerified = ref(false)

const averageRating = ref(0)
const totalRatings = ref(0)

const requestsPosted = ref(0)
const activeRequests = ref(0)
const completedRequests = ref(0)
const offersSent = ref(0)
const acceptedJobs = ref(0)
const jobsCompleted = ref(0)
const responseRate = ref('--')
const recentActivity = ref([])

const showComplaintDialog = ref(false)
const submittingComplaint = ref(false)
const userRequestOptions = ref([])
const complaintForm = ref({
  request_id: null,
  issue_type: null,
  description: '',
})

const customerIssueTypeOptions = computed(() => [
  t('userProfile.serviceQuality'),
  t('userProfile.lateArrival'),
  t('userProfile.overcharging'),
  t('userProfile.unprofessionalBehavior'),
  t('userProfile.incompleteWork'),
  t('userProfile.damageToProperty'),
  t('userProfile.noShow'),
  t('userProfile.communicationIssue'),
  t('userProfile.other'),
])

const technicianIssueTypeOptions = computed(() => [
  t('userProfile.customerNoShow'),
  t('userProfile.incorrectJobDescription'),
  t('userProfile.unsafeWorkEnvironment'),
  t('userProfile.paymentDispute'),
  t('userProfile.harassmentOrAbuse'),
  t('userProfile.unreachableCustomer'),
  t('userProfile.cancelledAfterArrival'),
  t('userProfile.scopeChangeWithoutNotice'),
  t('userProfile.other'),
])

const activeIssueTypeOptions = computed(() =>
  isTechnician.value ? technicianIssueTypeOptions.value : customerIssueTypeOptions.value,
)

const customerOptions = ref([])
const technicianRequestOptions = ref([])
const requestCustomerMap = ref({})
const requestTechnicianMap = ref({})

const form = ref({
  full_name: '',
  phone_number: '',
  specialty: '',
  years_of_experience: null,
})

const initialForm = ref({
  full_name: '',
  phone_number: '',
  specialty: '',
  years_of_experience: null,
})

const languageOptions = [
  { label: 'English', value: 'en-US' },
  { label: 'العربية', value: 'ar' },
  { label: 'Français', value: 'fr' },
  { label: 'Deutsch', value: 'de' },
]

const specialtyOptions = computed(() => [
  { label: t('services.plumbing'), value: 'plumber' },
  { label: t('services.carpentry'), value: 'carpenter' },
  { label: t('services.electrical'), value: 'electrician' },
  { label: t('services.painting'), value: 'painter' },
  { label: t('services.kitchenUtilities'), value: 'kitchen_fitter' },
  { label: t('services.draperySeamstress'), value: 'drapery_seamstress' },
])

const isTechnician = computed(() => userRole.value === 'fixer')
const emailVerified = computed(() => Boolean(currentAuthUser.value?.email_confirmed_at))
const isVerifiedAccount = computed(() =>
  isTechnician.value ? technicianIsVerified.value : emailVerified.value,
)
const technicianVerificationLabel = computed(() => {
  if (technicianVerificationStatus.value === 'approved' || technicianIsVerified.value)
    return t('common.verified')
  if (technicianVerificationStatus.value === 'rejected') return t('common.rejected')
  return t('common.pending')
})

const memberSinceLabel = computed(() => {
  if (!memberSince.value) return 'recently'
  const d = new Date(memberSince.value)
  if (Number.isNaN(d.getTime())) return 'recently'
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
})

const serviceChips = computed(() => {
  if (!form.value.specialty) return []
  return [
    String(form.value.specialty)
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()),
  ]
})

const statItems = computed(() => {
  if (isTechnician.value) {
    return [
      { label: t('userProfile.offersSent'), value: offersSent.value },
      { label: t('userProfile.acceptedJobs'), value: acceptedJobs.value },
      { label: t('userProfile.jobsCompleted'), value: jobsCompleted.value },
      { label: t('userProfile.responseRate'), value: responseRate.value },
    ]
  }

  return [
    { label: t('userProfile.requestsPostedStat'), value: requestsPosted.value },
    { label: t('userProfile.activeRequestsStat'), value: activeRequests.value },
    { label: t('userProfile.completedRequestsStat'), value: completedRequests.value },
  ]
})

const completionPercent = computed(() => {
  const checks = [
    Boolean(form.value.full_name),
    Boolean(profileEmail.value),
    Boolean(form.value.phone_number),
  ]

  if (isTechnician.value) {
    checks.push(Boolean(form.value.specialty))
    checks.push(form.value.years_of_experience !== null && form.value.years_of_experience !== '')
    checks.push(technicianIsVerified.value)
  }

  const completed = checks.filter(Boolean).length
  return Math.round((completed / checks.length) * 100)
})

const missingItems = computed(() => {
  const items = []
  if (!form.value.phone_number) items.push(t('userProfile.addPhoneNumber'))
  if (isTechnician.value && !form.value.specialty) items.push(t('userProfile.addSpecialty'))
  if (isTechnician.value && !technicianIsVerified.value)
    items.push(t('userProfile.completeTechVerification'))
  return items.slice(0, 3)
})

const currentAuthUser = ref(null)

const setInitialForm = (row) => {
  const next = {
    full_name: row?.full_name || '',
    phone_number: row?.phone_number || '',
    specialty: row?.specialty || '',
    years_of_experience:
      row?.years_of_experience !== undefined && row?.years_of_experience !== null
        ? Number(row.years_of_experience)
        : null,
  }
  form.value = { ...next }
  initialForm.value = { ...next }
}

const loadCustomerProfile = async (email, metadata) => {
  const { data } = await supabase.from('users').select('*').ilike('email', email).maybeSingle()

  customerId.value = data?.user_id ?? null
  profileName.value = data?.full_name || metadata?.full_name || ''
  profileEmail.value = data?.email || email || ''
  memberSince.value = data?.date_created || data?.created_at || null
  setInitialForm(data || metadata || {})
}

const loadTechnicianProfile = async (email, metadata) => {
  const { data, error } = await supabase
    .from('technician')
    .select('*')
    .ilike('email', email)
    .maybeSingle()

  if (error) {
    console.error('[Profile] Failed to load technician profile:', error)
  }

  technicianId.value = data?.technician_id ?? null
  profileName.value = data?.full_name || metadata?.full_name || ''
  profileEmail.value = data?.email || email || ''
  memberSince.value = data?.date_created || data?.created_at || null
  setInitialForm(data || metadata || {})
}

const loadVerificationState = async () => {
  if (!technicianId.value) return
  const { data } = await supabase
    .from('technician_verification_state')
    .select('is_verified, verification_status')
    .eq('technician_id', technicianId.value)
    .maybeSingle()

  technicianIsVerified.value = data?.is_verified === true
  technicianVerificationStatus.value = data?.verification_status || 'pending'
}

const formatActivityTime = (value) => {
  if (!value) return 'Just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`
  return `${Math.floor(diffMin / 1440)}d ago`
}

const loadRating = async () => {
  try {
    if (isTechnician.value && technicianId.value) {
      const { data } = await supabase
        .from('rating')
        .select('customer_rating')
        .eq('technician_id', technicianId.value)
        .not('customer_rating', 'is', null)
      const rows = data || []
      totalRatings.value = rows.length
      averageRating.value = rows.length
        ? Math.round((rows.reduce((sum, r) => sum + r.customer_rating, 0) / rows.length) * 10) / 10
        : 0
    } else if (!isTechnician.value && customerId.value) {
      const { data } = await supabase
        .from('rating')
        .select('technician_rating')
        .eq('user_id', customerId.value)
        .not('technician_rating', 'is', null)
      const rows = data || []
      totalRatings.value = rows.length
      averageRating.value = rows.length
        ? Math.round((rows.reduce((sum, r) => sum + r.technician_rating, 0) / rows.length) * 10) /
          10
        : 0
    }
  } catch (err) {
    console.error('Failed to load rating:', err)
  }
}

const loadCustomerStats = async () => {
  if (!customerId.value) return

  const { data: requests } = await supabase
    .from('request')
    .select('*')
    .eq('user_id', customerId.value)
    .order('request_id', { ascending: false })
    .limit(8)

  const rows = requests || []
  requestsPosted.value = rows.length
  activeRequests.value = rows.filter((r) => {
    const status = String(r.request_status || '').toLowerCase()
    return status !== 'completed' && status !== 'cancelled'
  }).length
  completedRequests.value = rows.filter(
    (r) => String(r.request_status || '').toLowerCase() === 'completed',
  ).length

  recentActivity.value = rows.slice(0, 5).map((r) => ({
    id: `req-${r.request_id}`,
    title: `Request #${r.request_id} is ${r.request_status || 'pending'}`,
    time: formatActivityTime(r.created_at),
  }))
}

const loadTechnicianStats = async () => {
  if (!technicianId.value) {
    console.warn('[Stats] technicianId is null, skipping stats')
    return
  }
  console.log('[Stats] Loading stats for technicianId:', technicianId.value)

  // Fetch offers sent by this technician
  const { data: offersData, error: offersErr } = await supabase
    .from('request_offers')
    .select('*')
    .eq('technician_id', technicianId.value)
    .order('offer_id', { ascending: false })

  console.log('[Stats] Offers query result:', { offersData, offersErr })

  const allOffers = offersData || []
  offersSent.value = allOffers.length

  // Fetch ALL requests assigned to this technician (no status filter)
  const { data: jobs, error: jobsErr } = await supabase
    .from('request')
    .select('*')
    .eq('technician_id', technicianId.value)
    .order('request_id', { ascending: false })

  console.log('[Stats] Jobs query result:', { jobs, jobsErr })

  const rows = jobs || []
  const statusCounts = { accepted: 0, 'on-going': 0, completed: 0 }
  for (const r of rows) {
    const s = String(r.request_status || '').toLowerCase()
    if (s in statusCounts) statusCounts[s]++
  }
  acceptedJobs.value = statusCounts.accepted + statusCounts['on-going']
  jobsCompleted.value = statusCounts.completed
  responseRate.value = allOffers.length
    ? `${Math.round(((acceptedJobs.value + jobsCompleted.value) / allOffers.length) * 100)}%`
    : '--'

  // Merge recent activity from both offers and jobs
  const getTs = (row) => {
    const d = row.created_at || row.date_created || row.updated_at || row.request_date
    return d ? new Date(d).getTime() : 0
  }
  const activityItems = []
  for (const o of allOffers.slice(0, 5)) {
    activityItems.push({
      id: `offer-${o.offer_id}`,
      title: `Offer on Request #${o.request_id} — ${o.status || 'pending'}`,
      time: formatActivityTime(o.created_at || o.updated_at),
      ts: getTs(o),
    })
  }
  for (const r of rows.slice(0, 5)) {
    activityItems.push({
      id: `job-${r.request_id}`,
      title: `Job #${r.request_id} status: ${r.request_status || 'pending'}`,
      time: formatActivityTime(r.created_at || r.date_created || r.request_date),
      ts: getTs(r),
    })
  }
  activityItems.sort((a, b) => b.ts - a.ts)
  recentActivity.value = activityItems.slice(0, 5)
}

const loadProfile = async () => {
  loading.value = true
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/signin')
      return
    }

    currentAuthUser.value = user
    const email = user.email || ''
    const metadata = user.user_metadata || {}

    if (metadata.role === 'fixer') {
      userRole.value = 'fixer'
      await loadTechnicianProfile(email, metadata)
      await Promise.all([loadVerificationState(), loadTechnicianStats(), loadRating()])
    } else {
      userRole.value = 'customer'
      await loadCustomerProfile(email, metadata)
      await Promise.all([loadCustomerStats(), loadRating()])
    }
  } catch (error) {
    console.error('Failed to load profile:', error)
    $q.notify({ type: 'negative', message: t('userProfile.failedLoadProfile') })
  } finally {
    loading.value = false
  }
}

const toggleEditing = () => {
  if (editing.value) {
    discardChanges()
    return
  }
  editing.value = true
}

const discardChanges = () => {
  form.value = { ...initialForm.value }
  editing.value = false
}

const saveProfile = async () => {
  saving.value = true
  try {
    const targetTable = isTechnician.value ? 'technician' : 'users'
    const idColumn = isTechnician.value ? 'technician_id' : 'user_id'
    const idValue = isTechnician.value ? technicianId.value : customerId.value

    if (!idValue) throw new Error('Missing profile id.')

    const payload = {
      full_name: form.value.full_name,
      phone_number: form.value.phone_number,
    }

    if (isTechnician.value) {
      payload.specialty = form.value.specialty || null
      payload.years_of_experience =
        form.value.years_of_experience === null || form.value.years_of_experience === ''
          ? null
          : Number(form.value.years_of_experience)
    }

    const { error } = await supabase.from(targetTable).update(payload).eq(idColumn, idValue)
    if (error) throw error

    initialForm.value = { ...form.value }
    profileName.value = form.value.full_name
    editing.value = false
    $q.notify({ type: 'positive', message: t('userProfile.profileUpdated'), position: 'top-right' })
  } catch (error) {
    console.error('Failed to save profile:', error)
    $q.notify({ type: 'negative', message: error?.message || t('userProfile.profileFailed') })
  } finally {
    saving.value = false
  }
}

const openFilePicker = () => fileInputRef.value?.click()

const onFileChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = URL.createObjectURL(file)
  avatarUrl.value = objectUrl
}

const openComplaintDialog = async () => {
  complaintForm.value = { request_id: null, customer_id: null, issue_type: null, description: '' }
  userRequestOptions.value = []
  customerOptions.value = []
  technicianRequestOptions.value = []
  requestCustomerMap.value = {}
  requestTechnicianMap.value = {}
  showComplaintDialog.value = true

  try {
    if (isTechnician.value) {
      if (!technicianId.value) return

      // Fetch requests assigned to this technician with customer info
      const { data, error } = await supabase
        .from('request')
        .select(
          'request_id, user_id, description_of_issue, request_status, users:user_id(full_name, email)',
        )
        .eq('technician_id', technicianId.value)
        .or(
          'request_status.eq.accepted,request_status.eq.Accepted,request_status.eq.on-going,request_status.eq.On-going,request_status.eq.completed,request_status.eq.Completed',
        )
        .order('request_id', { ascending: false })

      if (error) {
        console.error('Supabase complaint requests error:', error)
        $q.notify({ type: 'warning', message: 'Could not load requests.' })
        return
      }

      const map = {}
      technicianRequestOptions.value = (data || []).map((r) => {
        map[r.request_id] = r.user_id
        const customerName = r.users?.full_name || r.users?.email || `Customer #${r.user_id}`
        return {
          label: `#${r.request_id} — ${customerName} — ${r.description_of_issue || r.request_status || 'Request'}`,
          value: r.request_id,
        }
      })
      requestCustomerMap.value = map
    } else {
      let idVal = customerId.value

      if (!idVal && profileEmail.value) {
        const { data: u } = await supabase
          .from('users')
          .select('user_id')
          .ilike('email', profileEmail.value)
          .maybeSingle()
        if (u?.user_id) {
          customerId.value = u.user_id
          idVal = u.user_id
        }
      }

      if (!idVal) return

      const { data, error } = await supabase
        .from('request')
        .select(
          'request_id, description_of_issue, request_status, technician_id, technician:technician_id(full_name)',
        )
        .eq('user_id', idVal)
        .not('technician_id', 'is', null)
        .order('request_id', { ascending: false })

      if (error) {
        console.error('Supabase complaint requests error:', error)
        $q.notify({ type: 'warning', message: 'Could not load requests.' })
        return
      }

      const tMap = {}
      userRequestOptions.value = (data || []).map((r) => {
        tMap[r.request_id] = r.technician_id
        const techName = r.technician?.full_name || `Technician #${r.technician_id}`
        return {
          label: `#${r.request_id} — ${techName} — ${r.description_of_issue || r.request_status || 'Request'}`,
          value: r.request_id,
        }
      })
      requestTechnicianMap.value = tMap
    }
  } catch (err) {
    console.error('Failed to load complaint options:', err)
    $q.notify({ type: 'warning', message: 'Could not load options.' })
  }
}

const submitComplaint = async () => {
  submittingComplaint.value = true
  try {
    // Get next complaint_id since column has no auto-increment
    const { data: maxRow } = await supabase
      .from('complaint')
      .select('complaint_id')
      .order('complaint_id', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextId = (maxRow?.complaint_id || 0) + 1

    const payload = {
      complaint_id: nextId,
      issue_type: complaintForm.value.issue_type,
      description: complaintForm.value.description,
      request_id: complaintForm.value.request_id,
      status: 'Unsolved',
      complainant_role: isTechnician.value ? 'technician' : 'customer',
      user_auth_id: currentAuthUser.value?.id || null,
      user_id: isTechnician.value
        ? requestCustomerMap.value[complaintForm.value.request_id] || null
        : customerId.value,
      technician_id: isTechnician.value
        ? technicianId.value
        : requestTechnicianMap.value[complaintForm.value.request_id] || null,
      complained_against_id: isTechnician.value
        ? requestCustomerMap.value[complaintForm.value.request_id] || null
        : requestTechnicianMap.value[complaintForm.value.request_id] || null,
    }

    const { error } = await supabase.from('complaint').insert(payload)
    if (error) throw error

    showComplaintDialog.value = false
    $q.notify({
      type: 'positive',
      message: t('userProfile.complaintSubmitted'),
      position: 'top-right',
    })
  } catch (err) {
    console.error('Failed to submit complaint:', err)
    $q.notify({
      type: 'negative',
      message: err?.message || t('userProfile.complaintFailed'),
    })
  } finally {
    submittingComplaint.value = false
  }
}

const goToPage = (route) => {
  if (route) router.push(route)
}

const logout = async () => {
  try {
    await supabase.auth.signOut()
    $q.dark.set(false)
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error)
    $q.notify({ type: 'negative', message: t('userProfile.logoutFailed') })
  }
}

onMounted(loadProfile)

onBeforeUnmount(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
})

watch(darkMode, (val) => {
  document.body.classList.add('dark-transition')
  $q.dark.set(val)
  setTimeout(() => document.body.classList.remove('dark-transition'), 500)
})

watch(language, (val) => {
  locale.value = val
  localStorage.setItem('san3a-locale', val)
  document.documentElement.dir = val === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = val === 'en-US' ? 'en' : val
})
</script>

<style scoped>
.app-header-teal {
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover)) !important;
}

.app-toolbar {
  max-width: 1200px;
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
}

.header-brand-name-w {
  color: #fff;
  font-size: 22px;
  font-weight: 800;
}

.header-logout-btn {
  color: #fff !important;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  padding: 4px 12px;
}

.profile-page {
  min-height: calc(100vh - 56px);
  padding: 24px 16px 92px;
  background: linear-gradient(160deg, var(--san3a-bg), #f0f5f5);
}

.profile-wrap {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.state-center {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.profile-hero {
  background: #fff;
  border: 1px solid var(--san3a-gray-200);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-btn {
  padding: 0;
  min-height: unset;
  position: relative;
  border-radius: 50% !important;
}

.profile-avatar {
  background: var(--san3a-gray-100);
  border: 4px solid #fff;
  box-shadow: var(--san3a-shadow-lg);
}

.avatar-overlay {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--san3a-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--san3a-shadow-sm);
}

.hero-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-name {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  color: var(--san3a-gray-900);
  font-weight: 800;
}

.hero-subline {
  margin-top: 4px;
  color: var(--san3a-gray-600);
  font-size: 14px;
}

.hero-meta {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--san3a-gray-500);
  font-size: 13px;
}

.hero-rating {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rating-text {
  font-size: 16px;
  font-weight: 800;
  color: var(--san3a-gray-900);
}

.rating-count {
  font-size: 13px;
  color: var(--san3a-gray-500);
}

.role-badge,
.verify-badge {
  border-radius: 999px;
}

.completion-card {
  border: 1px solid #bfe4e5;
  border-radius: 14px;
  background: linear-gradient(120deg, rgba(13, 115, 119, 0.08), rgba(255, 107, 53, 0.1));
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.completion-content {
  flex: 1;
}

.completion-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--san3a-gray-900);
}

.completion-sub {
  margin-top: 2px;
  color: var(--san3a-gray-600);
  font-size: 14px;
}

.missing-list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.missing-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--san3a-gray-700);
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
}

.left-col,
.right-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-card {
  border-radius: 12px;
  border-color: var(--san3a-gray-200) !important;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.card-title {
  font-size: 19px;
  font-weight: 700;
  color: var(--san3a-gray-900);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.security-row,
.pref-row,
.verify-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
}

.security-row + .security-row,
.pref-row + .pref-row,
.verify-row + .verify-row {
  border-top: 1px solid var(--san3a-gray-100);
}

.row-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--san3a-gray-800);
}

.row-sub {
  font-size: 13px;
  color: var(--san3a-gray-500);
}

.chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.service-chip {
  border-radius: 999px;
}

.stats-list {
  display: flex;
  flex-direction: column;
}

.stats-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}

.stats-item + .stats-item {
  border-top: 1px solid var(--san3a-gray-100);
}

.stats-label {
  font-size: 14px;
  color: var(--san3a-gray-600);
}

.stats-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--san3a-gray-900);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  border: 1px solid var(--san3a-gray-200);
  border-radius: 10px;
  padding: 10px;
}

.activity-main {
  font-size: 14px;
  color: var(--san3a-gray-800);
}

.activity-time {
  margin-top: 2px;
  font-size: 12px;
  color: var(--san3a-gray-500);
}

.sticky-save {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 16px 10px;
  margin-top: 4px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--san3a-gray-200);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
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
}

.nav-tabs :deep(.q-tab--active) {
  opacity: 1;
}

.nav-tabs :deep(.q-tab__icon) {
  font-size: 24px;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 1024px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .profile-page {
    padding: 16px 12px 92px;
  }

  .profile-hero {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-name {
    font-size: 24px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
