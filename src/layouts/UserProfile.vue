<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="app-header-teal">
      <q-toolbar class="app-toolbar">
        <div class="header-brand">
          <div class="header-brand-icon-w">
            <img src="/icons/White.png" alt="Sanعa logo" class="brand-logo-mark" />
          </div>
          <span class="header-brand-name-w">Profile</span>
        </div>
        <q-space />
        <q-btn
          flat
          no-caps
          icon="logout"
          label="Log Out"
          class="header-logout-btn"
          @click="logout"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="profile-page">
        <div v-if="loading" class="state-center">
          <q-spinner-dots size="48px" color="primary" />
          <div class="text-grey-7 q-mt-sm">Loading profile...</div>
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
                  <h1 class="hero-name">{{ profileName || 'Unknown User' }}</h1>
                  <q-badge
                    :color="isTechnician ? 'primary' : 'secondary'"
                    text-color="white"
                    class="role-badge"
                  >
                    {{ isTechnician ? 'Technician' : 'Customer' }}
                  </q-badge>
                  <q-badge
                    v-if="isVerifiedAccount"
                    color="positive"
                    text-color="white"
                    class="verify-badge"
                  >
                    <q-icon name="verified" size="12px" class="q-mr-xs" /> Verified
                  </q-badge>
                </div>
                <div class="hero-subline">{{ profileEmail || 'No email found' }}</div>
                <div class="hero-meta">
                  <span>{{ roleCity }}</span>
                  <span>Joined {{ memberSinceLabel }}</span>
                  <span v-if="isTechnician">{{ jobsCompleted }} completed jobs</span>
                </div>
              </div>
            </div>

            <div class="hero-right">
              <q-btn
                unelevated
                no-caps
                color="primary"
                icon="edit"
                :label="editing ? 'Cancel Editing' : 'Edit Profile'"
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
              <div class="completion-title">Complete your profile</div>
              <div class="completion-sub">A complete profile improves trust and visibility.</div>
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
                    <div class="card-title">Personal Information</div>
                    <q-icon name="person" color="grey-6" />
                  </div>

                  <div class="form-grid">
                    <q-input
                      v-model="form.full_name"
                      label="Full Name"
                      outlined
                      dense
                      :readonly="!editing"
                    />
                    <q-input
                      v-model="form.phone_number"
                      label="Phone Number"
                      outlined
                      dense
                      :readonly="!editing"
                    />
                    <q-input :model-value="profileEmail" label="Email" outlined dense readonly>
                      <template #append>
                        <q-icon v-if="emailVerified" name="check_circle" color="positive" />
                      </template>
                    </q-input>
                    <q-input
                      v-if="isTechnician"
                      v-model="form.specialty"
                      label="Specialty"
                      outlined
                      dense
                      :readonly="!editing"
                    />
                    <q-input
                      v-if="isTechnician"
                      v-model.number="form.years_of_experience"
                      type="number"
                      min="0"
                      label="Years of Experience"
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
                    <div class="card-title">Security</div>
                    <q-icon name="security" color="grey-6" />
                  </div>

                  <div class="security-row">
                    <div>
                      <div class="row-title">Password</div>
                      <div class="row-sub">Manage your account password securely.</div>
                    </div>
                    <q-btn
                      flat
                      color="primary"
                      no-caps
                      label="Change"
                      @click="goToPage('/reset-password')"
                    />
                  </div>

                  <div class="security-row">
                    <div>
                      <div class="row-title">Two-factor Authentication</div>
                      <div class="row-sub">Add an extra protection layer to your account.</div>
                    </div>
                    <q-toggle v-model="twoFactorEnabled" color="primary" disable />
                  </div>
                </q-card-section>
              </q-card>

              <q-card flat bordered class="profile-card">
                <q-card-section>
                  <div class="card-head">
                    <div class="card-title">Preferences</div>
                    <q-icon name="settings" color="grey-6" />
                  </div>

                  <div class="pref-row">
                    <q-icon name="language" color="grey-6" />
                    <span>Language</span>
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
                    <span>Dark Mode</span>
                    <q-space />
                    <q-toggle v-model="darkMode" color="primary" />
                  </div>
                </q-card-section>
              </q-card>

              <q-card v-if="isTechnician" flat bordered class="profile-card">
                <q-card-section>
                  <div class="card-head">
                    <div class="card-title">Services and Expertise</div>
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
                      No services added yet.
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="right-col">
              <q-card flat bordered class="profile-card">
                <q-card-section>
                  <div class="card-head">
                    <div class="card-title">Account Stats</div>
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
                    <div class="card-title">Verification Status</div>
                    <q-icon name="verified_user" color="grey-6" />
                  </div>

                  <div class="verify-row">
                    <span>Email Verified</span>
                    <q-badge :color="emailVerified ? 'positive' : 'warning'" text-color="white">
                      {{ emailVerified ? 'Verified' : 'Pending' }}
                    </q-badge>
                  </div>
                  <div v-if="isTechnician" class="verify-row">
                    <span>Technician Verification</span>
                    <q-badge :color="isVerifiedAccount ? 'positive' : 'warning'" text-color="white">
                      {{ technicianVerificationLabel }}
                    </q-badge>
                  </div>
                </q-card-section>
              </q-card>

              <q-card flat bordered class="profile-card">
                <q-card-section>
                  <div class="card-head">
                    <div class="card-title">Recent Activity</div>
                    <q-icon name="history" color="grey-6" />
                  </div>

                  <div v-if="recentActivity.length === 0" class="row-sub">
                    No recent activity yet.
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
                    label="File a Complaint"
                    class="full-width q-mt-md"
                    @click="openComplaintDialog"
                  />
                </q-card-section>
              </q-card>
            </div>
          </section>

          <!-- Complaint Dialog -->
          <q-dialog v-model="showComplaintDialog" persistent>
            <q-card style="min-width: 420px; max-width: 520px">
              <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">File a Complaint</div>
                <q-space />
                <q-btn icon="close" flat round dense @click="showComplaintDialog = false" />
              </q-card-section>

              <q-card-section>
                <q-form @submit.prevent="submitComplaint" class="q-gutter-md">
                  <q-select
                    v-if="isTechnician"
                    v-model="complaintForm.customer_id"
                    :options="customerOptions"
                    outlined
                    dense
                    label="Select Customer"
                    emit-value
                    map-options
                    :rules="[(val) => !!val || 'Please select a customer']"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey"> No customers found </q-item-section>
                      </q-item>
                    </template>
                  </q-select>

                  <q-select
                    v-else
                    v-model="complaintForm.request_id"
                    :options="userRequestOptions"
                    outlined
                    dense
                    label="Select Request"
                    emit-value
                    map-options
                    :rules="[(val) => !!val || 'Please select a request']"
                  >
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey"> No requests found </q-item-section>
                      </q-item>
                    </template>
                  </q-select>

                  <q-select
                    v-model="complaintForm.issue_type"
                    :options="activeIssueTypeOptions"
                    outlined
                    dense
                    label="Issue Type"
                    :rules="[(val) => !!val || 'Please select an issue type']"
                  />

                  <q-input
                    v-model="complaintForm.description"
                    label="Description"
                    outlined
                    type="textarea"
                    rows="4"
                    :rules="[
                      (val) => (!!val && val.trim().length > 0) || 'Please describe the issue',
                    ]"
                  />

                  <q-btn
                    type="submit"
                    unelevated
                    no-caps
                    color="negative"
                    label="Submit Complaint"
                    class="full-width"
                    :loading="submittingComplaint"
                  />
                </q-form>
              </q-card-section>
            </q-card>
          </q-dialog>

          <transition name="slide-up">
            <div v-if="editing" class="sticky-save">
              <q-btn flat no-caps label="Discard" color="grey-7" @click="discardChanges" />
              <q-btn
                unelevated
                no-caps
                color="primary"
                label="Save Changes"
                :loading="saving"
                @click="saveProfile"
              />
            </div>
          </transition>
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
            label="Requests"
            @click="goToPage('/service-provider')"
          />
          <q-tab
            name="orders"
            icon="receipt_long"
            label="Orders"
            @click="goToPage({ path: '/service-provider', query: { tab: 'orders' } })"
          />
          <q-tab name="profile" icon="person" label="Profile" @click="goToPage('/profile')" />
        </template>
        <template v-else>
          <q-tab name="home" icon="home" label="Home" @click="goToPage('/home')" />
          <q-tab
            name="offers"
            icon="handshake"
            label="Requests"
            @click="goToPage('/incoming-offers')"
          />
          <q-tab name="orders" icon="receipt_long" label="Orders" @click="goToPage('/orders')" />
          <q-tab name="profile" icon="person" label="Profile" @click="goToPage('/profile')" />
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

