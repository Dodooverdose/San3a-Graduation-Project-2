<template>
  <router-view v-slot="{ Component, route }">
    <transition name="auth-page" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { supabase } from 'src/boot/supabase'

const router = useRouter()

supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    router.push('/reset-password')
  }
})
</script>

<style>
.auth-page-enter-active,
.auth-page-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease,
    filter 220ms ease;
}

.auth-page-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.985);
  filter: blur(3px);
}

.auth-page-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
  filter: blur(2px);
}
</style>
