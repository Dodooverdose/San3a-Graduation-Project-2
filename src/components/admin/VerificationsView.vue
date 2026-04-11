<template>
  <div class="verifications-view">
    <div class="verification-summary q-mb-md">
      <q-chip color="primary" text-color="white" icon="groups">{{ totalCount }} total</q-chip>
      <q-chip color="orange" text-color="white" icon="pending_actions"
        >{{ pendingCount }} pending</q-chip
      >
      <q-chip color="positive" text-color="white" icon="verified"
        >{{ approvedCount }} approved</q-chip
      >
      <q-chip color="negative" text-color="white" icon="block">{{ rejectedCount }} rejected</q-chip>
    </div>

    <div class="view-toolbar q-mb-md">
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search by name or email..."
        class="toolbar-search"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <q-select
        v-model="statusFilter"
        dense
        outlined
        emit-value
        map-options
        :options="statusOptions"
        class="toolbar-filter"
      />
    </div>

    <q-table
      :rows="filteredRows"
      :columns="columns"
      row-key="auth_id"
      :loading="loading"
      :pagination="tablePagination"
      :rows-per-page-options="[0]"
      class="admin-table"
    >
      <template v-slot:body-cell-account_type="props">
        <q-td :props="props">
          <q-badge
            :label="props.row.account_type === 'technician' ? 'Technician' : 'User'"
            :color="props.row.account_type === 'technician' ? 'secondary' : 'primary'"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-review_status="props">
        <q-td :props="props">
          <q-badge
            :label="formatStatus(props.row.review_status)"
            :color="statusColor(props.row.review_status)"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-submitted_at="props">
        <q-td :props="props">{{ formatDate(props.row.submitted_at) }}</q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            round
            icon="info"
            size="sm"
            color="primary"
            @click="openDetails(props.row)"
          />
          <q-btn
            flat
            dense
            round
            icon="check"
            size="sm"
            color="positive"
            title="Approve"
            @click="updateReviewStatus(props.row, 'approved')"
          />
          <q-btn
            flat
            dense
            round
            icon="close"
            size="sm"
            color="negative"
            title="Reject"
            @click="rejectWithReason(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="showDialog">
      <q-card class="admin-dialog-card details-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Verification Profile</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDialog = false" />
        </q-card-section>

        <q-card-section v-if="selectedRow" class="details-section">
          <div class="details-grid">
            <div><strong>Account:</strong> {{ selectedRow.account_type }}</div>
            <div><strong>Name:</strong> {{ selectedRow.full_name || '-' }}</div>
            <div><strong>Email:</strong> {{ selectedRow.email || '-' }}</div>
            <div><strong>Status:</strong> {{ formatStatus(selectedRow.review_status) }}</div>
            <div v-if="selectedRow.review_status === 'rejected' && selectedRow.reviewer_notes">
              <strong>Rejection Reason:</strong> {{ selectedRow.reviewer_notes }}
            </div>
            <div>
              <strong>Submitted:</strong>
              {{ formatDate(selectedRow.verification_completed_at || selectedRow.submitted_at) }}
            </div>
            <div><strong>Phone:</strong> {{ selectedRow.profile_details?.phoneNumber || '-' }}</div>
            <div v-if="selectedRow.account_type === 'technician'">
              <strong>Specialty:</strong> {{ selectedRow.profile_details?.specialty || '-' }}
            </div>
            <div v-if="selectedRow.account_type === 'technician'">
              <strong>Experience:</strong>
              {{ selectedRow.profile_details?.yearsOfExperience || '-' }} years
            </div>
          </div>

          <div class="images-grid">
            <div class="image-card">
              <div class="image-label">National ID Front</div>
              <img
                v-if="selectedRow.national_id_front_image"
                :src="selectedRow.national_id_front_image"
                alt="National ID front"
              />
              <div v-else class="image-empty">No image uploaded</div>
            </div>

            <div class="image-card">
              <div class="image-label">National ID Back</div>
              <img
                v-if="selectedRow.national_id_back_image"
                :src="selectedRow.national_id_back_image"
                alt="National ID back"
              />
              <div v-else class="image-empty">No image uploaded</div>
            </div>

            <div class="image-card">
              <div class="image-label">Selfie</div>
              <img v-if="selectedRow.selfie_image" :src="selectedRow.selfie_image" alt="Selfie" />
              <div v-else class="image-empty">No image uploaded</div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Reject" color="negative" @click="rejectWithReason(selectedRow)" />
          <q-btn
            unelevated
            label="Approve"
            color="positive"
            @click="updateReviewStatus(selectedRow, 'approved')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showRejectDialog" persistent>
      <q-card class="admin-dialog-card reject-dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Reject Profile</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeRejectDialog" />
        </q-card-section>

        <q-card-section>
          <div class="text-body2 q-mb-sm">Please write the rejection reason:</div>
          <q-input
            v-model="rejectReason"
            type="textarea"
            autogrow
            outlined
            dense
            maxlength="500"
            placeholder="Explain why this profile is rejected"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-7" @click="closeRejectDialog" />
          <q-btn
            unelevated
            label="Reject Profile"
            color="negative"
            :loading="rejectSaving"
            @click="submitRejectWithReason"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const $q = useQuasar()

