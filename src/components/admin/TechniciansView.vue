<template>
  <div class="technicians-view">
    <div class="view-toolbar q-mb-md">
      <q-btn
        color="primary"
        :label="$t('admin.addTechnician')"
        icon="add"
        class="toolbar-btn"
        @click="showAddDialog = true"
      />
      <q-input
        v-model="searchQuery"
        outlined
        dense
        :placeholder="$t('admin.searchTechnicians')"
        class="toolbar-search"
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
      :pagination="tablePagination"
      :rows-per-page-options="[0]"
      class="q-mt-md admin-table"
    >
      <template v-slot:body-cell-verified="props">
        <q-td :props="props">
          <q-badge
            :label="
              props.row._isApproved ? $t('common.approved') : $t('admin.pendingVerificationBadge')
            "
            :color="props.row._isApproved ? 'positive' : 'warning'"
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
            icon="delete"
            size="sm"
            @click="deleteTechnician(props.row)"
            color="negative"
          />
          <q-btn
            flat
            dense
            round
            :icon="props.row._isApproved ? 'person_off' : 'verified_user'"
            size="sm"
            @click="toggleVerification(props.row)"
            :color="props.row._isApproved ? 'negative' : 'warning'"
            :title="
              props.row._isApproved ? $t('admin.setAsPending') : $t('admin.approveTechAccount')
            "
          />
        </q-td>
      </template>
    </q-table>

    <!-- View Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card class="admin-dialog-card" style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ $t('admin.technicianDetails') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDetailsDialog = false" />
        </q-card-section>

        <q-card-section v-if="selectedTechnician">
          <div class="q-gutter-md">
            <div>
              <strong>{{ $t('admin.colId') }}:</strong> {{ selectedTechnician._id }}
            </div>
            <div>
              <strong>{{ $t('admin.colName') }}:</strong> {{ selectedTechnician._name }}
            </div>
            <div>
              <strong>{{ $t('common.email') }}:</strong> {{ selectedTechnician._email }}
            </div>
            <div>
              <strong>{{ $t('common.phone') }}:</strong> {{ selectedTechnician._phone }}
            </div>
            <div>
              <strong>{{ $t('admin.colSpecialty') }}:</strong>
              {{ selectedTechnician.specialty || '-' }}
            </div>
            <div>
              <strong>{{ $t('admin.status') }}:</strong>
              <q-badge
                :label="
                  selectedTechnician._isApproved
                    ? $t('common.approved')
                    : $t('admin.pendingVerificationBadge')
                "
                :color="selectedTechnician._isApproved ? 'positive' : 'warning'"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('common.close')"
            color="primary"
            @click="showDetailsDialog = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showAddDialog">
      <q-card class="admin-dialog-card" style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editingId ? $t('common.save') : $t('admin.addTechnician') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showAddDialog = false" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveTechnician">
            <q-input
              v-model="formData.full_name"
              :label="$t('admin.colName')"
              outlined
              class="q-mb-md"
              :rules="[(val) => (val && val.length > 0) || $t('admin.nameRequired')]"
            />
            <q-input
              v-model="formData.email"
              :label="$t('common.email')"
              outlined
              class="q-mb-md"
              type="email"
              :rules="[(val) => (val && val.length > 0) || $t('admin.emailRequired')]"
            />
            <q-input
              v-model="formData.phone_number"
              :label="$t('common.phone')"
              outlined
              class="q-mb-md"
              :rules="[(val) => (val && val.length > 0) || $t('admin.phoneRequired')]"
            />
            <q-input
              v-model="formData.specialty"
              :label="$t('admin.colSpecialty')"
              outlined
              class="q-mb-md"
            />
            <q-checkbox v-model="formData.verified" :label="$t('common.verified')" />
            <q-btn
              type="submit"
              color="primary"
              :label="$t('common.save')"
              class="q-mt-md full-width"
            />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { supabase } from 'src/boot/supabase'

const $q = useQuasar()
const { t } = useI18n()

const columns = [
  { name: 'id', label: t('admin.colId'), field: '_id', align: 'left' },
  { name: 'name', label: t('admin.colName'), field: '_name', align: 'left' },
  { name: 'email', label: t('common.email'), field: '_email', align: 'left' },
  { name: 'phone', label: t('common.phone'), field: '_phone', align: 'left' },
  { name: 'specialty', label: t('admin.colSpecialty'), field: 'specialty', align: 'left' },
  { name: 'verified', label: t('admin.status'), field: 'verified', align: 'center' },
  { name: 'actions', label: t('admin.colActions'), field: 'actions', align: 'center' },
]

const technicians = ref([])
const verificationStateMap = ref(new Map())
const loading = ref(false)
const tablePagination = ref({ rowsPerPage: 0 })
const searchQuery = ref('')
const showAddDialog = ref(false)
const showDetailsDialog = ref(false)
const selectedTechnician = ref(null)
const editingId = ref(null)
const editingKeyColumn = ref('id')

const formData = ref({
  full_name: '',
  email: '',
  phone_number: '',
  specialty: '',
  is_verified: false,
})

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