const router = useRouter()
const $q = useQuasar()

const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const activeTab = ref('profile')
const darkMode = ref($q.dark.isActive)
const language = ref('en')
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

const customerIssueTypeOptions = [
  'Service Quality',
  'Late Arrival',
  'Overcharging',
  'Unprofessional Behavior',
  'Incomplete Work',
  'Damage to Property',
  'No Show',
  'Communication Issue',
  'Other',
]

const technicianIssueTypeOptions = [
  'Customer No Show',
  'Incorrect Job Description',
  'Unsafe Work Environment',
  'Payment Dispute',
  'Harassment or Abuse',
  'Unreachable Customer',
  'Cancelled After Arrival',
  'Scope Change Without Notice',
  'Other',
]

const activeIssueTypeOptions = computed(() =>
  isTechnician.value ? technicianIssueTypeOptions : customerIssueTypeOptions,
)

const customerOptions = ref([])

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
  { label: 'English', value: 'en' },
  { label: 'Arabic', value: 'ar' },
]

const isTechnician = computed(() => userRole.value === 'fixer')
const emailVerified = computed(() => Boolean(currentAuthUser.value?.email_confirmed_at))
const isVerifiedAccount = computed(() =>
  isTechnician.value ? technicianIsVerified.value : emailVerified.value,
)
const technicianVerificationLabel = computed(() => {
  if (technicianVerificationStatus.value === 'approved' || technicianIsVerified.value)
    return 'Verified'
  if (technicianVerificationStatus.value === 'rejected') return 'Rejected'
  return 'Pending'
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
      { label: 'Offers Sent', value: offersSent.value },
      { label: 'Accepted Jobs', value: acceptedJobs.value },
      { label: 'Jobs Completed', value: jobsCompleted.value },
      { label: 'Response Rate', value: responseRate.value },
    ]
  }

  return [
    { label: 'Requests Posted', value: requestsPosted.value },
    { label: 'Active Requests', value: activeRequests.value },
    { label: 'Completed Requests', value: completedRequests.value },
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
  if (!form.value.phone_number) items.push('Add phone number')
  if (isTechnician.value && !form.value.specialty) items.push('Add your specialty')
  if (isTechnician.value && !technicianIsVerified.value)
    items.push('Complete technician verification')
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
      await Promise.all([loadVerificationState(), loadTechnicianStats()])
    } else {
      userRole.value = 'customer'
      await loadCustomerProfile(email, metadata)
      await loadCustomerStats()
    }
  } catch (error) {
    console.error('Failed to load profile:', error)
    $q.notify({ type: 'negative', message: 'Failed to load profile data.' })
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
    $q.notify({ type: 'positive', message: 'Profile updated successfully.', position: 'top-right' })
  } catch (error) {
    console.error('Failed to save profile:', error)
    $q.notify({ type: 'negative', message: error?.message || 'Failed to save profile.' })
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
  showComplaintDialog.value = true

  try {
    if (isTechnician.value) {
      if (!technicianId.value) return

      // Same pattern as fetchAcceptedOrders in ServiceProvider
      const { data, error } = await supabase
        .from('request')
        .select('request_id, user_id, users:user_id(full_name, email)')
        .eq('technician_id', technicianId.value)
        .or(
          'request_status.eq.accepted,request_status.eq.Accepted,request_status.eq.on-going,request_status.eq.On-going,request_status.eq.completed,request_status.eq.Completed',
        )
        .order('request_id', { ascending: false })

      if (error) {
        console.error('Supabase complaint customers error:', error)
        $q.notify({ type: 'warning', message: 'Could not load customers.' })
        return
      }

      const seen = new Set()
      customerOptions.value = (data || [])
        .filter((r) => {
          if (!r.user_id || seen.has(r.user_id)) return false
          seen.add(r.user_id)
          return true
        })
        .map((r) => ({
          label: r.users?.full_name || r.users?.email || `Customer #${r.user_id}`,
          value: r.user_id,
        }))
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
        .select('request_id, description_of_issue, request_status')
        .eq('user_id', idVal)
        .order('request_id', { ascending: false })

      if (error) {
        console.error('Supabase complaint requests error:', error)
        $q.notify({ type: 'warning', message: 'Could not load requests.' })
        return
      }

      userRequestOptions.value = (data || []).map((r) => ({
        label: `#${r.request_id} — ${r.description_of_issue || r.request_status || 'Request'}`,
        value: r.request_id,
      }))
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
      request_id: isTechnician.value ? null : complaintForm.value.request_id,
      status: 'Unsolved',
      complainant_role: isTechnician.value ? 'technician' : 'customer',
      user_auth_id: currentAuthUser.value?.id || null,
      user_id: isTechnician.value ? null : customerId.value,
      complained_against_id: isTechnician.value ? complaintForm.value.customer_id : null,
    }

    const { error } = await supabase.from('complaint').insert(payload)
    if (error) throw error

    showComplaintDialog.value = false
    $q.notify({
      type: 'positive',
      message: 'Complaint submitted successfully.',
      position: 'top-right',
    })
  } catch (err) {
    console.error('Failed to submit complaint:', err)
    $q.notify({
      type: 'negative',
      message: err?.message || 'Failed to submit complaint.',
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
    $q.notify({ type: 'negative', message: 'Failed to log out. Please try again.' })
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
  position: fixed;
  left: 0;
  right: 0;
  bottom: 60px;
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--san3a-gray-200);
  box-shadow: 0 -8px 16px rgba(0, 0, 0, 0.08);
  z-index: 30;
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
