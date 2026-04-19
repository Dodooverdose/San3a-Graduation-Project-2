<template>
  <div class="complaints-view">
    <div class="view-toolbar q-mb-md">
      <q-select
        v-model="filterStatus"
        :options="statusOptions"
        outlined
        dense
        label="Filter by Status"
        class="toolbar-filter"
      />
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search complaints..."
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
            <q-tooltip>View Details</q-tooltip>
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
            <q-tooltip>Mark as Resolved</q-tooltip>
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
            <q-tooltip>Reopen Complaint</q-tooltip>
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
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- View Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card class="admin-dialog-card" style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Complaint Details</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDetailsDialog = false" />
        </q-card-section>

        <q-card-section v-if="selectedComplaint">
          <div class="q-gutter-md">
            <div><strong>Complaint ID:</strong> #{{ selectedComplaint.complaint_id }}</div>
            <div><strong>Role:</strong> {{ selectedComplaint.complainant_role || '—' }}</div>
            <div>
              <strong>Filed By:</strong>
              <template v-if="complainantLoading">
                <q-spinner size="xs" class="q-ml-xs" />
              </template>
              <template v-else>
                {{ complainantUser?.full_name || '—' }}
              </template>
            </div>
            <div><strong>Issue Type:</strong> {{ selectedComplaint.issue_type || '—' }}</div>
            <div v-if="selectedComplaint.request_id">
              <strong>Related Request:</strong> #{{ selectedComplaint.request_id }}
            </div>
            <div><strong>Description:</strong> {{ selectedComplaint.description || '—' }}</div>
            <div>
              <strong>Status:</strong>
              <q-badge
                :label="selectedComplaint.status"
                :color="getStatusColor(selectedComplaint.status)"
                class="q-ml-xs"
              />
            </div>

            <q-separator class="q-my-sm" />
            <div class="text-subtitle2 text-weight-bold">Complaint Against</div>
            <template v-if="complainedAgainstLoading">
              <q-spinner size="sm" class="q-mr-sm" /> Loading...
            </template>
            <template v-else-if="complainedAgainstUser">
              <div><strong>Name:</strong> {{ complainedAgainstUser.full_name || '—' }}</div>
              <div><strong>Email:</strong> {{ complainedAgainstUser.email || '—' }}</div>
              <div><strong>Phone:</strong> {{ complainedAgainstUser.phone_number || '—' }}</div>
            </template>
            <template v-else>
              <div class="text-grey">No complained-against info available</div>
            </template>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-if="selectedComplaint?.status === 'Unsolved'"
            unelevated
            no-caps
            color="positive"
            label="Mark Resolved"
            @click="resolveAndClose"
          />
          <q-btn flat label="Close" color="primary" @click="showDetailsDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const $q = useQuasar()

const columns = [
  { name: 'complaint_id', label: 'ID', field: 'complaint_id', align: 'left' },
  { name: 'complainant_role', label: 'Role', field: 'complainant_role', align: 'left' },
  { name: 'issue_type', label: 'Issue Type', field: 'issue_type', align: 'left' },
  { name: 'description', label: 'Description', field: 'description', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const statusOptions = ['Unsolved', 'Resolved']

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
      message: 'Error loading complaints',
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
      message: 'Complaint marked as Resolved. Confirmation sent to complainant.',
      position: 'top',
    })
    loadComplaints()
  } catch (error) {
    console.error('Error resolving complaint:', error)
    $q.notify({ type: 'negative', message: 'Failed to resolve complaint', position: 'top' })
  }
}

const unresolveComplaint = async (id) => {
  try {
    const { error } = await supabase
      .from('complaint')
      .update({ status: 'Unsolved' })
      .eq('complaint_id', id)

    if (error) throw error
    $q.notify({ type: 'warning', message: 'Complaint reopened', position: 'top' })
    loadComplaints()
  } catch (error) {
    console.error('Error reopening complaint:', error)
    $q.notify({ type: 'negative', message: 'Failed to reopen complaint', position: 'top' })
  }
}

const deleteComplaint = async (id) => {
  try {
    await $q.dialog({
      title: 'Confirm',
      message: 'Are you sure you want to delete this complaint?',
      cancel: true,
      persistent: true,
    })

    const { error } = await supabase.from('complaint').delete().eq('complaint_id', id)

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: 'Complaint deleted successfully',
      position: 'top',
    })
    loadComplaints()
  } catch (error) {
    if (error.message !== 'Cancelled') {
      console.error('Error deleting complaint:', error)
      $q.notify({
        type: 'negative',
        message: 'Error deleting complaint',
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