const normalizeTechnician = (technician, verificationState = null) => ({
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
  _isApproved: verificationState
    ? verificationState.is_verified === true
    : isApprovedTechnician(technician),
  _verificationStatus:
    verificationState?.verification_status ?? technician.verification_status ?? null,
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
    const [techniciansRes, verificationRes] = await Promise.all([
      supabase.from('technician').select('*'),
      supabase.from('technician_verification_state').select('*'),
    ])

    if (techniciansRes.error) throw techniciansRes.error
    if (verificationRes.error) throw verificationRes.error

    verificationStateMap.value = new Map(
      (verificationRes.data || []).map((row) => [String(row.technician_id), row]),
    )

    technicians.value = (techniciansRes.data || []).map((tech) =>
      normalizeTechnician(tech, verificationStateMap.value.get(String(tech.technician_id)) || null),
    )
  } catch (error) {
    console.error('Error loading technicians:', error)
    $q.notify({
      type: 'negative',
      message: t('admin.errorLoadingTech'),
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

const saveTechnician = async () => {
  try {
    const payload = {
      full_name: formData.value.full_name,
      email: formData.value.email,
      phone_number: formData.value.phone_number,
      specialty: formData.value.specialty,
    }

    if (editingId.value) {
      const { data: updatedTechnician, error } = await supabase
        .from('technician')
        .update(payload)
        .eq(editingKeyColumn.value, editingId.value)
        .select('technician_id')
        .maybeSingle()

      if (error) throw error

      const technicianId = updatedTechnician?.technician_id ?? editingId.value
      const { error: stateError } = await supabase.from('technician_verification_state').upsert(
        {
          technician_id: technicianId,
          is_verified: Boolean(formData.value.is_verified),
          verification_status: formData.value.is_verified ? 'approved' : 'pending',
          verified_at: formData.value.is_verified ? new Date().toISOString() : null,
        },
        { onConflict: 'technician_id' },
      )

      if (stateError) throw stateError
      $q.notify({
        type: 'positive',
        message: t('admin.techUpdated'),
        position: 'top',
      })
    } else {
      const { data: insertedTechnician, error } = await supabase
        .from('technician')
        .insert([payload])
        .select('technician_id')
        .single()

      if (error) throw error

      const technicianId = insertedTechnician?.technician_id
      if (technicianId !== undefined && technicianId !== null) {
        const { error: stateError } = await supabase.from('technician_verification_state').upsert(
          {
            technician_id: technicianId,
            is_verified: Boolean(formData.value.is_verified),
            verification_status: formData.value.is_verified ? 'approved' : 'pending',
            verified_at: formData.value.is_verified ? new Date().toISOString() : null,
          },
          { onConflict: 'technician_id' },
        )
        if (stateError) throw stateError
      }
      $q.notify({
        type: 'positive',
        message: t('admin.techAdded'),
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
      message: t('admin.errorSavingTech'),
      position: 'top',
    })
  }
}

const viewTechnician = (technician) => {
  selectedTechnician.value = technician
  showDetailsDialog.value = true
}

const deleteTechnician = async (technician) => {
  try {
    await $q.dialog({
      title: t('common.confirm'),
      message: t('admin.deleteTechConfirm'),
      cancel: true,
      persistent: true,
    })

    const { error } = await supabase
      .from('technician')
      .delete()
      .eq(technician._keyColumn || 'id', technician._id)

    if (error) throw error

    await supabase
      .from('technician_verification_state')
      .delete()
      .eq('technician_id', technician._id)

    $q.notify({
      type: 'positive',
      message: t('admin.techDeleted'),
      position: 'top',
    })
    loadTechnicians()
  } catch (error) {
    if (error.message !== 'Cancelled') {
      console.error('Error deleting technician:', error)
      $q.notify({
        type: 'negative',
        message: t('admin.errorDeletingTech'),
        position: 'top',
      })
    }
  }
}

const toggleVerification = async (technician) => {
  try {
    const nextApproved = !technician._isApproved
    const updatePayload = {
      technician_id: technician._id,
      is_verified: nextApproved,
      verification_status: nextApproved ? 'approved' : 'pending',
      verified_at: nextApproved ? new Date().toISOString() : null,
    }

    const { error } = await supabase
      .from('technician_verification_state')
      .upsert(updatePayload, { onConflict: 'technician_id' })

    if (error) throw error
    $q.notify({
      type: 'positive',
      message: nextApproved ? t('admin.techApproved') : t('admin.techMovedPending'),
      position: 'top',
    })
    loadTechnicians()
  } catch (error) {
    console.error('Error updating verification:', error)
    $q.notify({
      type: 'negative',
      message: error?.message || t('admin.errorUpdatingVerification'),
      position: 'top',
    })
  }
}

const resetForm = () => {
  formData.value = {
    full_name: '',
    email: '',
    phone_number: '',
    specialty: '',
    is_verified: false,
  }
  editingId.value = null
  editingKeyColumn.value = 'id'
}

loadTechnicians()
</script>

<style scoped>
.technicians-view {
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
