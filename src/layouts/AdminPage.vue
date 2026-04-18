<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="app-header-teal">
      <q-toolbar class="app-toolbar">
        <q-btn
          flat
          round
          dense
          icon="menu"
          class="header-action-btn header-menu-btn"
          title="Open navigation"
          @click="drawerOpen = !drawerOpen"
        />
        <div class="header-brand">
          <div class="header-brand-icon-w">
            <img src="/icons/White.png" alt="Sanعa logo" class="brand-logo-mark" />
          </div>
          <div>
            <div class="header-brand-name-w">Sanعa Admin</div>
            <div class="header-brand-sub">Operations Dashboard</div>
          </div>
        </div>
        <q-space />
        <q-btn
          flat
          round
          dense
          icon="refresh"
          class="header-action-btn"
          title="Refresh metrics"
          @click="loadDashboard"
        />
        <q-btn flat round dense icon="logout" class="logout-btn" @click="logout" title="Logout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" side="left" overlay bordered class="admin-drawer">
      <div class="drawer-title">Management</div>
      <q-list class="sidebar-list" separator>
        <q-item
          v-for="item in navItems"
          :key="item.key"
          clickable
          class="sidebar-item"
          :active="activeTab === item.key"
          active-class="sidebar-item-active"
          @click="selectTab(item.key)"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" size="20px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ item.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page class="admin-page">
        <div class="admin-container">
          <main class="admin-main san3a-animate-in san3a-stagger-1">
            <section class="kpi-grid">
              <q-card v-for="card in kpiCards" :key="card.label" flat bordered class="kpi-card">
                <q-card-section>
                  <div class="kpi-top">
                    <div class="kpi-icon" :class="`kpi-icon--${card.tone}`">
                      <q-icon :name="card.icon" size="20px" />
                    </div>
                    <q-badge :color="card.delta >= 0 ? 'positive' : 'negative'" class="kpi-delta">
                      {{ card.delta >= 0 ? '+' : '' }}{{ card.delta }}%
                    </q-badge>
                  </div>
                  <div class="kpi-value">{{ formatCompact(card.value) }}</div>
                  <div class="kpi-label">{{ card.label }}</div>
                </q-card-section>
              </q-card>
            </section>

            <section class="admin-workspace">
              <q-tab-panels v-model="activeTab" animated class="admin-panels">
                <q-tab-panel name="analytics"
                  ><AnalyticsView @open-section="selectTab"
                /></q-tab-panel>
                <q-tab-panel name="technicians"><TechniciansView /></q-tab-panel>
                <q-tab-panel name="customers"><CustomersView /></q-tab-panel>
                <q-tab-panel name="requests"><RequestsView /></q-tab-panel>
                <q-tab-panel name="pending"><VerificationsView /></q-tab-panel>
                <q-tab-panel name="complaints"><ComplaintsView /></q-tab-panel>
              </q-tab-panels>
            </section>
          </main>

          <aside class="admin-activity san3a-animate-in san3a-stagger-2">
            <div class="activity-head">
              <div class="activity-title">Recent Activity</div>
              <q-icon name="history" color="primary" />
            </div>
            <div v-if="activityLoading" class="activity-state">
              <q-spinner size="28px" color="primary" />
            </div>
            <div v-else-if="activityItems.length === 0" class="activity-state">
              <q-icon name="inbox" size="30px" color="grey-5" />
              <div>No recent events</div>
            </div>
            <div v-else class="activity-list">
              <div v-for="item in activityItems" :key="item.id" class="activity-item">
                <div class="activity-dot" :class="`activity-dot--${item.tone}`"></div>
                <div class="activity-copy">
                  <div class="activity-message">{{ item.message }}</div>
                  <div class="activity-time">{{ item.time }}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import TechniciansView from 'src/components/admin/TechniciansView.vue'
import CustomersView from 'src/components/admin/CustomersView.vue'
import RequestsView from 'src/components/admin/RequestsView.vue'
import VerificationsView from 'src/components/admin/VerificationsView.vue'
import ComplaintsView from 'src/components/admin/ComplaintsView.vue'
import AnalyticsView from 'src/components/admin/AnalyticsView.vue'

const router = useRouter()
const $q = useQuasar()
const activeTab = ref('analytics')
const drawerOpen = ref(false)
const metrics = ref({
  pendingVerifications: 0,
  activeRequests: 0,
  openComplaints: 0,
  totalUsers: 0,
})
const previousMetrics = ref({
  pendingVerifications: 0,
  activeRequests: 0,
  openComplaints: 0,
  totalUsers: 0,
})
const activityItems = ref([])
const activityLoading = ref(false)

