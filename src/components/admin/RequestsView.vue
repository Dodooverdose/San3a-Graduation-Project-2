<template>
  <div class="requests-view">
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
        placeholder="Search requests..."
        class="q-ml-md"
        style="max-width: 300px"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-table
      :rows="filteredRequests"
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
            @click="viewRequest(props.row)"
            color="primary"
          />
          <q-btn
            flat
            dense
            round
            icon="edit"
            size="sm"
            @click="editRequest(props.row)"
            color="primary"
          />
          <q-btn
            flat
            dense
            round
            icon="delete"
            size="sm"
            @click="deleteRequest(props.row.id)"
            color="negative"
          />
        </q-td>
      </template>
    </q-table>

    <!-- View Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Request Details</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDetailsDialog = false" />
        </q-card-section>

        <q-card-section v-if="selectedRequest">
          <div class="q-gutter-md">
            <div><strong>ID:</strong> {{ selectedRequest.id }}</div>
            <div><strong>Customer:</strong> {{ selectedRequest.customer_name }}</div>
            <div><strong>Category:</strong> {{ selectedRequest.category }}</div>
            <div><strong>Description:</strong> {{ selectedRequest.description }}</div>
            <div>
              <strong>Status:</strong>
              <q-badge
                :label="selectedRequest.status"
                :color="getStatusColor(selectedRequest.status)"
              />
            </div>
            <div v-if="selectedRequest.fixer_price">
              <strong>Technician Price:</strong> {{ selectedRequest.fixer_price }}
            </div>
            <div v-if="selectedRequest.customer_price">
              <strong>Customer Price:</strong> {{ selectedRequest.customer_price }}
            </div>
            <div v-if="selectedRequest.final_price">
              <strong>Final Price:</strong> {{ selectedRequest.final_price }}
            </div>
            <div><strong>Created:</strong> {{ formatDate(selectedRequest.created_at) }}</div>
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
          <div class="text-h6">Edit Request</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showEditDialog = false" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveRequest">
            <q-select
              v-model="formData.status"
              :options="statusOptions"
              outlined
              label="Status"
              class="q-mb-md"
            />
            <q-input
              v-model="formData.fixer_price"
              label="Technician Price"
              outlined
              class="q-mb-md"
              type="number"
            />
            <q-input
              v-model="formData.customer_price"
              label="Customer Price"
              outlined
              class="q-mb-md"
              type="number"
            />
            <q-input
              v-model="formData.final_price"
              label="Final Price"
              outlined
              class="q-mb-md"
              type="number"
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
  { name: 'customer_name', label: 'Customer', field: 'customer_name', align: 'left' },
  { name: 'category', label: 'Category', field: 'category', align: 'left' },
  { name: 'description', label: 'Description', field: 'description', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const statusOptions = ['pending', 'assigned', 'in-progress', 'completed', 'cancelled']

const requests = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref(null)
const showDetailsDialog = ref(false)
const showEditDialog = ref(false)
const selectedRequest = ref(null)
const editingId = ref(null)

const formData = ref({
  status: '',
  fixer_price: null,
  customer_price: null,
  final_price: null,
})

const filteredRequests = computed(() => {
  return requests.value.filter((req) => {
    const matchesSearch =
      req.customer_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      req.category.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesStatus = !filterStatus.value || req.status === filterStatus.value

    return matchesSearch && matchesStatus
  })
})

const loadRequests = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('request')
      .select('*')

    if (error) throw error
    requests.value = data || []
  } catch (error) {
    console.error('Error loading requests:', error)
    $q.notify({
      type: 'negative',
      message: 'Error loading requests',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const viewRequest = (request) => {
  selectedRequest.value = request
  showDetailsDialog.value = true
}

const editRequest = (request) => {
  editingId.value = request.id
  formData.value = {
    status: request.status,
    fixer_price: request.fixer_price,
    customer_price: request.customer_price,
    final_price: request.final_price,
  }
  showEditDialog.value = true
}

const saveRequest = async () => {
  try {
    const { error } = await supabase
      .from('request')
      .update(formData.value)
      .eq('id', editingId.value)

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: 'Request updated successfully',
      position: 'top',
    })
    showEditDialog.value = false
    loadRequests()
  } catch (error) {
    console.error('Error saving request:', error)
    $q.notify({
      type: 'negative',
      message: 'Error saving request',
      position: 'top',
    })
  }
}

const deleteRequest = async (id) => {
  try {
    await $q.dialog({
      title: 'Confirm',
      message: 'Are you sure you want to delete this request?',
      cancel: true,
      persistent: true,
    })

    const { error } = await supabase.from('request').delete().eq('id', id)

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: 'Request deleted successfully',
      position: 'top',
    })
    loadRequests()
  } catch (error) {
    if (error.message !== 'Cancelled') {
      console.error('Error deleting request:', error)
      $q.notify({
        type: 'negative',
        message: 'Error deleting request',
        position: 'top',
      })
    }
  }
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    assigned: 'blue',
    'in-progress': 'purple',
    completed: 'green',
    cancelled: 'red',
  }
  return colors[status] || 'grey'
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

loadRequests()
</script>

<style scoped>
.requests-view {
  width: 100%;
}
</style>
