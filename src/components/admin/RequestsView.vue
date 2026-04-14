<template>
  <div class="requests-view">
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
        placeholder="Search requests..."
        class="toolbar-search"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-table
      :rows="filteredRequests"
      :columns="columns"
      row-key="_id"
      :loading="loading"
      :pagination="tablePagination"
      :rows-per-page-options="[0]"
      class="q-mt-md admin-table"
    >
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge :label="props.row._status" :color="getStatusColor(props.row._status)" />
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
            @click="deleteRequest(props.row)"
            color="negative"
          />
        </q-td>
      </template>
    </q-table>

    <!-- View Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card class="admin-dialog-card" style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Request Details</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDetailsDialog = false" />
        </q-card-section>

        <q-card-section v-if="selectedRequest">
          <div class="q-gutter-md">
            <div><strong>ID:</strong> {{ selectedRequest._id }}</div>
            <div><strong>Customer:</strong> {{ selectedRequest._customer_name }}</div>
            <div><strong>Category:</strong> {{ selectedRequest._category }}</div>
            <div><strong>Description:</strong> {{ selectedRequest._description }}</div>
            <div>
              <strong>Status:</strong>
              <q-badge
                :label="selectedRequest._status"
                :color="getStatusColor(selectedRequest._status)"
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
      <q-card class="admin-dialog-card" style="min-width: 400px">
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
  { name: 'id', label: 'ID', field: '_id', align: 'left' },
  { name: 'customer_name', label: 'Customer', field: '_customer_name', align: 'left' },
  { name: 'category', label: 'Category', field: '_category', align: 'left' },
  { name: 'description', label: 'Description', field: '_description', align: 'left' },
  { name: 'status', label: 'Request Status', field: '_status', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const statusOptions = ['pending', 'assigned', 'in-progress', 'completed', 'cancelled']

const serviceTypeLabels = {
  plumber: 'Plumbing',
  carpenter: 'Carpentry',
  electrician: 'Electrical',
  kitchen_fitter: 'Kitchen Utilities',
  painter: 'Painting',
  drapery_seamstress: 'Drapery Seamstress',
}

const requests = ref([])
const loading = ref(false)
const tablePagination = ref({ rowsPerPage: 0 })
const searchQuery = ref('')
const filterStatus = ref(null)
const showDetailsDialog = ref(false)
const showEditDialog = ref(false)
const selectedRequest = ref(null)
const editingId = ref(null)
const editingKeyColumn = ref('id')

const formData = ref({
  status: '',
  fixer_price: null,
  customer_price: null,
  final_price: null,
})

const normalizeText = (value) => (value === null || value === undefined ? '' : String(value))

const normalizeRequest = (request) => ({
  ...request,
  _id: request.id ?? request.request_id ?? request.uuid ?? null,
  _keyColumn:
    request.id !== undefined && request.id !== null
      ? 'id'
      : request.request_id !== undefined && request.request_id !== null
        ? 'request_id'
        : 'id',
  _customer_name:
    request.users?.full_name ??
    request.customer_name ??
    request.full_name ??
    request.customer_full_name ??
    request.user_name ??
    'Unknown',
  _category:
    serviceTypeLabels[request.service_type] ??
    request.category ??
    request.service_category ??
    request.request_category ??
    request.specialty ??
    'Unspecified',
  _description: request.description ?? request.description_of_issue ?? '',
  _status: request.request_status ?? request.status ?? 'pending',
})

const filteredRequests = computed(() => {
  const query = searchQuery.value.toLowerCase()

  return requests.value.filter((req) => {
    const matchesSearch =
      normalizeText(req._customer_name).toLowerCase().includes(query) ||
      normalizeText(req._category).toLowerCase().includes(query) ||
      normalizeText(req._description).toLowerCase().includes(query)

    const matchesStatus = !filterStatus.value || normalizeText(req._status) === filterStatus.value

    return matchesSearch && matchesStatus
  })
})

const loadRequests = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('request')
      .select('*, users:user_id(full_name, email)')

    if (error) throw error
    requests.value = (data || []).map(normalizeRequest)
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
  editingId.value = request._id
  editingKeyColumn.value = request._keyColumn || 'id'
  formData.value = {
    status: request._status,
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
      .eq(editingKeyColumn.value, editingId.value)

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

const deleteRequest = async (request) => {
  try {
    await $q.dialog({
      title: 'Confirm',
      message: 'Are you sure you want to delete this request?',
      cancel: true,
      persistent: true,
    })

    const { error } = await supabase
      .from('request')
      .delete()
      .eq(request._keyColumn || 'id', request._id)

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
    'on-going': 'purple',
    completed: 'green',
    cancelled: 'red',
  }
  return colors[status] || 'grey'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

loadRequests()
</script>

<style scoped>
.requests-view {
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
