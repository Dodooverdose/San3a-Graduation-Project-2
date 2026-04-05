<template>
  <div class="technicians-view">
    <div class="q-mb-md">
      <q-btn color="primary" label="Add Technician" icon="add" @click="showAddDialog = true" />
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search technicians..."
        class="q-ml-md"
        style="max-width: 300px"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-table
      :rows="filteredTechnicians"
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
            @click="editTechnician(props.row)"
            color="primary"
          />
          <q-btn
            flat
            dense
            round
            icon="delete"
            size="sm"
            @click="deleteTechnician(props.row.id)"
            color="negative"
          />
          <q-btn
            flat
            dense
            round
            :icon="props.row.verified ? 'verified' : 'pending'"
            size="sm"
            @click="toggleVerification(props.row)"
            :color="props.row.verified ? 'positive' : 'warning'"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editingId ? 'Edit' : 'Add' }} Technician</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showAddDialog = false" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveTechnician">
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
            <q-input v-model="formData.specialty" label="Specialty" outlined class="q-mb-md" />
            <q-checkbox v-model="formData.verified" label="Verified" />
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
  { name: 'specialty', label: 'Specialty', field: 'specialty', align: 'left' },
  { name: 'verified', label: 'Status', field: 'verified', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
]

const technicians = ref([])
const loading = ref(false)
const searchQuery = ref('')
const showAddDialog = ref(false)
const editingId = ref(null)

const formData = ref({
  name: '',
  email: '',
  phone: '',
  specialty: '',
  verified: false,
})

const normalizeText = (value) => (value === null || value === undefined ? '' : String(value))

const normalizeTechnician = (technician) => ({
  ...technician,
  _id: technician.id ?? technician.technician_id ?? technician.user_id ?? null,
  _name: technician.name ?? technician.full_name ?? 'Unknown',
  _email: technician.email ?? '',
  _phone: technician.phone ?? technician.phone_number ?? '',
})

const filteredTechnicians = computed(() => {
  const query = searchQuery.value.toLowerCase()

  return technicians.value.filter(
    (tech) =>
      normalizeText(tech._name).toLowerCase().includes(query) ||
      normalizeText(tech._email).toLowerCase().includes(query),
  )
})

const loadTechnicians = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('technician')
      .select('*')

    if (error) throw error
    technicians.value = (data || []).map(normalizeTechnician)
  } catch (error) {
    console.error('Error loading technicians:', error)
    $q.notify({
      type: 'negative',
      message: 'Error loading technicians',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const saveTechnician = async () => {
  try {
    if (editingId.value) {
      const { error } = await supabase
        .from('technician')
        .update(formData.value)
        .eq('id', editingId.value)

      if (error) throw error
      $q.notify({
        type: 'positive',
        message: 'Technician updated successfully',
        position: 'top',
      })
    } else {
      const { error } = await supabase.from('technician').insert([formData.value])

      if (error) throw error
      $q.notify({
        type: 'positive',
        message: 'Technician added successfully',
        position: 'top',
      })
    }
    showAddDialog.value = false
    resetForm()
    loadTechnicians()
  } catch (error) {
    console.error('Error saving technician:', error)
    $q.notify({
      type: 'negative',
      message: 'Error saving technician',
      position: 'top',
    })
  }
}

const editTechnician = (technician) => {
  editingId.value = technician.id
  formData.value = { ...technician }
  showAddDialog.value = true
}

const deleteTechnician = async (id) => {
  try {
    await $q.dialog({
      title: 'Confirm',
      message: 'Are you sure you want to delete this technician?',
      cancel: true,
      persistent: true,
    })

    const { error } = await supabase.from('technician').delete().eq('id', id)

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: 'Technician deleted successfully',
      position: 'top',
    })
    loadTechnicians()
  } catch (error) {
    if (error.message !== 'Cancelled') {
      console.error('Error deleting technician:', error)
      $q.notify({
        type: 'negative',
        message: 'Error deleting technician',
        position: 'top',
      })
    }
  }
}

const toggleVerification = async (technician) => {
  try {
    const { error } = await supabase
      .from('technician')

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: technician.verified ? 'Technician unverified' : 'Technician verified',
      position: 'top',
    })
    loadTechnicians()
  } catch (error) {
    console.error('Error updating verification:', error)
    $q.notify({
      type: 'negative',
      message: 'Error updating verification',
      position: 'top',
    })
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    email: '',
    phone: '',
    specialty: '',
    verified: false,
  }
  editingId.value = null
}

loadTechnicians()
</script>

<style scoped>
.technicians-view {
  width: 100%;
}
</style>
