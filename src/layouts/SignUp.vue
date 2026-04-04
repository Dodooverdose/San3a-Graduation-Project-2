<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="fixed-top">
      <q-toolbar>
        <q-btn flat round dense icon="arrow_back" @click="goBack" />
        <q-toolbar-title style="display: flex; align-items: center">
          Sanعa
          <img src="/icons/White.png" alt="San3a" style="height: 40px; margin-left: 10px" />
        </q-toolbar-title>
      </q-toolbar>
    </q-header>
    <q-page-container style="margin-top: 64px">
      <q-page class="flex flex-center">
        <div class="q-pa-lg" style="max-width: 500px; width: 100%; position: relative; z-index: 2">
          <q-card>
            <q-card-section class="text-h6 text-center q-pb-none"> Create Account </q-card-section>

            <q-card-section>
              <q-form @submit.prevent="onSubmit" class="q-gutter-y-md">
                <q-input
                  v-model="form.fullName"
                  label="Full Name"
                  type="text"
                  filled
                  outlined
                  hide-bottom-space
                  :rules="[(val) => (val && val.length > 0) || 'Name is required']"
                />

                <q-input
                  v-model="form.email"
                  label="Email"
                  type="email"
                  filled
                  outlined
                  hide-bottom-space
                  :rules="[
                    (val) =>
                      (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) || 'Valid email required',
                  ]"
                />

                <q-input
                  v-model="form.phoneNumber"
                  label="Phone Number"
                  type="tel"
                  filled
                  outlined
                  hide-bottom-space
                  prefix="+20"
                  mask="### ### ####"
                  placeholder="1XX XXX XXXX"
                  :rules="[
                    (val) =>
                      (val && val.replace(/\s/g, '').length === 10) ||
                      'Enter a valid phone number (e.g. 01X XXXX XXXX)',
                    (val) =>
                      /^1[0125]/.test(val ? val.replace(/\s/g, '') : '') ||
                      'Number must start with 10, 11, 12, or 15',
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

                <q-input
                  v-model="form.confirmPassword"
                  label="Confirm Password"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  filled
                  outlined
                  hide-bottom-space
                  :rules="[(val) => val === form.password || 'Passwords must match']"
                >
                  <template v-slot:append>
                    <q-icon
                      :name="showConfirmPassword ? 'visibility' : 'visibility_off'"
                      class="cursor-pointer"
                      @click="showConfirmPassword = !showConfirmPassword"
                    />
                  </template>
                </q-input>

                <div>
                  <div class="text-subtitle2 q-mb-sm">Select Role</div>
                  <q-option-group
                    v-model="form.role"
                    :options="[
                      { label: 'Customer', value: 'customer' },
                      { label: 'Fixer', value: 'fixer' },
                    ]"
                    color="primary"
                    inline
                  />
                </div>

                <q-select
                  v-if="form.role === 'fixer'"
                  v-model="form.specialty"
                  label="Select Specialty"
                  filled
                  outlined
                  :options="specialtyOptions"
                  emit-value
                  map-options
                  hide-bottom-space
                  :rules="[(val) => !!val || 'Please select a specialty']"
                />

                <q-input
                  v-if="form.role === 'fixer'"
                  v-model.number="form.yearsOfExperience"
                  label="Years of Experience"
                  type="number"
                  filled
                  outlined
                  min="0"
                  step="1"
                  hide-bottom-space
                  :rules="[
                    (val) =>
                      (val !== null &&
                        val !== '' &&
                        Number.isInteger(Number(val)) &&
                        Number(val) >= 0) ||
                      'Enter a valid number',
                  ]"
                />

                <q-checkbox v-model="form.agreeTerms" label="I agree to the terms and conditions" />

                <q-btn
                  unelevated
                  color="primary"
                  label="Sign Up"
                  size="lg"
                  class="full-width"
                  :disable="!isSignUpEnabled"
                  :loading="loading"
                  @click="onSubmit"
                />
              </q-form>

              <div
                class="text-center q-mt-md"
                style="display: flex; align-items: center; justify-content: center"
              >
                <span>Already have an account?</span>
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  label="Sign In"
                  class="q-ml-xs auth-action-btn"
                  :class="pressedAction === 'signin' ? 'auth-action-btn--pressed' : ''"
                  @click="goToSignIn"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const router = useRouter()
const $q = useQuasar()
const pressedAction = ref(null)

const navigateWithPress = (path, action) => {
  pressedAction.value = action

  window.setTimeout(() => {
    router.push(path)
    pressedAction.value = null
  }, 160)
}

