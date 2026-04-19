<template>
  <div class="analytics-view">
    <div class="row items-center justify-between q-mb-md header-row">
      <div>
        <div class="text-h5 text-weight-bold">{{ $t('admin.analyticsOverview') }}</div>
        <div class="text-grey-7">{{ $t('admin.analyticsSubtitle') }}</div>
      </div>
      <q-btn
        color="primary"
        icon="refresh"
        :label="$t('admin.refresh')"
        :loading="loading"
        @click="loadAnalytics"
      />
    </div>

    <div class="kpi-grid q-mb-md">
      <q-card
        v-for="item in kpiCards"
        :key="item.label"
        flat
        bordered
        class="kpi-card"
        clickable
        role="button"
        tabindex="0"
        @click="openSection(item.sectionKey)"
        @keyup.enter="openSection(item.sectionKey)"
      >
        <q-card-section>
          <div class="kpi-head">
            <div class="kpi-icon-wrap" :class="`kpi-icon-wrap--${item.tone}`">
              <q-icon :name="item.icon" size="20px" />
            </div>
            <div>
              <div class="kpi-label">{{ item.label }}</div>
              <div class="kpi-subtitle">{{ item.subtitle }}</div>
            </div>
          </div>
          <div class="kpi-number">{{ formatNumber(item.value) }}</div>
        </q-card-section>
      </q-card>
    </div>

    <div class="operations-grid q-mb-md">
      <q-card flat bordered class="ops-card">
        <q-card-section>
          <div class="ops-head">
            <div>
              <div class="text-subtitle1 text-weight-bold">{{ $t('admin.actionCenter') }}</div>
              <div class="text-caption text-grey-7">{{ $t('admin.actionCenterSub') }}</div>
            </div>
            <q-badge color="warning" text-color="white"
              >{{ actionItems.length }} {{ $t('admin.alerts') }}</q-badge
            >
          </div>

          <div class="action-list" v-if="actionItems.length">
            <button
              v-for="item in actionItems"
              :key="item.label"
              class="action-item"
              type="button"
              @click="openSection(item.sectionKey)"
            >
              <div class="action-item-icon" :class="`action-item-icon--${item.tone}`">
                <q-icon :name="item.icon" size="17px" />
              </div>
              <div class="action-item-copy">
                <div class="action-item-title">{{ item.label }}</div>
                <div class="action-item-sub">{{ item.sub }}</div>
              </div>
              <q-icon name="arrow_forward" size="16px" color="grey-6" />
            </button>
          </div>

          <div v-else class="text-caption text-grey-7">{{ $t('admin.noHighPriority') }}</div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="ops-card">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold">{{ $t('admin.platformHealth') }}</div>
          <div class="text-caption text-grey-7 q-mb-sm">{{ $t('admin.platformHealthSub') }}</div>

          <div class="health-grid">
            <div class="health-item">
              <div class="health-label">{{ $t('admin.approvalRate') }}</div>
              <div class="health-value">{{ approvalRate }}%</div>
            </div>
            <div class="health-item">
              <div class="health-label">{{ $t('admin.totalReviewedProfiles') }}</div>
              <div class="health-value">{{ formatNumber(totalReviewedProfiles) }}</div>
            </div>
            <div class="health-item">
              <div class="health-label">{{ $t('admin.openOperationalLoad') }}</div>
              <div class="health-value">
                {{ formatNumber(activeRequestsCount + complaintsCount) }}
              </div>
            </div>
            <div class="health-item">
              <div class="health-label">{{ $t('admin.backlogRatio') }}</div>
              <div class="health-value">{{ backlogRatio }}%</div>
            </div>
          </div>

          <div class="q-mt-md">
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-caption text-grey-7">{{ $t('admin.verificationCompletion') }}</span>
              <span class="text-caption text-weight-bold">{{ approvalRate }}%</span>
            </div>
            <q-linear-progress
              rounded
              size="10px"
              :value="approvalRate / 100"
              color="positive"
              track-color="grey-3"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="charts-grid">
      <q-card flat bordered class="chart-card">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">
            {{ $t('admin.verificationPipeline') }}
          </div>
          <div class="text-caption text-grey-7 q-mb-md">
            {{ $t('admin.verificationPipelineSub') }}
          </div>

          <div v-for="row in verificationBreakdown" :key="row.label" class="bar-row">
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-body2 text-weight-medium">{{ row.label }}</span>
              <span class="text-body2">{{ formatNumber(row.value) }}</span>
            </div>
            <q-linear-progress
              rounded
              size="12px"
              :value="row.ratio"
              :color="row.color"
              track-color="grey-3"
            />
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="chart-card">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">{{ $t('admin.requestsByStatus') }}</div>
          <div class="text-caption text-grey-7 q-mb-md">{{ $t('admin.requestsByStatusSub') }}</div>

          <div v-if="requestStatusBars.length === 0" class="text-grey-7">
            {{ $t('admin.noRequestData') }}
          </div>

          <div v-for="bar in requestStatusBars" :key="bar.label" class="bar-row">
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-body2 text-weight-medium">{{ bar.label }}</span>
              <span class="text-body2">{{ formatNumber(bar.value) }}</span>
            </div>
            <q-linear-progress
              rounded
              size="12px"
              :value="bar.ratio"
              :color="bar.color"
              track-color="grey-3"
            />
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="chart-card">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">{{ $t('admin.serviceCategoryMix') }}</div>
          <div class="text-caption text-grey-7 q-mb-md">
            {{ $t('admin.serviceCategoryMixSub') }}
          </div>

          <div v-if="serviceMix.length === 0" class="text-grey-7">
            {{ $t('admin.noCategoryData') }}
          </div>

          <div v-else class="service-mix-wrap">
            <div class="donut-wrap">
              <div class="service-donut" :style="serviceDonutStyle"></div>
              <div class="donut-center">
                <div class="donut-total">{{ formatNumber(totalServiceRequests) }}</div>
                <div class="donut-caption">Requests</div>
              </div>
            </div>

            <div class="service-legend">
              <div v-for="item in serviceMix" :key="item.label" class="service-legend-row">
                <span class="service-dot" :style="{ backgroundColor: item.color }"></span>
                <span class="service-name">{{ item.label }}</span>
                <span class="service-value"
                  >{{ formatNumber(item.value) }} ({{ item.percent }}%)</span
                >
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="chart-card chart-card--wide">
        <q-card-section>
          <div class="trend-head q-mb-md">
            <div>
              <div class="text-subtitle1 text-weight-medium">{{ $t('admin.activityTrends') }}</div>
              <div class="text-caption text-grey-7">
                {{ $t('admin.activityTrendsSub') }}
              </div>
            </div>
            <q-btn-toggle
              v-model="trendWindow"
              dense
              no-caps
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              :options="[
                { label: $t('admin.days7'), value: 7 },
                { label: $t('admin.days30'), value: 30 },
              ]"
            />
          </div>

          <div v-if="activityBars.length === 0" class="text-grey-7">
            {{ $t('admin.noRecentActivityFound') }}
          </div>

          <div v-for="day in activityBars" :key="day.date" class="activity-row">
            <div class="activity-label text-caption text-grey-8">{{ day.label }}</div>
            <div class="activity-bars">
              <div class="mini-bar-wrap">
                <div
                  class="mini-bar mini-bar--request"
                  :style="{ width: `${day.requestRatio}%` }"
                ></div>
              </div>
              <div class="mini-bar-wrap q-mt-xs">
                <div
                  class="mini-bar mini-bar--complaint"
                  :style="{ width: `${day.complaintRatio}%` }"
                ></div>
              </div>
              <div class="mini-bar-wrap q-mt-xs">
                <div
                  class="mini-bar mini-bar--verification"
                  :style="{ width: `${day.verificationRatio}%` }"
                ></div>
              </div>
            </div>
            <div class="activity-values text-caption">
              R: {{ day.requests }} | C: {{ day.complaints }} | V: {{ day.verifications }}
            </div>
          </div>

          <div class="legend row items-center q-gutter-md q-mt-md">
            <div class="row items-center">
              <span class="legend-dot legend-dot--request"></span>
              <span class="text-caption q-ml-xs">{{ $t('admin.requests') }}</span>
            </div>
            <div class="row items-center">
              <span class="legend-dot legend-dot--complaint"></span>
              <span class="text-caption q-ml-xs">{{ $t('admin.complaints') }}</span>
            </div>
            <div class="row items-center">
              <span class="legend-dot legend-dot--verification"></span>
              <span class="text-caption q-ml-xs">{{ $t('admin.verifications') }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { supabase } from 'src/boot/supabase'

const emit = defineEmits(['open-section'])
const $q = useQuasar()
const { t } = useI18n()

const loading = ref(false)
const usersCount = ref(0)
const techniciansCount = ref(0)
const activeRequestsCount = ref(0)
const complaintsCount = ref(0)
const pendingVerifications = ref(0)
const approvedProfiles = ref(0)
const rejectedProfiles = ref(0)
const requestStatusMap = ref({})
const serviceCategoryMap = ref({})
const dailyActivity = ref([])
const trendWindow = ref(7)

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString()
}

