<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="fixed-top">
      <q-toolbar>
        <q-btn flat round dense icon="arrow_back" aria-label="Back to home" @click="goHome" />
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
  </q-layout>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()
const fileInputRef = ref(null)
const avatarUrl = ref('/icons/pfp.png')
const showSettings = ref(false)
const darkMode = ref($q.dark.isActive)
let objectUrl = null

const openFilePicker = () => {
  fileInputRef.value?.click()
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
  margin-top: -325px;
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
</style>
