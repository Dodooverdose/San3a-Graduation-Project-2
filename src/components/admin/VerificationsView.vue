<template>
  <div class="pending-approvals-view">
    <div class="q-mb-md">
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search pending technicians..."
        class="q-ml-md"
        style="max-width: 300px"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- No pending approvals message -->
    <div v-if="!loading && pendingTechnicians.length === 0" class="q-mt-lg text-center text-grey">
      <q-icon name="check_circle" size="64px" class="q-mb-md" />
      <p>All technicians have been approved</p>
    </div>

    <q-table
      v-else
      :rows="filteredTechnicians"
      :columns="columns"
      row-key="_id"
      :loading="loading"
      class="q-mt-md"
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
      <q-card style="min-width: 500px">
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
            <div><strong>Registered:</strong> {{ formatDate(selectedTechnician.created_at) }}</div>
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
  _name: technician.name ?? technician.full_name ?? 'Unknown',
  _email: technician.email ?? '',
  _phone: technician.phone ?? technician.phone_number ?? '',
  _isApproved: isApprovedTechnician(technician),
})

const filteredTechnicians = computed(() => {
  const query = searchQuery.value.toLowerCase()

  return pendingTechnicians.value.filter(
    (tech) =>
      normalizeText(tech._name).toLowerCase().includes(query) ||
      normalizeText(tech._email).toLowerCase().includes(query),
  )
})

const loadPendingTechnicians = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('technician')
      .select('*')

    if (error) throw error
    const normalized = (data || []).map(normalizeTechnician)
    pendingTechnicians.value = normalized.filter((tech) => !tech._isApproved)
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
    const updatePayload = {
      updated_at: new Date().toISOString(),
    }

    if ('verified' in technician) {
      updatePayload.verified = true
    } else if ('is_verified' in technician) {
      updatePayload.is_verified = true
    } else if ('verification_status' in technician) {
      updatePayload.verification_status = 'approved'
    } else if ('approval_status' in technician) {
      updatePayload.approval_status = 'approved'
    } else if ('status' in technician) {
      updatePayload.status = 'approved'
    }

    const { error } = await supabase
      .from('technician')
      .update(updatePayload)
      .eq(technician._keyColumn || 'id', technician._id)

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

    const { error } = await supabase
      .from('technician')
      .delete()
      .eq(technician._keyColumn || 'id', technician._id)

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: 'Technician rejected and removed',
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
</style>
