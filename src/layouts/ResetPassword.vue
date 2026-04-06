<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="auth-page">
        <div class="auth-wrapper san3a-animate-in">
          <div class="back-link" @click="$router.push('/signin')">
            <q-icon name="arrow_back" size="18px" />
            <span>Back to Sign In</span>
          </div>

          <div class="auth-card">
            <div class="auth-logo">
              <div class="brand-row">
                <div class="brand-icon"><img src="/icons/White.png" alt="San3a logo" class="brand-logo-mark" /></div>
                <span class="brand-text">San3a</span>
              </div>
              <h1 class="auth-title">Set New Password</h1>
              <p class="auth-subtitle">Enter your new password below</p>
            </div>

            <q-form @submit.prevent="onSubmit" class="auth-form">
              <div class="field-group">
                <label class="field-label">New Password</label>
                <q-input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Enter new password" outlined dense hide-bottom-space class="san3a-input"
                  :rules="[(val) => (val && val.length >= 6) || 'Password must be at least 6 characters']">
                  <template v-slot:prepend><q-icon name="lock" color="grey-5" /></template>
                  <template v-slot:append><q-icon :name="showPassword ? 'visibility' : 'visibility_off'" class="cursor-pointer" color="grey-5" @click="showPassword = !showPassword" /></template>
                </q-input>
              </div>

              <div class="field-group">
                <label class="field-label">Confirm New Password</label>
                <q-input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" placeholder="Confirm new password" outlined dense hide-bottom-space class="san3a-input"
                  :rules="[(val) => val === password || 'Passwords do not match']">
                  <template v-slot:prepend><q-icon name="lock" color="grey-5" /></template>
                  <template v-slot:append><q-icon :name="showConfirm ? 'visibility' : 'visibility_off'" class="cursor-pointer" color="grey-5" @click="showConfirm = !showConfirm" /></template>
                </q-input>
              </div>

              <q-btn unelevated no-caps color="primary" label="Update Password" class="submit-btn" type="submit" :loading="loading" :disable="!password || password.length < 6 || password !== confirmPassword" />
            </q-form>
          </div>
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

const router = useRouter()
const $q = useQuasar()
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const loading = ref(false)

const onSubmit = async () => {
  if (password.value !== confirmPassword.value) { $q.notify({ type: 'negative', message: 'Passwords do not match' }); return }
  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: password.value })
    if (error) { $q.notify({ type: 'negative', message: error.message }); return }
    $q.notify({ type: 'positive', message: 'Password updated successfully! Please sign in.' })
    await supabase.auth.signOut(); router.push('/signin')
  } catch (err) { $q.notify({ type: 'negative', message: 'An unexpected error occurred.' }); console.error(err) }
  finally { loading.value = false }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; background: linear-gradient(135deg, var(--san3a-bg), var(--san3a-primary-light)); display: flex; align-items: center; justify-content: center; padding: 24px 16px; }
.auth-wrapper { width: 100%; max-width: 440px; }
.back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: var(--san3a-gray-600); cursor: pointer; margin-bottom: 28px; transition: color 0.2s; }
.back-link:hover { color: var(--san3a-primary); }
.auth-card { background: #fff; border-radius: var(--san3a-radius-2xl); box-shadow: var(--san3a-shadow-xl); padding: 40px 32px; }
.auth-logo { text-align: center; margin-bottom: 32px; }
.brand-row { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.brand-icon { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover)); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 24px; }
.brand-text { font-size: 30px; font-weight: 800; background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.auth-title { font-size: 24px; font-weight: 800; color: var(--san3a-gray-900); margin: 0 0 6px; }
.auth-subtitle { font-size: 15px; color: var(--san3a-gray-500); margin: 0; }
.auth-form { display: flex; flex-direction: column; gap: 18px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 14px; font-weight: 600; color: var(--san3a-gray-700); }
.san3a-input :deep(.q-field__control) { height: 44px; }
.submit-btn { width: 100%; height: 44px; font-size: 15px; font-weight: 700; }
@media (max-width: 480px) { .auth-card { padding: 28px 20px; } }
</style>
