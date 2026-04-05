<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round dense icon="arrow_back" @click="goBack" />
        <q-toolbar-title style="display: flex; align-items: center">
          Sanعa
          <img src="/icons/White.png" alt="San3a" style="height: 40px; margin-left: 10px" />
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="flex flex-center">
        <div class="q-pa-lg" style="max-width: 500px; width: 100%; position: relative; z-index: 2">
          <q-card>
            <q-card-section class="text-h6 text-center q-pb-none"> Sign In </q-card-section>

            <q-card-section>
              <q-form @submit.prevent="onSubmit" class="q-gutter-y-md">
                <q-input
                  v-model="form.identifier"
                  label="Email or Phone Number"
                  filled
                  outlined
                  hide-bottom-space
                  :rules="[
                    (val) => (val && val.trim().length > 0) || 'Email or phone number is required',
                  ]"
                />

                <q-input
                  v-model="form.password"
                  label="Password"
                  :type="showPassword ? 'text' : 'password'"
                  filled
                  outlined
                  hide-bottom-space
                  :rules="[
                    (val) => (val && val.length >= 6) || 'Password must be at least 6 characters',
                  ]"
                >
                  <template v-slot:append>
                    <q-icon
                      :name="showPassword ? 'visibility' : 'visibility_off'"
                      class="cursor-pointer"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </q-input>

                <q-checkbox v-model="form.rememberMe" label="Remember me" />

                <q-btn
                  unelevated
                  color="primary"
                  label="Sign In"
                  size="lg"
                  class="full-width"
                  :disable="!isSignInEnabled"
                  :loading="loading"
                  @click="onSubmit"
                />
              </q-form>

              <div
                class="text-center q-mt-md"
                style="display: flex; align-items: center; justify-content: center"
              >
                <span>Don't have an account?</span>
                <q-btn
                  flat
                  dense
                  color="primary"
                  label="Sign Up"
                  class="q-ml-xs auth-action-btn"
                  :class="pressedAction === 'signup' ? 'auth-action-btn--pressed' : ''"
                  @click="goToSignUp"
                />
              </div>

              <div class="text-center q-mt-md">
                <q-btn
                  flat
                  color="primary"
                  label="Forgot Password?"
                  style="margin: 0 auto !important"
                  :loading="forgotLoading"
                  @click="onForgotPassword"
                />
              </div>

              <!-- <div v-if="authStore.isAdmin" class="text-center q-mt-md">
                <q-btn
                  flat
                  color="primary"
                  label="Go to Admin Panel"
                  style="margin: 0 auto !important"
                  @click="navigateWithPress('/admin', 'admin')"
                />
              </div> -->
            </q-card-section>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useAuthStore } from 'src/stores/authStore'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const pressedAction = ref(null)

onMounted(() => {
  // Initialize auth store on component mount
  authStore.initSession()
})

const navigateWithPress = (path, action) => {
  pressedAction.value = action

  window.setTimeout(() => {
    router.push(path)
    pressedAction.value = null
  }, 160)
}

const goToSignUp = () => {
  navigateWithPress('/signup', 'signup')
}

const goBack = () => {
  router.push('/signup')
}

const form = ref({
  identifier: '',
  password: '',
  rememberMe: false,
})

const loading = ref(false)
const forgotLoading = ref(false)
const showPassword = ref(false)

const isSignInEnabled = computed(() => {
  const f = form.value
  return f.identifier.trim().length > 0 && f.password.length > 0
})

const isEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)

const lookupEmailByPhone = async (phone) => {
  // Try users table first
  let { data } = await supabase
    .from('users')
    .select('email')
    .eq('phone_number', phone)
    .limit(1)
    .single()

  if (data?.email)
    return data.email

    // Then try technician table
  ;({ data } = await supabase
    .from('technician')
    .select('email')
    .eq('phone_number', phone)
    .limit(1)
    .single())

  return data?.email || null
}

const onForgotPassword = async () => {
  const identifier = form.value.identifier.trim()

  let email = identifier

  if (!isEmail(identifier)) {
    if (!identifier) {
      $q.notify({ type: 'negative', message: 'Enter your email or phone number above first' })
      return
    }
    email = await lookupEmailByPhone(identifier)
    if (!email) {
      $q.notify({ type: 'negative', message: 'No account found with that phone number' })
      return
    }
  }

  forgotLoading.value = true
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
    })
    if (error) {
      $q.notify({ type: 'negative', message: error.message })
      return
    }
    $q.notify({
      type: 'positive',
      message: 'Check Your Email.',
      timeout: 3000,
    })
    setTimeout(() => window.location.reload(), 3000)
  } catch (err) {
    $q.notify({ type: 'negative', message: 'An unexpected error occurred. Please try again.' })
    console.error(err)
  } finally {
    forgotLoading.value = false
  }
}

const onSubmit = async () => {
  const identifier = form.value.identifier.trim()

  if (!identifier) {
    $q.notify({ type: 'negative', message: 'Please enter your email or phone number' })
    return
  }

  if (!form.value.password || form.value.password.length < 6) {
    $q.notify({ type: 'negative', message: 'Password must be at least 6 characters' })
    return
  }

  loading.value = true

  try {
    let email = identifier

    // If it's not an email, treat it as a phone number and look up the email
    if (!isEmail(identifier)) {
      email = await lookupEmailByPhone(identifier)
      if (!email) {
        $q.notify({ type: 'negative', message: 'No account found with that phone number' })
        return
      }
    }

    // Use authStore for sign-in
    const { success, error } = await authStore.signIn(email, form.value.password)

    if (!success) {
      $q.notify({
        type: 'negative',
        message: error?.message || 'Sign in failed. Please check your credentials.',
        position: 'top',
      })
      return
    }

    $q.notify({
      type: 'positive',
      message: 'Sign in successful! Welcome back.',
    })

    form.value = {
      identifier: '',
      password: '',
      rememberMe: false,
    }

    // Redirect based on role
    const path = authStore.getRedirectPath()
    router.push(path)
  } catch (err) {
    $q.notify({ type: 'negative', message: 'An unexpected error occurred. Please try again.' })
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-action-btn {
  transition:
    transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 160ms ease;
}

.auth-action-btn--pressed {
  transform: translateY(1px) scale(0.97);
  opacity: 0.9;
}
</style>

<style scoped>
.q-page {
  padding: 0 16px;
}

.q-btn {
  margin: 0 auto !important;
  display: block !important;
  margin-right: 15px !important;
}
</style>
