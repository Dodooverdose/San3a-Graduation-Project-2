<template>
  <div class="complaints-view">
    <div class="view-toolbar q-mb-md">
      <q-select
        v-model="filterStatus"
        :options="statusOptions"
        outlined
        dense
        :label="$t('admin.filterByStatus')"
        class="toolbar-filter"
      />
      <q-input
        v-model="searchQuery"
        outlined
        dense
        :placeholder="$t('admin.searchComplaints')"
        class="toolbar-search"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-table
      :rows="filteredComplaints"
      :columns="columns"
      row-key="complaint_id"
      :loading="loading"
      :pagination="tablePagination"
      :rows-per-page-options="[0]"
      class="q-mt-md admin-table"
    >
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge :label="props.row.status" :color="getStatusColor(props.row.status)" />
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            round
            icon="visibility"
            size="sm"
            color="primary"
            @click="viewComplaint(props.row)"
          >
            <q-tooltip>{{ $t('admin.viewDetails') }}</q-tooltip>
          </q-btn>
          <q-btn
            v-if="props.row.status === 'Unsolved'"
            flat
            dense
            round
            icon="check_circle"
            size="sm"
            color="positive"
            @click="resolveComplaint(props.row)"
          >
            <q-tooltip>{{ $t('admin.markAsResolved') }}</q-tooltip>
          </q-btn>
          <q-btn
            v-else
            flat
            dense
            round
            icon="undo"
            size="sm"
            color="warning"
            @click="unresolveComplaint(props.row.complaint_id)"
          >
            <q-tooltip>{{ $t('admin.reopenComplaint') }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="delete"
            size="sm"
            color="negative"
            @click="deleteComplaint(props.row.complaint_id)"
          >
            <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- View Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card class="admin-dialog-card" style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ $t('admin.complaintDetails') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDetailsDialog = false" />
        </q-card-section>

        <q-card-section v-if="selectedComplaint">
          <div class="q-gutter-md">
            <div><strong>{{ $t('admin.complaintId') }}</strong> #{{ selectedComplaint.complaint_id }}</div>
            <div><strong>{{ $t('admin.role') }}</strong> {{ selectedComplaint.complainant_role || '—' }}</div>
            <div>
              <strong>{{ $t('admin.filedBy') }}</strong>
              <template v-if="complainantLoading">
                <q-spinner size="xs" class="q-ml-xs" />
              </template>
              <template v-else>
                {{ complainantUser?.full_name || '—' }}
              </template>
            </div>
            <div><strong>{{ $t('admin.colIssueType') }}:</strong> {{ selectedComplaint.issue_type || '—' }}</div>
            <div v-if="selectedComplaint.request_id">
              <strong>{{ $t('admin.relatedRequest') }}</strong> #{{ selectedComplaint.request_id }}
            </div>
            <div><strong>{{ $t('admin.colDescription') }}:</strong> {{ selectedComplaint.description || '—' }}</div>
            <div>
              <strong>{{ $t('admin.colStatus') }}:</strong>
              <q-badge
                :label="selectedComplaint.status"
                :color="getStatusColor(selectedComplaint.status)"
                class="q-ml-xs"
              />
            </div>

            <q-separator class="q-my-sm" />
            <div class="text-subtitle2 text-weight-bold">{{ $t('admin.complaintAgainst') }}</div>
            <template v-if="complainedAgainstLoading">
              <q-spinner size="sm" class="q-mr-sm" /> Loading...
            </template>
            <template v-else-if="complainedAgainstUser">
              <div><strong>{{ $t('admin.colName') }}:</strong> {{ complainedAgainstUser.full_name || '—' }}</div>
              <div><strong>{{ $t('common.email') }}:</strong> {{ complainedAgainstUser.email || '—' }}</div>
              <div><strong>{{ $t('common.phone') }}:</strong> {{ complainedAgainstUser.phone_number || '—' }}</div>
            </template>
            <template v-else>
              <div class="text-grey">{{ $t('admin.noComplaintAgainstInfo') }}</div>
            </template>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-if="selectedComplaint?.status === 'Unsolved'"
            unelevated
            no-caps
            color="positive"
            :label="$t('admin.markResolved')"
            @click="resolveAndClose"
          />
          <q-btn flat :label="$t('common.close')" color="primary" @click="showDetailsDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { supabase } from 'src/boot/supabase'

const $q = useQuasar()
const { t } = useI18n()

const columns = [
  { name: 'complaint_id', label: t('admin.colId'), field: 'complaint_id', align: 'left' },
  { name: 'complainant_role', label: t('admin.role'), field: 'complainant_role', align: 'left' },
  { name: 'issue_type', label: t('admin.colIssueType'), field: 'issue_type', align: 'left' },
  { name: 'description', label: t('admin.colDescription'), field: 'description', align: 'left' },
  { name: 'status', label: t('admin.colStatus'), field: 'status', align: 'center' },
  { name: 'actions', label: t('admin.colActions'), field: 'actions', align: 'center' },
]

const statusOptions = [t('admin.unsolved'), t('admin.resolved')]

const complaints = ref([])
const loading = ref(false)
const tablePagination = ref({ rowsPerPage: 0 })
const searchQuery = ref('')
const filterStatus = ref(null)
const showDetailsDialog = ref(false)
const selectedComplaint = ref(null)
const complainedAgainstUser = ref(null)
const complainedAgainstLoading = ref(false)
const complainantUser = ref(null)
const complainantLoading = ref(false)

const normalizeText = (value) => (value === null || value === undefined ? '' : String(value))

const filteredComplaints = computed(() => {
  const query = searchQuery.value.toLowerCase()

  return complaints.value.filter((comp) => {
    const matchesSearch =
      normalizeText(comp.issue_type).toLowerCase().includes(query) ||
      normalizeText(comp.description).toLowerCase().includes(query) ||
      normalizeText(comp.complainant_role).toLowerCase().includes(query)

    const matchesStatus = !filterStatus.value || comp.status === filterStatus.value

    return matchesSearch && matchesStatus
  })
})

const loadComplaints = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase.from('complaint').select('*')

    if (error) throw error
    complaints.value = data || []
  } catch (error) {
    console.error('Error loading complaints:', error)
    $q.notify({
      type: 'negative',
      message: t('admin.errorLoadingComplaints'),
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const viewComplaint = async (complaint) => {
  selectedComplaint.value = complaint
  complainedAgainstUser.value = null
  complainantUser.value = null
  showDetailsDialog.value = true

  const isCustomerComplaint = complaint.complainant_role === 'customer'

  // Fetch complainant (filer) info
  const filerTable = isCustomerComplaint ? 'users' : 'technician'
  const filerIdColumn = isCustomerComplaint ? 'user_id' : 'technician_id'
  const filerId = isCustomerComplaint ? complaint.user_id : complaint.technician_id
  if (filerId) {
    complainantLoading.value = true
    supabase
      .from(filerTable)
      .select('full_name, email, phone_number')
      .eq(filerIdColumn, filerId)
      .maybeSingle()
      .then(({ data }) => {
        complainantUser.value = data
      })
      .catch((err) => console.error('Error fetching complainant:', err))
      .finally(() => {
        complainantLoading.value = false
      })
  }
  const targetId =
    complaint.complained_against_id ||
    (isCustomerComplaint ? complaint.technician_id : complaint.user_id)

  if (targetId) {
    complainedAgainstLoading.value = true
    try {
      const table = isCustomerComplaint ? 'technician' : 'users'
      const idColumn = isCustomerComplaint ? 'technician_id' : 'user_id'

      const { data, error } = await supabase
        .from(table)
        .select('full_name, email, phone_number')
        .eq(idColumn, targetId)
        .maybeSingle()

      if (error) throw error
      complainedAgainstUser.value = data
    } catch (err) {
      console.error('Error fetching complained-against user:', err)
    } finally {
      complainedAgainstLoading.value = false
    }
  }
}

const resolveAndClose = () => {
  resolveComplaint(selectedComplaint.value)
  showDetailsDialog.value = false
}

const getComplainantEmail = async (complaint) => {
  const isCustomer = complaint.complainant_role === 'customer'
  const table = isCustomer ? 'users' : 'technician'
  const idColumn = isCustomer ? 'user_id' : 'technician_id'
  const targetId = isCustomer ? complaint.user_id : complaint.technician_id

  if (!targetId) return null

  const { data } = await supabase.from(table).select('email').eq(idColumn, targetId).maybeSingle()

  return data?.email || null
}

const resolveComplaint = async (complaint) => {
  const id = typeof complaint === 'object' ? complaint.complaint_id : complaint
  const comp =
    typeof complaint === 'object' ? complaint : complaints.value.find((c) => c.complaint_id === id)

  try {
    const { error } = await supabase
      .from('complaint')
      .update({ status: 'Resolved' })
      .eq('complaint_id', id)

    if (error) throw error

    if (comp) {
      const email = await getComplainantEmail(comp)
      if (email) {
        await supabase.from('notification_center').insert({
          recipient_email: email.trim().toLowerCase(),
          title: 'Complaint Resolution',
          message: `Your complaint #${id} regarding "${comp.issue_type || 'N/A'}" has been reviewed. Has your issue been resolved?`,
          request_id: comp.request_id ? String(comp.request_id) : null,
          notification_type: 'complaint-resolution',
          icon: 'gavel',
          payload: { complaintId: id, type: 'complaint-resolution' },
        })
      }
    }

    $q.notify({
      type: 'positive',
      message: t('admin.complaintResolved'),
      position: 'top',
    })
    loadComplaints()
  } catch (error) {
    console.error('Error resolving complaint:', error)
    $q.notify({ type: 'negative', message: t('admin.failedResolve'), position: 'top' })
  }
}

const unresolveComplaint = async (id) => {
  try {
    const { error } = await supabase
      .from('complaint')
      .update({ status: 'Unsolved' })
      .eq('complaint_id', id)

    if (error) throw error
    $q.notify({ type: 'warning', message: t('admin.complaintReopened'), position: 'top' })
    loadComplaints()
  } catch (error) {
    console.error('Error reopening complaint:', error)
    $q.notify({ type: 'negative', message: t('admin.failedReopen'), position: 'top' })
  }
}

const deleteComplaint = async (id) => {
  try {
    await $q.dialog({
      title: t('common.confirm'),
      message: t('admin.deleteComplaintConfirm'),
      cancel: true,
      persistent: true,
    })

    const { error } = await supabase.from('complaint').delete().eq('complaint_id', id)

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: t('admin.complaintDeleted'),
      position: 'top',
    })
    loadComplaints()
  } catch (error) {
    if (error.message !== 'Cancelled') {
      console.error('Error deleting complaint:', error)
      $q.notify({
        type: 'negative',
        message: t('admin.errorDeletingComplaint'),
        position: 'top',
      })
    }
  }
}

const getStatusColor = (status) => {
  const colors = {
    open: 'orange',
    'in-progress': 'blue',
    resolved: 'green',
    closed: 'grey',
    Unsolved: 'orange',
    Resolved: 'green',
  }
  return colors[status] || 'grey'
}

loadComplaints()
</script>

<style scoped>
.complaints-view {
  width: 100%;
}

.view-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-filter {
  width: 240px;
  max-width: 100%;
}

.toolbar-search {
  width: 320px;
  max-width: 100%;
}

.admin-table {
  border: 1px solid var(--san3a-gray-200);
  border-radius: 12px;
  overflow: hidden;
}

.admin-table :deep(thead tr) {
  background: var(--san3a-gray-100);
}

.admin-table :deep(th) {
  color: var(--san3a-gray-700);
  font-weight: 700;
}

.admin-table :deep(tbody tr:hover) {
  background: #f9fcfc;
}

.admin-dialog-card {
  border-radius: 14px;
}

@media (max-width: 600px) {
  .toolbar-filter,
  .toolbar-search {
    width: 100%;
  }
}
</style>