const openSection = (sectionKey) => {
  if (!sectionKey) return
  emit('open-section', sectionKey)
}

const parseStatus = (row) => String(row.request_status ?? row.status ?? 'pending').toLowerCase()

const toDateKey = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

const getRowDate = (row) =>
  row.date_created ??
  row.request_date ??
  row.created_at ??
  row.updated_at ??
  row.inserted_at ??
  row.createdAt ??
  row.updatedAt ??
  null

const buildDayBuckets = (days) => {
  const buckets = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now)
    day.setDate(now.getDate() - i)
    const key = day.toISOString().slice(0, 10)
    buckets.push({ key, requests: 0, complaints: 0, verifications: 0 })
  }

  return buckets
}

const fetchTableCount = async (table, filterFn) => {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filterFn) {
    query = filterFn(query)
  }
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

const loadAnalytics = async () => {
  loading.value = true
  try {
    const [
      userTotal,
      technicianTotal,
      activeRequestTotal,
      complaintTotal,
      pendingVerificationTotal,
      approvedProfilesTotal,
      rejectedProfilesTotal,
      requestRows,
      complaintRows,
      verificationRows,
    ] = await Promise.all([
      fetchTableCount('users'),
      fetchTableCount('technician'),
      fetchTableCount('request', (q) => q.not('request_status', 'in', '(completed,cancelled)')),
      fetchTableCount('complaint'),
      fetchTableCount('profile_verification_submissions', (q) => q.eq('review_status', 'pending')),
      fetchTableCount('profile_verification_submissions', (q) => q.eq('review_status', 'approved')),
      fetchTableCount('profile_verification_submissions', (q) => q.eq('review_status', 'rejected')),
      supabase.from('request').select('*').limit(2000),
      supabase.from('complaint').select('*').limit(2000),
      supabase
        .from('profile_verification_submissions')
        .select('submitted_at, review_status')
        .limit(3000),
    ])

    usersCount.value = userTotal
    techniciansCount.value = technicianTotal
    activeRequestsCount.value = activeRequestTotal
    complaintsCount.value = complaintTotal
    pendingVerifications.value = pendingVerificationTotal
    approvedProfiles.value = approvedProfilesTotal
    rejectedProfiles.value = rejectedProfilesTotal

    if (requestRows.error) throw requestRows.error
    if (complaintRows.error) throw complaintRows.error
    if (verificationRows.error) throw verificationRows.error

    const statusCounter = {}
    for (const row of requestRows.data || []) {
      const key = parseStatus(row)
      statusCounter[key] = (statusCounter[key] || 0) + 1
    }
    requestStatusMap.value = statusCounter

    const categoryCounter = {}
    for (const row of requestRows.data || []) {
      const category =
        row.service_type || row.category || row.service_category || row.request_category || 'other'
      categoryCounter[String(category)] = (categoryCounter[String(category)] || 0) + 1
    }
    serviceCategoryMap.value = categoryCounter

    const buckets = buildDayBuckets(30)
    const bucketIndex = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket]))

    for (const row of requestRows.data || []) {
      const key = toDateKey(getRowDate(row))
      if (key && bucketIndex[key]) {
        bucketIndex[key].requests += 1
      }
    }

    for (const row of complaintRows.data || []) {
      const key = toDateKey(getRowDate(row))
      if (key && bucketIndex[key]) {
        bucketIndex[key].complaints += 1
      }
    }

    for (const row of verificationRows.data || []) {
      const key = toDateKey(row.submitted_at)
      if (key && bucketIndex[key]) {
        bucketIndex[key].verifications += 1
      }
    }

    dailyActivity.value = buckets
  } catch (error) {
    console.error('Error loading analytics:', error)
    $q.notify({
      type: 'negative',
      message: t('admin.errorLoadingAnalytics'),
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const kpiCards = computed(() => [
  {
    label: t('admin.pendingVerifications'),
    subtitle: t('admin.needsAdminReview'),
    value: pendingVerifications.value,
    icon: 'pending_actions',
    tone: 'warning',
    sectionKey: 'pending',
  },
  {
    label: t('admin.users'),
    subtitle: t('admin.registeredCustomers'),
    value: usersCount.value,
    icon: 'person',
    tone: 'primary',
    sectionKey: 'customers',
  },
  {
    label: t('admin.technicians'),
    subtitle: t('admin.registeredProviders'),
    value: techniciansCount.value,
    icon: 'engineering',
    tone: 'teal',
    sectionKey: 'technicians',
  },
  {
    label: t('admin.activeRequests'),
    subtitle: t('admin.notCompletedCancelled'),
    value: activeRequestsCount.value,
    icon: 'assignment',
    tone: 'info',
    sectionKey: 'requests',
  },
  {
    label: t('admin.complaints'),
    subtitle: t('admin.totalComplaintRecords'),
    value: complaintsCount.value,
    icon: 'flag',
    tone: 'danger',
    sectionKey: 'complaints',
  },
  {
    label: t('admin.approvedProfiles'),
    subtitle: t('admin.verificationAccepted'),
    value: approvedProfiles.value,
    icon: 'verified',
    tone: 'success',
    sectionKey: 'pending',
  },
  {
    label: t('admin.rejectedProfiles'),
    subtitle: t('admin.verificationRejected'),
    value: rejectedProfiles.value,
    icon: 'gpp_bad',
    tone: 'danger',
    sectionKey: 'pending',
  },
])

const verificationBreakdown = computed(() => {
  const values = [
    { label: 'Pending', value: pendingVerifications.value, color: 'warning' },
    { label: 'Approved', value: approvedProfiles.value, color: 'positive' },
    { label: 'Rejected', value: rejectedProfiles.value, color: 'negative' },
  ]

  const maxValue = Math.max(...values.map((item) => item.value), 1)
  return values.map((item) => ({
    ...item,
    ratio: item.value / maxValue,
  }))
})

const totalReviewedProfiles = computed(
  () => Number(approvedProfiles.value || 0) + Number(rejectedProfiles.value || 0),
)

const approvalRate = computed(() => {
  const reviewed = totalReviewedProfiles.value
  if (!reviewed) return 0
  return Math.round((Number(approvedProfiles.value || 0) / reviewed) * 100)
})

const backlogRatio = computed(() => {
  const total = Number(pendingVerifications.value || 0) + totalReviewedProfiles.value
  if (!total) return 0
  return Math.round((Number(pendingVerifications.value || 0) / total) * 100)
})

const actionItems = computed(() => {
  const items = []

  if (pendingVerifications.value > 0) {
    items.push({
      label: `${formatNumber(pendingVerifications.value)} pending verifications`,
      sub: 'Open verification queue',
      sectionKey: 'pending',
      icon: 'pending_actions',
      tone: 'warning',
    })
  }

  if (activeRequestsCount.value > 0) {
    items.push({
      label: `${formatNumber(activeRequestsCount.value)} active requests`,
      sub: 'Monitor requests in progress',
      sectionKey: 'requests',
      icon: 'assignment',
      tone: 'info',
    })
  }

  if (complaintsCount.value > 0) {
    items.push({
      label: `${formatNumber(complaintsCount.value)} complaints logged`,
      sub: 'Check unresolved complaints',
      sectionKey: 'complaints',
      icon: 'flag',
      tone: 'danger',
    })
  }

  return items.slice(0, 4)
})

const requestStatusBars = computed(() => {
  const entries = Object.entries(requestStatusMap.value || {})
  if (entries.length === 0) return []

  const palette = ['primary', 'orange', 'teal', 'purple', 'red', 'cyan', 'brown']
  const maxValue = Math.max(...entries.map(([, count]) => count), 1)

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({
      label,
      value,
      ratio: value / maxValue,
      color: palette[index % palette.length],
    }))
})

const serviceMix = computed(() => {
  const entries = Object.entries(serviceCategoryMap.value || {})
  if (entries.length === 0) return []

  const colors = ['#0d7377', '#ff6b35', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444']
  const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0)

  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], index) => ({
      label,
      value,
      color: colors[index % colors.length],
      percent: total > 0 ? Math.round((Number(value || 0) / total) * 100) : 0,
    }))
})

