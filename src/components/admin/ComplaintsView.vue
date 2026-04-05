<template>
  <div class="complaints-view">
    <div class="q-mb-md">
      <q-select
        v-model="filterStatus"
        :options="statusOptions"
        outlined
        dense
        label="Filter by Status"
        style="max-width: 250px"
      />
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search complaints..."
        class="q-ml-md"
        style="max-width: 300px"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-table
      :rows="filteredComplaints"
      :columns="columns"
      row-key="id"
      :loading="loading"
      class="q-mt-md"
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
            icon="info"
            size="sm"
            @click="viewComplaint(props.row)"
            color="primary"
          />
          <q-btn
            flat
            dense
            round
            icon="edit"
            size="sm"
            @click="editComplaint(props.row)"
            color="primary"
          />
          <q-btn
            flat
            dense
            round
            icon="delete"
            size="sm"
            @click="deleteComplaint(props.row.id)"
            color="negative"
          />
        </q-td>
      </template>
    </q-table>

    <!-- View Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Complaint Details</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDetailsDialog = false" />
        </q-card-section>

        <q-card-section v-if="selectedComplaint">
          <div class="q-gutter-md">
            <div><strong>ID:</strong> {{ selectedComplaint.id }}</div>
            <div><strong>Complainant:</strong> {{ selectedComplaint.complainant_name }}</div>
            <div><strong>Subject:</strong> {{ selectedComplaint.subject }}</div>
            <div><strong>Description:</strong> {{ selectedComplaint.description }}</div>
            <div>
              <strong>Status:</strong>
              <q-badge
                :label="selectedComplaint.status"
                :color="getStatusColor(selectedComplaint.status)"
              />
            </div>
            <div>
              <strong>Priority:</strong>
              <q-badge
                :label="selectedComplaint.priority"
                :color="getPriorityColor(selectedComplaint.priority)"
              />
            </div>
            <div><strong>Submitted:</strong> {{ formatDate(selectedComplaint.created_at) }}</div>
            <div v-if="selectedComplaint.resolution">
              <strong>Resolution:</strong> {{ selectedComplaint.resolution }}
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" @click="showDetailsDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Dialog -->
    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Edit Complaint</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showEditDialog = false" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveComplaint">
            <q-select
              v-model="formData.status"
              :options="statusOptions"
              outlined
              label="Status"
              class="q-mb-md"
            />
            <q-select
              v-model="formData.priority"
              :options="priorityOptions"
              outlined
              label="Priority"
              class="q-mb-md"
            />
            <q-input
              v-model="formData.resolution"
              label="Resolution"
              outlined
              class="q-mb-md"
              type="textarea"
            />
            <q-btn type="submit" color="primary" label="Save" class="q-mt-md full-width" />
          </q-form>
        </q-card-section>
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
  { name: 'complainant_name', label: 'Complainant', field: 'complainant_name', align: 'left' },
  { name: 'subject', label: 'Subject', field: 'subject', align: 'left' },
  { name: 'priority', label: 'Priority', field: 'priority', align: 'center' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const statusOptions = ['open', 'in-progress', 'resolved', 'closed']
const priorityOptions = ['low', 'medium', 'high', 'critical']

const complaints = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref(null)
const showDetailsDialog = ref(false)
const showEditDialog = ref(false)
const selectedComplaint = ref(null)
const editingId = ref(null)

const formData = ref({
  status: '',
  priority: '',
  resolution: '',
})

const normalizeText = (value) => (value === null || value === undefined ? '' : String(value))

const filteredComplaints = computed(() => {
  const query = searchQuery.value.toLowerCase()

  return complaints.value.filter((comp) => {
    const matchesSearch =
      normalizeText(comp.complainant_name).toLowerCase().includes(query) ||
      normalizeText(comp.subject).toLowerCase().includes(query)

    const matchesStatus = !filterStatus.value || comp.status === filterStatus.value

    return matchesSearch && matchesStatus
  })
})

const loadComplaints = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('complaint')
      .select('*')

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

const viewComplaint = (complaint) => {
  selectedComplaint.value = complaint
  showDetailsDialog.value = true
}

const editComplaint = (complaint) => {
  editingId.value = complaint.id
  formData.value = {
    status: complaint.status,
    priority: complaint.priority,
    resolution: complaint.resolution || '',
  }
  showEditDialog.value = true
}

const saveComplaint = async () => {
  try {
    const { error } = await supabase
      .from('complaint')
      .update(formData.value)
      .eq('id', editingId.value)

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: 'Complaint updated successfully',
      position: 'top',
    })
    showEditDialog.value = false
    loadComplaints()
  } catch (error) {
    console.error('Error saving complaint:', error)
    $q.notify({
      type: 'negative',
      message: 'Error saving complaint',
      position: 'top',
    })
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

    const { error } = await supabase.from('complaint').delete().eq('id', id)

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
  }
  return colors[status] || 'grey'
}

const getPriorityColor = (priority) => {
  const colors = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    critical: 'dark-red',
  }
  return colors[priority] || 'grey'
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

loadComplaints()
</script>

<style scoped>
.complaints-view {
  width: 100%;
}
</style>
