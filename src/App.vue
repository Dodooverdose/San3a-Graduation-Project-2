<template>
  <router-view />
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