const totalServiceRequests = computed(() =>
  serviceMix.value.reduce((sum, item) => sum + Number(item.value || 0), 0),
)

const serviceDonutStyle = computed(() => {
  if (!serviceMix.value.length) {
    return { background: 'conic-gradient(#e5e7eb 0 360deg)' }
  }

  let accumulated = 0
  const segments = serviceMix.value
    .map((item) => {
      const start = accumulated
      const angle = (item.percent / 100) * 360
      const end = accumulated + angle
      accumulated = end
      return `${item.color} ${start}deg ${end}deg`
    })
    .join(', ')

  return { background: `conic-gradient(${segments})` }
})

const activityBars = computed(() => {
  const list = (dailyActivity.value || []).slice(-trendWindow.value)
  if (list.length === 0) return []

  const maxDaily = Math.max(
    ...list.map((item) => Math.max(item.requests, item.complaints, item.verifications || 0)),
    1,
  )

  return list.map((item) => {
    const date = new Date(item.key)
    return {
      date: item.key,
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      requests: item.requests,
      complaints: item.complaints,
      verifications: item.verifications || 0,
      requestRatio: (item.requests / maxDaily) * 100,
      complaintRatio: (item.complaints / maxDaily) * 100,
      verificationRatio: ((item.verifications || 0) / maxDaily) * 100,
    }
  })
})

