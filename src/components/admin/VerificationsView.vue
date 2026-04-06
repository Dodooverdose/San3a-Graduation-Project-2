<template>
  <div class="pending-approvals-view">
    <div class="verification-note q-mb-md">
      <q-icon name="info" size="16px" />
      <span
        >This page controls technician account verification only. It is separate from customer
        request/order acceptance.</span
      >
    </div>

    <div class="verification-summary q-mb-md">
      <q-chip color="primary" text-color="white" icon="groups">{{ totalTechnicians }} total</q-chip>
      <q-chip color="orange" text-color="white" icon="pending_actions"
        >{{ pendingCount }} pending</q-chip
      >
      <q-chip color="positive" text-color="white" icon="verified"
        >{{ approvedCount }} approved</q-chip
      >
    </div>

    <div class="view-toolbar q-mb-md">
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search pending technicians..."
        class="toolbar-search"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- No pending approvals message -->
    <div
      v-if="!loading && filteredTechnicians.length === 0"
      class="empty-state q-mt-lg text-center"
    >
      <q-icon name="check_circle" size="64px" class="q-mb-md" />
      <p>
        {{
          searchQuery ? 'No technicians match your search' : 'All technicians have been approved'
        }}
      </p>
    </div>

    <q-table
      v-else
      :rows="filteredTechnicians"
      :columns="columns"
      row-key="_id"
      :loading="loading"
      class="q-mt-md admin-table"
    >
      <template v-slot:body-cell-verified="props">
        <q-td :props="props">
          <q-badge
            :label="props.row._isApproved ? 'Approved' : 'Pending'"
            :color="props.row._isApproved ? 'green' : 'orange'"
          />
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            round
            icon="info"
            size="sm"
            @click="viewTechnician(props.row)"
            color="primary"
          />
          <q-btn
            flat
            dense
            round
            icon="check"
            size="sm"
            @click="approveTechnician(props.row)"
            color="positive"
            title="Approve"
          />
          <q-btn
            flat
            dense
            round
            icon="close"
            size="sm"
            @click="rejectTechnician(props.row)"
            color="negative"
            title="Reject"
          />
        </q-td>
      </template>
    </q-table>

    <!-- View Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card class="admin-dialog-card" style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Technician Details</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDetailsDialog = false" />
        </q-card-section>

        <q-card-section v-if="selectedTechnician">
          <div class="q-gutter-md">
            <div><strong>ID:</strong> {{ selectedTechnician._id }}</div>
            <div><strong>Name:</strong> {{ selectedTechnician._name }}</div>
            <div><strong>Email:</strong> {{ selectedTechnician._email }}</div>
            <div><strong>Phone:</strong> {{ selectedTechnician._phone }}</div>
            <div>
              <strong>Specialty:</strong> {{ selectedTechnician.specialty || 'Not specified' }}
            </div>
            <div>
              <strong>Status:</strong>
              <q-badge
                :label="selectedTechnician._isApproved ? 'Approved' : 'Pending'"
                :color="selectedTechnician._isApproved ? 'green' : 'orange'"
              />
            </div>
            <div>
              <strong>Registered:</strong> {{ formatDate(selectedTechnician.date_created) }}
            </div>
            <div v-if="selectedTechnician.rating">
              <strong>Rating:</strong> ⭐ {{ selectedTechnician.rating }}/5
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
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
  { name: 'id', label: 'ID', field: '_id', align: 'left' },
  { name: 'name', label: 'Name', field: '_name', align: 'left' },
  { name: 'email', label: 'Email', field: '_email', align: 'left' },
  { name: 'phone', label: 'Phone', field: '_phone', align: 'left' },
  { name: 'specialty', label: 'Specialty', field: 'specialty', align: 'left' },
  { name: 'verified', label: 'Status', field: 'verified', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const pendingTechnicians = ref([])
const allTechnicians = ref([])
const loading = ref(false)
const searchQuery = ref('')
const showDetailsDialog = ref(false)
const selectedTechnician = ref(null)

const normalizeText = (value) => (value === null || value === undefined ? '' : String(value))

const isApprovedTechnician = (technician) => {
  if (typeof technician.verified === 'boolean') return technician.verified
  if (typeof technician.is_verified === 'boolean') return technician.is_verified

  const status = normalizeText(
    technician.verification_status ?? technician.approval_status ?? technician.status,
  ).toLowerCase()

  if (!status) return false
  return ['approved', 'verified', 'active'].includes(status)
}

const normalizeTechnician = (technician) => ({
  ...technician,
  _id: technician.id ?? technician.technician_id ?? technician.user_id ?? null,
  _keyColumn:
    technician.id !== undefined && technician.id !== null
      ? 'id'
      : technician.technician_id !== undefined && technician.technician_id !== null
        ? 'technician_id'
        : 'id',
  _name: technician.full_name ?? technician.name ?? 'Unknown',
  _email: technician.email ?? '',
  _phone: technician.phone_number ?? technician.phone ?? '',
  _isApproved: isApprovedTechnician(technician),
  _verificationStatus: technician.verification_status ?? 'pending',
})

const filteredTechnicians = computed(() => {
  const query = searchQuery.value.toLowerCase()

  return pendingTechnicians.value.filter((tech) => {
    const matchesSearch =
      normalizeText(tech._name).toLowerCase().includes(query) ||
      normalizeText(tech._email).toLowerCase().includes(query)
    return matchesSearch && tech._verificationStatus !== 'rejected'
  })
})

const totalTechnicians = computed(() => allTechnicians.value.length)
const pendingCount = computed(
  () => allTechnicians.value.filter((tech) => tech._verificationStatus === 'pending').length,
)
const approvedCount = computed(() => allTechnicians.value.filter((tech) => tech._isApproved).length)

const loadPendingTechnicians = async () => {
  loading.value = true
  try {
    const [techniciansRes, verificationRes] = await Promise.all([
      supabase.from('technician').select('*'),
      supabase.from('technician_verification_state').select('*'),
    ])

    if (techniciansRes.error) throw techniciansRes.error
    if (verificationRes.error) throw verificationRes.error

    const verificationMap = new Map(
      (verificationRes.data || []).map((row) => [String(row.technician_id), row]),
    )

    const merged = (techniciansRes.data || []).map((technician) => {
      const state = verificationMap.get(String(technician.technician_id))
      return {
        ...technician,
        is_verified: state?.is_verified ?? technician.is_verified,
        verification_status: state?.verification_status ?? technician.verification_status,
        verified_at: state?.verified_at ?? technician.verified_at,
      }
    })

    const normalized = merged.map(normalizeTechnician)
    allTechnicians.value = normalized
    pendingTechnicians.value = normalized.filter((tech) => tech._verificationStatus === 'pending')
  } catch (error) {
    console.error('Error loading pending technicians:', error)
    $q.notify({
      type: 'negative',
      message: 'Error loading pending technicians',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const viewTechnician = (technician) => {
  selectedTechnician.value = technician
  showDetailsDialog.value = true
}

const approveTechnician = async (technician) => {
  try {
    const { error } = await supabase.from('technician_verification_state').upsert(
      {
        technician_id: technician._id,
        is_verified: true,
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
      },
      { onConflict: 'technician_id' },
    )

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: 'Technician approved successfully',
      position: 'top',
    })
    loadPendingTechnicians()
  } catch (error) {
    console.error('Error approving technician:', error)
    $q.notify({
      type: 'negative',
      message: 'Error approving technician',
      position: 'top',
    })
  }
}

const rejectTechnician = async (technician) => {
  try {
    await $q.dialog({
      title: 'Confirm',
      message: 'Are you sure you want to reject this technician? This action cannot be undone.',
      cancel: true,
      persistent: true,
    })

    const { error } = await supabase.from('technician_verification_state').upsert(
      {
        technician_id: technician._id,
        is_verified: false,
        verification_status: 'rejected',
        verified_at: null,
      },
      { onConflict: 'technician_id' },
    )

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: 'Technician rejected',
      position: 'top',
    })
    loadPendingTechnicians()
  } catch (error) {
    if (error.message !== 'Cancelled') {
      console.error('Error rejecting technician:', error)
      $q.notify({
        type: 'negative',
        message: 'Error rejecting technician',
        position: 'top',
      })
    }
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

loadPendingTechnicians()
</script>

<style scoped>
.pending-approvals-view {
  width: 100%;
}

.verification-note {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--san3a-gray-600);
  background: var(--san3a-primary-light);
  border: 1px solid #cfeaea;
  border-radius: 10px;
  padding: 10px 12px;
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

.empty-state {
  padding: 32px 16px;
  color: var(--san3a-gray-500);
  background: #fff;
  border: 1px dashed var(--san3a-gray-200);
  border-radius: 14px;
}

@media (max-width: 600px) {
  .toolbar-search {
    width: 100%;
  }
}
</style>
