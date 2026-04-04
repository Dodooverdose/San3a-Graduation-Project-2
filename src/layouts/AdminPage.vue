<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round dense icon="arrow_back" @click="goBack" />
        <q-toolbar-title style="display: flex; align-items: center">
          Admin Dashboard - San3a
          <img src="/icons/White.png" alt="San3a" style="height: 40px; margin-left: 10px" />
        </q-toolbar-title>
        <q-btn flat round dense icon="logout" @click="logout" title="Logout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="q-pa-md">
        <div class="admin-container">
          <q-tabs
            v-model="activeTab"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="left"
            :breakpoint="0"
          >
            <q-tab name="technicians" label="Technicians" icon="people" />
            <q-tab name="customers" label="Users" icon="person" />
            <q-tab name="requests" label="Requests" icon="assignment" />
            <q-tab name="pending" label="Pending Approvals" icon="pending_actions" />
            <q-tab name="complaints" label="Complaints" icon="flag" />
          </q-tabs>

          <q-tab-panels v-model="activeTab" animated>
            <q-tab-panel name="technicians">
              <TechniciansView />
            </q-tab-panel>

            <q-tab-panel name="customers">
              <CustomersView />
            </q-tab-panel>

            <q-tab-panel name="requests">
              <RequestsView />
            </q-tab-panel>

            <q-tab-panel name="pending">
              <VerificationsView />
            </q-tab-panel>

            <q-tab-panel name="complaints">
              <ComplaintsView />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import TechniciansView from 'src/components/admin/TechniciansView.vue'
import CustomersView from 'src/components/admin/CustomersView.vue'
import RequestsView from 'src/components/admin/RequestsView.vue'
import VerificationsView from 'src/components/admin/VerificationsView.vue'
import ComplaintsView from 'src/components/admin/ComplaintsView.vue'

const router = useRouter()
const $q = useQuasar()
const activeTab = ref('technicians')

const goBack = () => {
  router.push('/signin')
}

const logout = async () => {
  try {
    await supabase.auth.signOut()
    router.push('/signin')
  } catch (error) {
    console.error('Logout error:', error)
    $q.notify({
      type: 'negative',
      message: 'Error logging out',
      position: 'top',
    })
  }
}
</script>

<style scoped>
.admin-container {
  width: 100%;
}
</style>