onMounted(loadAnalytics)
</script>

<style scoped>
.analytics-view {
  width: 100%;
}

.header-row {
  gap: 8px;
}

.analytics-view .text-h5 {
  color: var(--san3a-gray-900);
}

.analytics-view .text-grey-7 {
  color: var(--san3a-gray-500) !important;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(205px, 1fr));
  gap: 12px;
}

.kpi-card {
  border-radius: 12px;
  border-color: var(--san3a-gray-200) !important;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
  cursor: pointer;
}

.kpi-card:hover,
.kpi-card:focus-visible {
  box-shadow: var(--san3a-shadow-md);
  transform: translateY(-2px);
  outline: 3px solid rgba(13, 115, 119, 0.2);
  outline-offset: 1px;
}

.kpi-icon-wrap {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex: 0 0 34px;
}

.kpi-icon-wrap--warning {
  background: #fff7ed;
  color: #b45309;
}

.kpi-icon-wrap--primary {
  background: var(--san3a-primary-light);
  color: var(--san3a-primary);
}

.kpi-icon-wrap--teal {
  background: #ecfeff;
  color: #0f766e;
}

.kpi-icon-wrap--info {
  background: var(--san3a-info-light);
  color: var(--san3a-info);
}

.kpi-icon-wrap--danger {
  background: var(--san3a-error-light);
  color: var(--san3a-error);
}