const navItems = [
  { key: 'analytics', label: 'Analytics', icon: 'insights' },
  { key: 'technicians', label: 'Technicians', icon: 'engineering' },
  { key: 'customers', label: 'Customers', icon: 'person' },
  { key: 'requests', label: 'Requests', icon: 'assignment' },
  { key: 'pending', label: 'Verifications', icon: 'pending_actions' },
  { key: 'complaints', label: 'Complaints', icon: 'flag' },
]

const selectTab = (key) => {
  activeTab.value = key
  drawerOpen.value = false
}

const percentageDelta = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

const kpiCards = computed(() => {
  const current = metrics.value
  const previous = previousMetrics.value
  return [
    {
      label: 'Pending Verifications',
      value: current.pendingVerifications,
      delta: percentageDelta(current.pendingVerifications, previous.pendingVerifications),
      icon: 'pending_actions',
      tone: 'warning',
    },
    {
      label: 'Active Requests',
      value: current.activeRequests,
      delta: percentageDelta(current.activeRequests, previous.activeRequests),
      icon: 'assignment',
      tone: 'info',
    },
    {
      label: 'Open Complaints',
      value: current.openComplaints,
      delta: percentageDelta(current.openComplaints, previous.openComplaints),
      icon: 'report',
      tone: 'danger',
    },
    {
      label: 'Total Users',
      value: current.totalUsers,
      delta: percentageDelta(current.totalUsers, previous.totalUsers),
      icon: 'groups',
      tone: 'success',
    },
  ]
})

const formatCompact = (value) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    Number(value || 0),
  )

const safeCount = async (table, idColumn, filterFn) => {
  let query = supabase.from(table).select(idColumn, { count: 'exact', head: true })
  if (filterFn) query = filterFn(query)
  const { count, error } = await query
  if (error) return 0
  return count || 0
}

const loadMetrics = async () => {
  const next = {
    pendingVerifications: await safeCount('profile_verification_submissions', 'auth_id', (q) =>
      q.eq('review_status', 'pending'),
    ),
    activeRequests: await safeCount('request', 'request_id', (q) =>
      q.not('request_status', 'in', '(completed,cancelled)'),
    ),
    openComplaints: await safeCount('complaint', 'id', (q) =>
      q.in('status', ['open', 'in-progress', 'pending']),
    ),
    totalUsers:
      (await safeCount('users', 'user_id')) + (await safeCount('technician', 'technician_id')),
  }
  previousMetrics.value = { ...metrics.value }
  metrics.value = next
}

const relativeTime = (dateStr) => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'Just now'
  const diff = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

const rowTime = (row) =>
  row.date_created || row.request_date || row.created_at || row.updated_at || null

const loadActivity = async () => {
  activityLoading.value = true
  try {
    const [requestsRes, complaintsRes, verificationsRes] = await Promise.all([
      supabase.from('request').select('*').limit(8),
      supabase.from('complaint').select('*').limit(8),
      supabase.from('profile_verification_submissions').select('*').limit(8),
    ])

    const rows = []

    for (const row of requestsRes.data || []) {
      const timeValue = rowTime(row)
      rows.push({
        id: `req-${row.request_id}`,
        timeKey: timeValue,
        tone: 'info',
        message: `Request #${row.request_id} is ${row.request_status || 'pending'}.`,
        time: relativeTime(timeValue),
      })
    }
    for (const row of complaintsRes.data || []) {
      const timeValue = rowTime(row)
      rows.push({
        id: `comp-${row.id}`,
        timeKey: timeValue,
        tone: 'danger',
        message: `Complaint #${row.id} marked ${row.status || 'open'}.`,
        time: relativeTime(timeValue),
      })
    }
    for (const row of verificationsRes.data || []) {
      const timeValue = row.reviewed_at || row.verification_completed_at || row.submitted_at
      const approved = row.review_status === 'approved'
      rows.push({
        id: `verification-${row.auth_id}`,
        timeKey: timeValue,
        tone: approved ? 'success' : 'warning',
        message: `${row.account_type === 'technician' ? 'Technician' : 'User'} verification ${approved ? 'approved' : 'pending review'}.`,
        time: relativeTime(timeValue),
      })
    }

    activityItems.value = rows
      .filter((item) => item.timeKey)
      .sort((a, b) => new Date(b.timeKey).getTime() - new Date(a.timeKey).getTime())
      .slice(0, 8)
  } catch {
    activityItems.value = []
  } finally {
    activityLoading.value = false
  }
}

const loadDashboard = async () => {
  await Promise.all([loadMetrics(), loadActivity()])
}

