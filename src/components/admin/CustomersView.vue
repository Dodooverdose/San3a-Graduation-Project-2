<template>
  <div class="customers-view">
    <div class="q-mb-md">
      <q-btn color="primary" label="Add User" icon="add" @click="showAddDialog = true" />
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search users..."
        class="q-ml-md"
        style="max-width: 300px"
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
      class="q-mt-md"
    >
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            round
            icon="edit"
            size="sm"
            @click="editCustomer(props.row)"
            color="primary"
          />
          <q-btn
            flat
            dense
            round
            icon="delete"
            size="sm"
            @click="deleteCustomer(props.row.id)"
            color="negative"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 400px">
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
const searchQuery = ref('')
const showAddDialog = ref(false)
const editingId = ref(null)

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
    const { data, error } = await supabase
      .from('users')
      .select('*')

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
    if (editingId.value) {
      const { error } = await supabase
        .from('users')
        .update(formData.value)
        .eq('id', editingId.value)

      if (error) throw error
      $q.notify({
        type: 'positive',
        message: 'User updated successfully',
        position: 'top',
      })
    } else {
      const { error } = await supabase.from('users').insert([formData.value])

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

const editCustomer = (customer) => {
  editingId.value = customer.id
  formData.value = { ...customer }
  showAddDialog.value = true
}

const deleteCustomer = async (id) => {
  try {
    await $q.dialog({
      title: 'Confirm',
      message: 'Are you sure you want to delete this user?',
      cancel: true,
      persistent: true,
    })

    const { error } = await supabase.from('users').delete().eq('id', id)

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: 'User deleted successfully',
      position: 'top',
    })
    loadCustomers()
  } catch (error) {
    if (error.message !== 'Cancelled') {
      console.error('Error deleting user:', error)
      $q.notify({
        type: 'negative',
        message: 'Error deleting user',
        position: 'top',
      })
    }
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
}

loadCustomers()
</script>

<style scoped>
.customers-view {
  width: 100%;
}
</style>

<!-- Component name: CustomersView (uses users table) -->