.kpi-icon-wrap--success {
  background: var(--san3a-success-light);
  color: var(--san3a-success);
}

.kpi-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kpi-label {
  font-size: 0.98rem;
  line-height: 1.2;
  font-weight: 700;
  color: var(--san3a-gray-700);
}

.kpi-subtitle {
  font-size: 0.76rem;
  color: var(--san3a-gray-500);
  margin-top: 2px;
}

.kpi-number {
  margin-top: 10px;
  margin-left: 44px;
  font-size: 1.9rem;
  line-height: 1.05;
  font-weight: 800;
  color: var(--san3a-gray-900);
}

.operations-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
}

.ops-card {
  border-radius: 12px;
  border-color: var(--san3a-gray-200) !important;
}

.ops-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.action-list {
  display: grid;
  gap: 8px;
}

.action-item {
  border: 1px solid var(--san3a-gray-200);
  background: #fff;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.action-item:hover {
  background: #f9fcfc;
}

.action-item-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 30px;
}

.action-item-icon--warning {
  background: #fff7ed;
  color: #b45309;
}

.action-item-icon--info {
  background: var(--san3a-info-light);
  color: var(--san3a-info);
}

.action-item-icon--danger {
  background: var(--san3a-error-light);
  color: var(--san3a-error);
}

.action-item-copy {
  min-width: 0;
  flex: 1;
}

