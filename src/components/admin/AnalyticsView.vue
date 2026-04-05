<template>
  <div class="analytics-view">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Analytics Overview</div>
        <div class="text-grey-7">Quick insights from your database tables</div>
      </div>
      <q-btn
        color="primary"
        icon="refresh"
        label="Refresh"
        :loading="loading"
        @click="loadAnalytics"
      />
    </div>

    <div class="kpi-grid q-mb-md">
      <q-card v-for="item in kpiCards" :key="item.label" flat bordered class="kpi-card">
        <q-card-section>
          <div class="row items-center no-wrap">
            <q-icon :name="item.icon" size="24px" :color="item.color" class="q-mr-sm" />
            <div class="text-subtitle2 text-grey-8">{{ item.label }}</div>
          </div>
          <div class="text-h5 text-weight-bold q-mt-sm">{{ formatNumber(item.value) }}</div>
        </q-card-section>
      </q-card>
    </div>

    <div class="charts-grid">
      <q-card flat bordered class="chart-card">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Requests by Status</div>
          <div class="text-caption text-grey-7 q-mb-md">Current distribution in request table</div>

          <div v-if="requestStatusBars.length === 0" class="text-grey-7">No request data found.</div>

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
          <div class="text-subtitle1 text-weight-medium">Last 7 Days Activity</div>
          <div class="text-caption text-grey-7 q-mb-md">
            New requests and complaints grouped by creation date
          </div>

          <div v-if="activityBars.length === 0" class="text-grey-7">No recent activity found.</div>

          <div v-for="day in activityBars" :key="day.date" class="activity-row">
            <div class="activity-label text-caption text-grey-8">{{ day.label }}</div>
            <div class="activity-bars">
              <div class="mini-bar-wrap">
                <div class="mini-bar mini-bar--request" :style="{ width: `${day.requestRatio}%` }"></div>
              </div>
              <div class="mini-bar-wrap q-mt-xs">
                <div
                  class="mini-bar mini-bar--complaint"
                  :style="{ width: `${day.complaintRatio}%` }"
                ></div>
              </div>
            </div>
            <div class="activity-values text-caption">
              R: {{ day.requests }} | C: {{ day.complaints }}
            </div>
          </div>

          <div class="legend row items-center q-gutter-md q-mt-md">
            <div class="row items-center">
              <span class="legend-dot legend-dot--request"></span>
              <span class="text-caption q-ml-xs">Requests</span>
            </div>
            <div class="row items-center">
              <span class="legend-dot legend-dot--complaint"></span>
              <span class="text-caption q-ml-xs">Complaints</span>
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
import { supabase } from 'src/boot/supabase'

const $q = useQuasar()

const loading = ref(false)
const usersCount = ref(0)
const techniciansCount = ref(0)
const requestsCount = ref(0)
const complaintsCount = ref(0)
const requestStatusMap = ref({})
const dailyActivity = ref([])

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString()
}

const parseStatus = (row) => {
  return String(row.request_status ?? row.status ?? 'pending').toLowerCase()
}

const toDateKey = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

const getRowDate = (row) => {
  return row.created_at ?? row.updated_at ?? row.inserted_at ?? row.createdAt ?? row.updatedAt ?? null
}

const buildLast7DayBuckets = () => {
  const buckets = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(now)
    day.setDate(now.getDate() - i)
    const key = day.toISOString().slice(0, 10)
    buckets.push({ key, requests: 0, complaints: 0 })
  }

  return buckets
}

const fetchTableCount = async (table) => {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) throw error
  return count || 0
}

const loadAnalytics = async () => {
  loading.value = true
  try {
    const [userTotal, technicianTotal, requestTotal, complaintTotal, requestRows, complaintRows] =
      await Promise.all([
        fetchTableCount('users'),
        fetchTableCount('technician'),
        fetchTableCount('request'),
        fetchTableCount('complaint'),
        supabase.from('request').select('*').limit(2000),
        supabase.from('complaint').select('*').limit(2000),
      ])

    usersCount.value = userTotal
    techniciansCount.value = technicianTotal
    requestsCount.value = requestTotal
    complaintsCount.value = complaintTotal

    if (requestRows.error) throw requestRows.error
    if (complaintRows.error) throw complaintRows.error

    const statusCounter = {}
    for (const row of requestRows.data || []) {
      const key = parseStatus(row)
      statusCounter[key] = (statusCounter[key] || 0) + 1
    }
    requestStatusMap.value = statusCounter

    const buckets = buildLast7DayBuckets()
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

    dailyActivity.value = buckets
  } catch (error) {
    console.error('Error loading analytics:', error)
    $q.notify({
      type: 'negative',
      message: 'Error loading analytics data',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const kpiCards = computed(() => {
  const totalRecords =
    Number(usersCount.value || 0) +
    Number(techniciansCount.value || 0) +
    Number(requestsCount.value || 0) +
    Number(complaintsCount.value || 0)

  return [
    { label: 'Total Records', value: totalRecords, icon: 'database', color: 'indigo' },
    { label: 'Users', value: usersCount.value, icon: 'person', color: 'primary' },
    { label: 'Technicians', value: techniciansCount.value, icon: 'engineering', color: 'teal' },
    { label: 'Requests', value: requestsCount.value, icon: 'assignment', color: 'orange' },
    { label: 'Complaints', value: complaintsCount.value, icon: 'flag', color: 'negative' },
  ]
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

const activityBars = computed(() => {
  const list = dailyActivity.value || []
  if (list.length === 0) return []

  const maxDaily = Math.max(...list.map((item) => Math.max(item.requests, item.complaints)), 1)

  return list.map((item) => {
    const date = new Date(item.key)
    return {
      date: item.key,
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      requests: item.requests,
      complaints: item.complaints,
      requestRatio: (item.requests / maxDaily) * 100,
      complaintRatio: (item.complaints / maxDaily) * 100,
    }
  })
})

onMounted(loadAnalytics)
</script>

<style scoped>
.analytics-view {
  width: 100%;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.kpi-card {
  border-radius: 12px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 12px;
}

.chart-card {
  border-radius: 12px;
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
  background: #1976d2;
}

.mini-bar--complaint {
  background: #d32f2f;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot--request {
  background: #1976d2;
}

.legend-dot--complaint {
  background: #d32f2f;
}

@media (max-width: 599px) {
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