const logout = async () => {
  try {
    await supabase.auth.signOut()
    router.push('/signin')
  } catch (error) {
    console.error('Logout error:', error)
    $q.notify({ type: 'negative', message: 'Error logging out', position: 'top' })
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.app-header-teal {
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover)) !important;
}
.app-toolbar {
  max-width: 1360px;
  margin: 0 auto;
  width: 100%;
}
.header-menu-btn {
  margin-right: 10px;
}
.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
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
  font-size: 20px;
  font-weight: 800;
  line-height: 1.1;
}
.header-brand-sub {
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  line-height: 1.2;
}
.header-action-btn,
.logout-btn {
  color: rgba(255, 255, 255, 0.9) !important;
}

.admin-page {
  background: var(--san3a-bg);
  min-height: 100vh;
  padding: 18px 16px 28px;
}
.admin-container {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
}

.drawer-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--san3a-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 16px 16px 10px;
}
.sidebar-list {
  border-radius: var(--san3a-radius-lg);
  overflow: hidden;
  padding: 0 10px;
}
.sidebar-item {
  border-radius: 10px;
  margin-bottom: 4px;
  color: var(--san3a-gray-700);
  font-weight: 600;
}
.sidebar-item:hover {
  background: var(--san3a-gray-100);
}
.sidebar-item-active {
  background: var(--san3a-primary-light) !important;
  color: var(--san3a-primary) !important;
}

.admin-main {
  min-width: 0;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.kpi-card {
  border-radius: var(--san3a-radius-xl);
  border-color: var(--san3a-gray-200) !important;
}
.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.kpi-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.kpi-icon--warning {
  background: var(--san3a-warning-light);
  color: var(--san3a-warning);
}
.kpi-icon--info {
  background: var(--san3a-info-light);
  color: var(--san3a-info);
}
.kpi-icon--danger {
  background: var(--san3a-error-light);
  color: var(--san3a-error);
}
.kpi-icon--success {
  background: var(--san3a-success-light);
  color: var(--san3a-success);
}
.kpi-delta {
  font-weight: 700;
}
.kpi-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--san3a-gray-900);
  line-height: 1.2;
}
.kpi-label {
  font-size: 13px;
  color: var(--san3a-gray-500);
  margin-top: 2px;
}

.admin-workspace {
  background: #fff;
  border: 1px solid var(--san3a-gray-200);
  border-radius: var(--san3a-radius-xl);
  min-height: 620px;
}
.admin-panels {
  background: transparent;
  border-radius: inherit;
}
.admin-panels :deep(.q-tab-panel) {
  padding: 16px;
}

.admin-activity {
  background: #fff;
  border: 1px solid var(--san3a-gray-200);
  border-radius: var(--san3a-radius-xl);
  padding: 14px;
  height: calc(100vh - 118px);
  position: sticky;
  top: 78px;
  overflow-y: auto;
}
.activity-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.activity-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--san3a-gray-900);
}
.activity-state {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--san3a-gray-500);
  gap: 8px;
}
.activity-list {
  display: grid;
  gap: 10px;
}
.activity-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px;
  border-radius: 10px;
  background: var(--san3a-gray-50);
  border: 1px solid var(--san3a-gray-200);
}
.activity-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-top: 6px;
}
.activity-dot--info {
  background: var(--san3a-info);
}
.activity-dot--danger {
  background: var(--san3a-error);
}
.activity-dot--warning {
  background: var(--san3a-warning);
}
.activity-dot--success {
  background: var(--san3a-success);
}
.activity-message {
  font-size: 13px;
  line-height: 1.45;
  color: var(--san3a-gray-800);
}
.activity-time {
  font-size: 12px;
  color: var(--san3a-gray-500);
  margin-top: 2px;
}

.admin-workspace :deep(.q-table) {
  border-radius: 12px;
  overflow: hidden;
}
.admin-workspace :deep(.q-table thead tr) {
  background: var(--san3a-gray-100);
}
.admin-workspace :deep(.q-table tbody tr:hover) {
  background: #f9fcfc;
}
.admin-workspace :deep(.q-table th) {
  font-weight: 700;
  color: var(--san3a-gray-700);
}
.admin-workspace :deep(.q-field--outlined .q-field__control:hover) {
  border-color: rgba(13, 115, 119, 0.35) !important;
}
.admin-workspace :deep(.q-btn:focus-visible),
.admin-drawer :deep(.q-item:focus-visible),
.admin-workspace :deep(.q-field__control:focus-within) {
  outline: 3px solid rgba(13, 115, 119, 0.22);
  outline-offset: 2px;
}

@media (max-width: 1250px) {
  .admin-container {
    grid-template-columns: minmax(0, 1fr);
  }
  .admin-activity {
    display: none;
  }
}

@media (max-width: 900px) {
  .admin-page {
    padding: 14px 12px 22px;
  }
  .admin-container {
    grid-template-columns: 1fr;
  }
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .header-brand-sub {
    display: none;
  }
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
