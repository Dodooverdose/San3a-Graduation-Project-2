<template>
  <div class="customers-view">
    <div class="view-toolbar q-mb-md">
      <q-btn
        color="primary"
        label="Add User"
        icon="add"
        class="toolbar-btn"
        @click="showAddDialog = true"
      />
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search users..."
        class="toolbar-search"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-table
      :rows="filteredCustomers"
      :columns="columns"
      row-key="_id"
      :loading="loading"
      :pagination="tablePagination"
      :rows-per-page-options="[0]"
      class="q-mt-md admin-table"
    >
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            round
            icon="info"
            size="sm"
            @click="viewCustomer(props.row)"
            color="primary"
          />
          <q-btn
            flat
            dense
            round
            icon="delete"
            size="sm"
            @click="deleteCustomer(props.row)"
            color="negative"
          />
        </q-td>
      </template>
    </q-table>

    <!-- View Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card class="admin-dialog-card" style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">User Details</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDetailsDialog = false" />
        </q-card-section>

        <q-card-section v-if="selectedCustomer">
          <div class="q-gutter-md">
            <div><strong>ID:</strong> {{ selectedCustomer._id }}</div>
            <div><strong>Name:</strong> {{ selectedCustomer._name }}</div>
            <div><strong>Email:</strong> {{ selectedCustomer._email }}</div>
            <div><strong>Phone:</strong> {{ selectedCustomer._phone }}</div>
            <div><strong>Address:</strong> {{ selectedCustomer.address || '-' }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" @click="showDetailsDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showAddDialog">
      <q-card class="admin-dialog-card" style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editingId ? 'Edit' : 'Add' }} User</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showAddDialog = false" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveCustomer">
            <q-input
              v-model="formData.name"
              label="Full Name"
              outlined
              class="q-mb-md"
              :rules="[(val) => (val && val.length > 0) || 'Name is required']"
            />
            <q-input
              v-model="formData.email"
              label="Email"
              outlined
              class="q-mb-md"
              type="email"
              :rules="[(val) => (val && val.length > 0) || 'Email is required']"
            />
            <q-input
              v-model="formData.phone"
              label="Phone"
              outlined
              class="q-mb-md"
              :rules="[(val) => (val && val.length > 0) || 'Phone is required']"
            />
            <q-input
              v-model="formData.address"
              label="Address"
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
  { name: 'id', label: 'ID', field: '_id', align: 'left' },
  { name: 'name', label: 'Name', field: '_name', align: 'left' },
  { name: 'email', label: 'Email', field: '_email', align: 'left' },
  { name: 'phone', label: 'Phone', field: '_phone', align: 'left' },
  { name: 'address', label: 'Address', field: 'address', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const users = ref([])
const loading = ref(false)
const tablePagination = ref({ rowsPerPage: 0 })
const searchQuery = ref('')
const showAddDialog = ref(false)
const showDetailsDialog = ref(false)
const selectedCustomer = ref(null)
const editingId = ref(null)
const editingKeyColumn = ref('user_id')

const formData = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
})

const normalizeText = (value) => (value === null || value === undefined ? '' : String(value))

const normalizeCustomer = (customer) => ({
  ...customer,
  _id: customer.id ?? customer.user_id ?? null,
  _keyColumn:
    customer.id !== undefined && customer.id !== null
      ? 'id'
      : customer.user_id !== undefined && customer.user_id !== null
        ? 'user_id'
        : 'user_id',
  _name: customer.name ?? customer.full_name ?? 'Unknown',
  _email: customer.email ?? '',
  _phone: customer.phone ?? customer.phone_number ?? '',
})

const filteredCustomers = computed(() => {
  const query = searchQuery.value.toLowerCase()

  return users.value.filter(
    (cust) =>
      normalizeText(cust._name).toLowerCase().includes(query) ||
      normalizeText(cust._email).toLowerCase().includes(query),
  )
})

const loadCustomers = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase.from('users').select('*')

    if (error) throw error
    users.value = (data || []).map(normalizeCustomer)
  } catch (error) {
    console.error('Error loading customers:', error)
    $q.notify({
      type: 'negative',
      message: 'Error loading customers',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const saveCustomer = async () => {
  try {
    const payload = {
      full_name: formData.value.name,
      email: formData.value.email,
      phone_number: formData.value.phone,
      address: formData.value.address || null,
    }

    if (editingId.value) {
      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq(editingKeyColumn.value, editingId.value)

      if (error) throw error
      $q.notify({
        type: 'positive',
        message: 'User updated successfully',
        position: 'top',
      })
    } else {
      const { error } = await supabase.from('users').insert([payload])

      if (error) throw error
      $q.notify({
        type: 'positive',
        message: 'User added successfully',
        position: 'top',
      })
    }
    showAddDialog.value = false
    resetForm()
    loadCustomers()
  } catch (error) {
    console.error('Error saving user:', error)
    $q.notify({
      type: 'negative',
      message: 'Error saving user',
      position: 'top',
    })
  }
}

const viewCustomer = (customer) => {
  selectedCustomer.value = customer
  showDetailsDialog.value = true
}

const deleteCustomer = async (customer) => {
  try {
    const confirmed = window.confirm('Are you sure you want to delete this user?')
    if (!confirmed) return

    const { error } = await supabase
      .from('users')
      .delete()
      .eq(customer?._keyColumn || 'user_id', customer?._id)

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: 'User deleted successfully',
      position: 'top',
    })
    loadCustomers()
  } catch (error) {
    console.error('Error deleting user:', error)
    $q.notify({
      type: 'negative',
      message: error?.message || 'Error deleting user',
      position: 'top',
    })
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
  }
  editingId.value = null
  editingKeyColumn.value = 'user_id'
}

loadCustomers()
</script>

<style scoped>
.customers-view {
  width: 100%;
}

.view-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-btn {
  font-weight: 700;
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
  .toolbar-search {
    width: 100%;
  }
}
</style>

<!-- Component name: CustomersView (uses users table) -->
