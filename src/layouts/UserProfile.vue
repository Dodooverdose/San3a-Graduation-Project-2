<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="fixed-top">
      <q-toolbar>
        <q-btn
          v-if="userRole === 'customer'"
          flat
          round
          dense
          icon="arrow_back"
          aria-label="Back to home"
          @click="goHome"
        />
        <q-toolbar-title>User Profile</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="profile-page">
        <div class="profile-card">
          <q-btn
            flat
            round
            class="profile-avatar-btn"
            aria-label="Change profile picture"
            @click="openFilePicker"
          >
            <q-avatar size="140px" class="profile-avatar">
              <img :src="avatarUrl" alt="Profile picture" />
            </q-avatar>
          </q-btn>
          <input
            ref="fileInputRef"
            class="visually-hidden"
            type="file"
            accept="image/*"
            @change="onFileChange"
          />

          <div class="profile-info">
            <div v-if="profileLoading" class="text-grey-7">Loading profile...</div>
            <template v-else>
              <div class="profile-name">{{ profileName || 'Unknown User' }}</div>
              <div class="profile-email">{{ profileEmail || 'No email found' }}</div>
              <div v-if="isFixer && specialtyLabel" class="profile-extra">
                Specialty: {{ specialtyLabel }}
              </div>
              <div v-if="isFixer && yearsOfExperience !== null" class="profile-extra">
                Years of experience: {{ yearsOfExperience }}
              </div>
            </template>
          </div>

          <div class="profile-actions">
            <q-btn color="secondary" class="action-btn" @click="showSettings = !showSettings">
              <q-icon
                name="settings"
                class="gear-icon"
                :class="{ 'gear-spin': showSettings }"
                size="sm"
              />
              <span class="q-ml-sm">Settings</span>
            </q-btn>
            <transition name="slide-fade">
              <div v-if="showSettings" class="settings-options">
                <q-btn flat label="Change Language" class="settings-btn" icon="language" />
                <div class="dark-mode-row">
                  <q-icon name="dark_mode" size="sm" />
                  <span>Dark Mode</span>
                  <q-toggle v-model="darkMode" color="primary" />
                </div>
              </div>
            </transition>
            <q-btn color="negative" label="Log Out" class="action-btn" @click="goToMain" />
          </div>
        </div>
      </q-page>
    </q-page-container>

    <q-footer v-if="!profileLoading" elevated class="bottom-nav">
      <q-tabs
        v-model="activeTab"
        active-color="white"
        indicator-color="transparent"
        class="nav-tabs"
        narrow-indicator
        dense
      >
        <template v-if="isFixer">
          <q-tab
            name="requests"
            icon="request_page"
            label="Requests"
            @click="goToPage('/service-provider')"
          />
          <q-tab
            name="orders"
            icon="receipt_long"
            label="Orders"
            @click="goToPage({ path: '/service-provider', query: { tab: 'orders' } })"
          />
          <q-tab name="profile" icon="person" label="Profile" @click="goToPage('/profile')" />
        </template>
        <template v-else-if="userRole === 'customer'">
          <q-tab name="home" icon="home" label="Home" @click="goToPage('/home')" />
          <q-tab
            name="offers"
            icon="handshake"
            label="Requests"
            @click="goToPage('/incoming-offers')"
          />
          <q-tab name="orders" icon="receipt_long" label="Orders" @click="goToPage('/orders')" />
          <q-tab name="profile" icon="person" label="Profile" @click="goToPage('/profile')" />
        </template>
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const router = useRouter()
const $q = useQuasar()
const fileInputRef = ref(null)
const avatarUrl = ref('/icons/pfp.png')
const activeTab = ref('profile')
const showSettings = ref(false)
const darkMode = ref($q.dark.isActive)
const profileLoading = ref(true)
const profileName = ref('')
const profileEmail = ref('')
const userRole = ref('')
const specialty = ref('')
const yearsOfExperience = ref(null)
const isFixer = computed(() => userRole.value === 'fixer')
const specialtyLabel = computed(() =>
  specialty.value
    ? specialty.value
        .split('_')
        .join(' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : '',
)
let objectUrl = null

const loadProfile = async () => {
  profileLoading.value = true
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/signin')
      return
    }

    const userEmail = user.email || ''
    profileEmail.value = userEmail
    specialty.value = ''
    yearsOfExperience.value = null

    const [{ data: tech }, { data: customer }] = await Promise.all([
      supabase
        .from('technician')
        .select('full_name, email, specialty, years_of_experience')
        .ilike('email', userEmail)
        .maybeSingle(),
      supabase.from('users').select('full_name, email').ilike('email', userEmail).maybeSingle(),
    ])

    if (tech) {
      userRole.value = 'fixer'
      profileName.value = tech.full_name || user.user_metadata?.full_name || ''
      profileEmail.value = tech.email || userEmail
      specialty.value = tech.specialty || user.user_metadata?.specialty || ''
      yearsOfExperience.value = tech.years_of_experience ?? null
      return
    }

    if (customer) {
      userRole.value = 'customer'
      profileName.value = customer.full_name || user.user_metadata?.full_name || ''
      profileEmail.value = customer.email || userEmail
      return
    }

    if (user.user_metadata?.role === 'fixer') {
      userRole.value = 'fixer'
      profileName.value = user.user_metadata?.full_name || ''
      specialty.value = user.user_metadata?.specialty || ''
      yearsOfExperience.value = user.user_metadata?.years_of_experience ?? null
      return
    }

    userRole.value = 'customer'
    profileName.value = user.user_metadata?.full_name || ''
  } catch (err) {
    console.error('Failed to load profile:', err)
    $q.notify({ type: 'negative', message: 'Failed to load profile data.' })
  } finally {
    profileLoading.value = false
  }
}

onMounted(loadProfile)

const openFilePicker = () => {
  fileInputRef.value?.click()
}

const goToPage = (route) => {
  if (route) router.push(route)
}

const goHome = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/home')
  }
}

const goToMain = () => {
  router.push('/')
}

const onFileChange = (event) => {
  const file = event.target.files?.[0]

  if (!file) {
    return
  }

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
  }

  objectUrl = URL.createObjectURL(file)
  avatarUrl.value = objectUrl
}

onBeforeUnmount(() => {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
  }
})

watch(darkMode, (val) => {
  document.body.classList.add('dark-transition')
  $q.dark.set(val)
  setTimeout(() => {
    document.body.classList.remove('dark-transition')
  }, 600)
})
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 56px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  padding-bottom: 92px;
}

.profile-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.profile-avatar {
  background: #f5f5f7;
  margin-top: -295px;
}

.profile-avatar-btn {
  padding: 0;
  min-height: unset;
}

.profile-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-info {
  width: 100%;
  text-align: center;
}

.profile-name {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.profile-email {
  margin-top: 6px;
  font-size: 14px;
  color: #6b7280;
}

.profile-extra {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #2e7d32;
}

.action-btn {
  width: 100%;
}

.gear-icon {
  transition: transform 0.4s ease;
}

.gear-spin {
  transform: rotate(180deg);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.settings-options {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
  transform-origin: top;
}

.slide-fade-enter-active {
  transition: all 0.35s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.25s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.settings-btn {
  width: 100%;
  justify-content: flex-start;
}

.dark-mode-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px 6px 12px;
}

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