const columns = [
  { name: 'account_type', label: 'Account Type', field: 'account_type', align: 'left' },
  { name: 'full_name', label: 'Name', field: 'full_name', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'review_status', label: 'Status', field: 'review_status', align: 'center' },
  { name: 'submitted_at', label: 'Submitted', field: 'submitted_at', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const rows = ref([])
const loading = ref(false)
const tablePagination = ref({ rowsPerPage: 0 })
const searchQuery = ref('')
const statusFilter = ref('all')
const showDialog = ref(false)
const selectedRow = ref(null)
const showRejectDialog = ref(false)
const rejectReason = ref('')
const rejectTargetRow = ref(null)
const rejectSaving = ref(false)

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return rows.value.filter((row) => {
    const matchesStatus = statusFilter.value === 'all' || row.review_status === statusFilter.value
    if (!matchesStatus) return false

    if (!query) return true

    return (
      String(row.full_name || '')
        .toLowerCase()
        .includes(query) ||
      String(row.email || '')
        .toLowerCase()
        .includes(query)
    )
  })
})

const totalCount = computed(() => rows.value.length)
const pendingCount = computed(
  () => rows.value.filter((row) => row.review_status === 'pending').length,
)
const approvedCount = computed(
  () => rows.value.filter((row) => row.review_status === 'approved').length,
)
const rejectedCount = computed(
  () => rows.value.filter((row) => row.review_status === 'rejected').length,
)

const statusColor = (status) => {
  if (status === 'approved') return 'positive'
  if (status === 'rejected') return 'negative'
  return 'warning'
}

const formatStatus = (status) => {
  if (!status) return 'Pending'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

const loadRows = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('profile_verification_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (error) throw error

    rows.value = data || []
  } catch (error) {
    console.error('Error loading verifications:', error)
    $q.notify({ type: 'negative', message: 'Failed to load verification profiles.' })
  } finally {
    loading.value = false
  }
}

const openDetails = (row) => {
  selectedRow.value = row
  showDialog.value = true
}

const updateReviewStatus = async (row, status, reviewerNotes = null) => {
  if (!row?.auth_id) return

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('profile_verification_submissions')
      .update({
        review_status: status,
        reviewer_notes: status === 'rejected' ? reviewerNotes : null,
        reviewed_at: new Date().toISOString(),
        reviewed_by_auth_id: user?.id || null,
      })
      .eq('auth_id', row.auth_id)

    if (error) throw error

    $q.notify({
      type: 'positive',
      message: `Verification marked as ${status}.`,
    })

    if (selectedRow.value?.auth_id === row.auth_id) {
      selectedRow.value = {
        ...selectedRow.value,
        review_status: status,
        reviewer_notes: status === 'rejected' ? reviewerNotes : null,
      }
    }

    await loadRows()
  } catch (error) {
    console.error('Failed to update status:', error)
    $q.notify({ type: 'negative', message: error?.message || 'Failed to update review status.' })
  }
}

const closeRejectDialog = () => {
  showRejectDialog.value = false
  rejectReason.value = ''
  rejectTargetRow.value = null
}

const rejectWithReason = async (row) => {
  if (!row?.auth_id) return

  rejectTargetRow.value = row
  rejectReason.value = row?.reviewer_notes || ''
  showRejectDialog.value = true
}

const submitRejectWithReason = async () => {
  if (!rejectTargetRow.value?.auth_id) return

  try {
    const cleanedReason = rejectReason.value.trim()
    if (!cleanedReason) {
      $q.notify({
        type: 'warning',
        message: 'Please write a rejection reason before rejecting this profile.',
      })
      return
    }

    rejectSaving.value = true
    await updateReviewStatus(rejectTargetRow.value, 'rejected', cleanedReason)
    closeRejectDialog()
  } catch (error) {
    console.error('Reject action failed:', error)
    $q.notify({
      type: 'negative',
      message: error?.message || 'Could not reject profile. Please try again.',
    })
  } finally {
    rejectSaving.value = false
  }
}

loadRows()
</script>

<style scoped>
.verifications-view {
  width: 100%;
}

.verification-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.view-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-search {
  width: 320px;
  max-width: 100%;
}

.toolbar-filter {
  width: 210px;
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

.details-card {
  width: min(920px, 96vw);
}

.reject-dialog-card {
  width: min(560px, 96vw);
}

.details-section {
  display: grid;
  gap: 14px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  font-size: 14px;
  color: var(--san3a-gray-700);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.image-card {
  border: 1px solid var(--san3a-gray-200);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.image-label {
  padding: 8px 10px;
  border-bottom: 1px solid var(--san3a-gray-200);
  font-weight: 700;
  font-size: 12px;
  color: var(--san3a-gray-600);
}

.image-card img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
}

.image-empty {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--san3a-gray-500);
  font-size: 13px;
  background: var(--san3a-gray-50);
}

@media (max-width: 900px) {
  .details-grid {
    grid-template-columns: 1fr;
  }

  .images-grid {
    grid-template-columns: 1fr;
  }
}
</style>
