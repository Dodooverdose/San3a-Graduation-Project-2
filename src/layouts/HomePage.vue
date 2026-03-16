<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="fixed-top">
      <q-toolbar>
        <q-toolbar-title style="display: flex; align-items: center">
          Sanعa
          <img src="/icons/White.png" alt="San3a" style="height: 40px; margin-left: 10px" />
        </q-toolbar-title>
        <q-space />
        <q-btn
          flat
          round
          dense
          icon="notifications"
          aria-label="Notifications"
          @click="showNotifications = !showNotifications"
        >
          <q-badge v-if="unreadCount > 0" color="red" floating>{{ unreadCount }}</q-badge>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Notifications Panel -->
    <q-dialog v-model="showNotifications" position="top" seamless>
      <q-card style="width: 380px; max-width: 95vw; margin-top: 60px">
        <q-card-section class="row items-center q-pb-sm">
          <div class="text-h6">Notifications</div>
          <q-space />
          <q-btn flat dense round icon="close" @click="showNotifications = false" />
        </q-card-section>
        <q-separator />
        <q-list v-if="notifications.length > 0" separator>
          <q-item
            v-for="(notif, i) in notifications"
            :key="i"
            :class="{ 'bg-blue-1': !notif.read }"
            clickable
            @click="markAsRead(i)"
          >
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white" icon="build" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ notif.fixerName }}</q-item-label>
              <q-item-label caption>{{ notif.message }}</q-item-label>
              <q-item-label caption class="text-grey-6">{{ notif.time }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn
                  dense
                  flat
                  round
                  color="positive"
                  icon="check"
                  size="sm"
                  @click.stop="acceptOffer(i)"
                />
                <q-btn
                  dense
                  flat
                  round
                  color="negative"
                  icon="close"
                  size="sm"
                  @click.stop="declineOffer(i)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-section v-else class="text-center text-grey-5 q-py-lg">
          No Offers Yet
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-page-container>
      <q-page class="page-content">
        <div class="home-grid q-pa-md">
          <div
            v-for="(item, idx) in items"
            :key="idx"
            class="grid-item"
            @click="goToPage(item.route)"
          >
            <q-card flat bordered class="icon-card">
              <div class="icon-box">
                <img :src="item.icon" alt="icon" />
              </div>
              <div class="label">{{ item.label }}</div>
            </q-card>
          </div>
        </div>
      </q-page>
    </q-page-container>

    <!-- Bottom Navigation Bar -->
    <q-footer elevated class="bottom-nav">
      <q-tabs
        v-model="activeTab"
        active-color="white"
        indicator-color="transparent"
        class="nav-tabs"
        narrow-indicator
        dense
      >
        <q-tab name="home" icon="home" label="Home" @click="goToPage('/home')" />
        <q-tab
          name="offers"
          icon="handshake"
          label="Requests"
          @click="goToPage('/incoming-offers')"
        />
        <q-tab name="orders" icon="receipt_long" label="Orders" @click="goToPage('/orders')" />
        <q-tab name="profile" icon="person" label="Profile" @click="goToPage('/profile')" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()

const showNotifications = ref(false)
const activeTab = ref('home')

const notifications = ref([])

const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

const markAsRead = (index) => {
  notifications.value[index].read = true
}

const acceptOffer = (index) => {
  const notif = notifications.value[index]
  $q.notify({ type: 'positive', message: `Accepted offer from ${notif.fixerName}` })
  notifications.value.splice(index, 1)
}

const declineOffer = (index) => {
  const notif = notifications.value[index]
  $q.notify({ type: 'warning', message: `Declined offer from ${notif.fixerName}` })
  notifications.value.splice(index, 1)
}

const goToPage = (route) => {
  if (route) router.push(route)
}

const items = ref([
  { label: 'Plumbing', icon: '/icons/plumbing.png', route: '/plumbing' },
  { label: 'Carpentry', icon: '/icons/carpentry.png', route: '/carpentry' },
  { label: 'Electrical', icon: '/icons/electrical.png', route: '/electrical' },
  { label: 'Kitchen Utilities', icon: '/icons/kitchen.png', route: '/kitchen' },
  { label: 'Painters and Decorators', icon: '/icons/painters.png', route: '/painters' },
  { label: 'Drapery Seamstress', icon: '/icons/drapery.png', route: '/drapery' },
])
</script>

<style scoped>
.page-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 72px; /* space for fixed bottom nav */
}

.home-grid {
  width: 100%;
  max-width: 480px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  justify-items: center;
  padding: 24px 16px;
}

.grid-item {
  width: 100%;
  cursor: pointer;
}

.icon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 12px 14px;
  border-radius: 16px !important;
  background: #f7f9f8;
  border: 1px solid #e8eeeb !important;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.icon-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.15);
}

.icon-card:active {
  transform: scale(0.97);
}

.icon-box {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-box img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.label {
  margin-top: 12px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  color: #2e3d36;
  line-height: 1.3;
}

/* Bottom Navigation */
.bottom-nav {
  background: linear-gradient(135deg, #2e7d32, #388e3c) !important;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.12);
}

.nav-tabs {
  height: 60px;
}

.nav-tabs :deep(.q-tab) {
  min-height: 60px;
  font-size: 11px;
  text-transform: none;
  opacity: 0.75;
  transition: opacity 0.2s ease;
}

.nav-tabs :deep(.q-tab--active) {
  opacity: 1;
}

.nav-tabs :deep(.q-tab__icon) {
  font-size: 24px;
}
</style>
