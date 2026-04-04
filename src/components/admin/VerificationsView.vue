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
      row-key="id"
      :loading="loading"
      class="q-mt-md"
    >
      <template v-slot:body-cell-verified="props">
        <q-td :props="props">
          <q-badge
            :label="props.row.verified ? 'Approved' : 'Pending'"
            :color="props.row.verified ? 'green' : 'orange'"
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
            @click="approveTechnician(props.row.id)"
            color="positive"
            title="Approve"
          />
          <q-btn
            flat
            dense
            round
            icon="close"
            size="sm"
            @click="rejectTechnician(props.row.id)"
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
            <div><strong>ID:</strong> {{ selectedTechnician.id }}</div>
            <div><strong>Name:</strong> {{ selectedTechnician.name }}</div>
            <div><strong>Email:</strong> {{ selectedTechnician.email }}</div>
            <div><strong>Phone:</strong> {{ selectedTechnician.phone }}</div>
            <div>
              <strong>Specialty:</strong> {{ selectedTechnician.specialty || 'Not specified' }}
            </div>
            <div>
              <strong>Status:</strong>
              <q-badge
                :label="selectedTechnician.verified ? 'Approved' : 'Pending'"
                :color="selectedTechnician.verified ? 'green' : 'orange'"
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
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'phone', label: 'Phone', field: 'phone', align: 'left' },
  { name: 'specialty', label: 'Specialty', field: 'specialty', align: 'left' },
  { name: 'verified', label: 'Status', field: 'verified', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const pendingTechnicians = ref([])
const loading = ref(false)
const searchQuery = ref('')
const showDetailsDialog = ref(false)
const selectedTechnician = ref(null)

const filteredTechnicians = computed(() => {
  return pendingTechnicians.value.filter(
    (tech) =>
      tech.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const loadPendingTechnicians = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('technician')
      .select('*')
      .eq('verified', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    pendingTechnicians.value = data || []
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

const approveTechnician = async (id) => {
  try {
    const { error } = await supabase
      .from('technician')
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq('id', id)

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

const rejectTechnician = async (id) => {
  try {
    await $q.dialog({
      title: 'Confirm',
      message: 'Are you sure you want to reject this technician? This action cannot be undone.',
      cancel: true,
      persistent: true,
    })

    const { error } = await supabase.from('technician').delete().eq('id', id)

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