const goBack = () => {
  router.push('/')
}

const goToSignIn = () => {
  navigateWithPress('/signin', 'signin')
}

const specialtyOptions = [
  { label: 'Plumber', value: 'plumber' },
  { label: 'Electrician', value: 'electrician' },
  { label: 'Carpenter', value: 'carpenter' },
  { label: 'Painter', value: 'painter' },
  { label: 'Kitchen Fitter', value: 'kitchen_fitter' },
  { label: 'Drapery Seamstress', value: 'drapery_seamstress' },
]

const form = ref({
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  role: '',
  specialty: null,
  yearsOfExperience: null,
  agreeTerms: false,
})

const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const isSignUpEnabled = computed(() => {
  const f = form.value
  return (
    f.fullName.trim().length > 0 &&
    f.email.trim().length > 0 &&
    f.phoneNumber.trim().length > 0 &&
    f.password.length > 0 &&
    f.confirmPassword.length > 0 &&
    !!f.role &&
    (f.role !== 'fixer' || !!f.specialty) &&
    (f.role !== 'fixer' ||
      (f.yearsOfExperience !== null &&
        f.yearsOfExperience !== '' &&
        Number.isInteger(Number(f.yearsOfExperience)) &&
        Number(f.yearsOfExperience) >= 0)) &&
    f.agreeTerms
  )
})

const onSubmit = async () => {
  // Validate form
  if (!form.value.fullName || form.value.fullName.length === 0) {
    $q.notify({ type: 'negative', message: 'Full name is required' })
    return
  }

  if (!form.value.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    $q.notify({ type: 'negative', message: 'Valid email is required' })
    return
  }

  if (!form.value.password || form.value.password.length < 6) {
    $q.notify({ type: 'negative', message: 'Password must be at least 6 characters' })
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    $q.notify({ type: 'negative', message: 'Passwords must match' })
    return
  }

  if (!form.value.role) {
    $q.notify({ type: 'negative', message: 'Please select a role' })
    return
  }

  if (form.value.role === 'fixer' && !form.value.specialty) {
    $q.notify({ type: 'negative', message: 'Please select a specialty' })
    return
  }

  if (!form.value.agreeTerms) {
    $q.notify({ type: 'negative', message: 'You must agree to the terms and conditions' })
    return
  }

  loading.value = true

  try {
    // Check if the email already exists in either the users or technician table
    const [{ data: existingUser }, { data: existingTechnician }] = await Promise.all([
      supabase.from('users').select('email').eq('email', form.value.email).maybeSingle(),
      supabase.from('technician').select('email').eq('email', form.value.email).maybeSingle(),
    ])

    if (existingUser || existingTechnician) {
      $q.notify({
        type: 'negative',
        message: 'An account with this email already exists. Please sign in instead.',
      })
      loading.value = false
      return
    }

    console.log('Starting sign up for:', form.value.email)

    // 1. Create auth user with profile metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.value.email,
      password: form.value.password,
      options: {
        data: {
          full_name: form.value.fullName,
          role: form.value.role,
          specialty: form.value.specialty,
          years_of_experience: form.value.yearsOfExperience,
        },
      },
    })

    console.log('Auth signUp response:', { authData, authError })

    if (authError) {
      $q.notify({ type: 'negative', message: authError.message })
      return
    }

    // 2. Insert profile row into the appropriate table
    const table = form.value.role === 'customer' ? 'users' : 'technician'
    console.log('Inserting into table:', table)

    const { error: insertError } = await supabase.from(table).insert({
      full_name: form.value.fullName,
      email: form.value.email,
      phone_number: form.value.phoneNumber,
      ...(form.value.role === 'fixer' && {
        specialty: form.value.specialty,
        years_of_experience: Number(form.value.yearsOfExperience),
      }),
    })

    if (insertError) {
      console.warn('Profile insert failed:', insertError.message)
    } else {
      console.log('Profile insert succeeded')
    }

    // Success — auth user was created
    $q.notify({
      type: 'positive',
      message: `Welcome ${form.value.fullName}! Account created successfully.`,
    })

    const selectedRole = form.value.role

    // Reset form
    form.value = {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      role: '',
      specialty: null,
      yearsOfExperience: null,
      agreeTerms: false,
    }

    if (selectedRole === 'fixer') {
      router.push('/service-provider')
    } else {
      router.push('/home')
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: 'An unexpected error occurred. Please try again.' })
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fixed-top {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
}

.q-page {
  padding: 0 16px;
}

.q-btn {
  margin: 0 auto !important;
  display: block !important;
  margin-right: 20px !important;
}

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