.action-item-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--san3a-gray-800);
}

.action-item-sub {
  font-size: 12px;
  color: var(--san3a-gray-500);
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.health-item {
  border: 1px solid var(--san3a-gray-200);
  border-radius: 10px;
  padding: 10px;
  background: #fcfdfd;
}

.health-label {
  font-size: 12px;
  color: var(--san3a-gray-500);
}

.health-value {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 800;
  color: var(--san3a-gray-900);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.chart-card {
  border-radius: 12px;
  border-color: var(--san3a-gray-200) !important;
}

.trend-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.service-mix-wrap {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 14px;
  align-items: center;
}

.donut-wrap {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  position: relative;
  display: grid;
  place-items: center;
}

.service-donut {
  width: 180px;
  height: 180px;
  border-radius: 50%;
}

.donut-center {
  position: absolute;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--san3a-gray-200);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-total {
  font-size: 18px;
  font-weight: 800;
  color: var(--san3a-gray-900);
}

.donut-caption {
  font-size: 11px;
  color: var(--san3a-gray-500);
}

.service-legend {
  display: grid;
  gap: 8px;
}

.service-legend-row {
  display: grid;
  grid-template-columns: 12px 1fr auto;
  gap: 8px;
  align-items: center;
}

.service-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.service-name {
  font-size: 13px;
  color: var(--san3a-gray-700);
}

.service-value {
  font-size: 12px;
  color: var(--san3a-gray-500);
}

.chart-card--wide {
  grid-column: 1 / -1;
}

.bar-row + .bar-row {
  margin-top: 12px;
}

.activity-row {
  display: grid;
  grid-template-columns: 100px 1fr 90px;
  gap: 10px;
  align-items: center;
}

.activity-row + .activity-row {
  margin-top: 10px;
}

.activity-bars {
  width: 100%;
}

.mini-bar-wrap {
  background: #eceff1;
  border-radius: 999px;
  height: 8px;
  overflow: hidden;
}

.mini-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 280ms ease;
}

.mini-bar--request {
  background: var(--san3a-primary);
}

.mini-bar--complaint {
  background: var(--san3a-secondary);
}

.mini-bar--verification {
  background: #8b5cf6;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot--request {
  background: var(--san3a-primary);
}

.legend-dot--complaint {
  background: var(--san3a-secondary);
}

.legend-dot--verification {
  background: #8b5cf6;
}

@media (max-width: 960px) {
  .operations-grid {
    grid-template-columns: 1fr;
  }

  .health-grid {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card--wide {
    grid-column: auto;
  }
}

@media (max-width: 599px) {
  .service-mix-wrap {
    grid-template-columns: 1fr;
  }

  .donut-wrap {
    margin: 0 auto;
  }

  .activity-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .activity-label,
  .activity-values {
    text-align: left;
  }
}
</style>
