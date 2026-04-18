<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="auth-page">
        <div class="auth-wrapper san3a-animate-in">
          <!-- Back link -->
          <div class="back-link" @click="goBack">
            <q-icon name="arrow_back" size="18px" />
            <span>Back to Home</span>
          </div>

          <!-- Auth Card -->
          <div class="auth-card">
            <!-- Logo -->
            <div class="auth-logo">
              <div class="brand-row">
                <div class="brand-icon">
                  <img src="/icons/White.png" alt="Sanعa logo" class="brand-logo-mark" />
                </div>
                <span class="brand-text">Sanعa</span>
              </div>
              <h1 class="auth-title">Create Your Account</h1>
              <p class="auth-subtitle">Join Sanعa and get started in minutes</p>
            </div>

            <!-- Role Tabs -->
            <q-tabs
              v-model="roleTab"
              dense
              no-caps
              class="role-tabs"
              active-color="primary"
              indicator-color="primary"
              align="justify"
            >
              <q-tab name="customer" label="I'm a Customer" />
              <q-tab name="fixer" label="I'm a Technician" />
            </q-tabs>

            <q-tab-panels v-model="roleTab" animated class="role-panels">
              <!-- Customer Form -->
              <q-tab-panel name="customer" class="q-pa-none">
                <q-form @submit.prevent="onSubmit" class="auth-form">
                  <div class="field-group">
                    <label class="field-label">Full Name</label>
                    <q-input
                      v-model="form.fullName"
                      placeholder="Ahmed Hassan"
                      outlined
                      dense
                      hide-bottom-space
                      class="san3a-input"
                      :rules="[(val) => (val && val.length > 0) || 'Name is required']"
                    >
                      <template v-slot:prepend><q-icon name="person" color="grey-5" /></template>
                    </q-input>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Email Address</label>
                    <q-input
                      v-model="form.email"
                      type="email"
                      placeholder="your.email@example.com"
                      outlined
                      dense
                      hide-bottom-space
                      class="san3a-input"
                      :rules="[
                        (val) =>
                          (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) || 'Valid email required',
                      ]"
                    >
                      <template v-slot:prepend><q-icon name="mail" color="grey-5" /></template>
                    </q-input>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Phone Number</label>
                    <q-input
                      v-model="form.phoneNumber"
                      type="tel"
                      placeholder="1XX XXX XXXX"
                      prefix="+20"
                      mask="### ### ####"
                      outlined
                      dense
                      hide-bottom-space
                      class="san3a-input"
                      :rules="[
                        (val) =>
                          (val && val.replace(/\s/g, '').length === 10) ||
                          'Enter a valid phone number',
                        (val) =>
                          /^1[0125]/.test(val ? val.replace(/\s/g, '') : '') ||
                          'Number must start with 10, 11, 12, or 15',
                      ]"
                    >
                      <template v-slot:prepend><q-icon name="phone" color="grey-5" /></template>
                    </q-input>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Password</label>
                    <q-input
                      v-model="form.password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Create a strong password"
                      outlined
                      dense
                      hide-bottom-space
                      class="san3a-input"
                      :rules="[
                        (val) =>
                          (val && val.length >= 6) || 'Password must be at least 6 characters',
                      ]"
                    >
                      <template v-slot:prepend><q-icon name="lock" color="grey-5" /></template>
                      <template v-slot:append
                        ><q-icon
                          :name="showPassword ? 'visibility' : 'visibility_off'"
                          class="cursor-pointer"
                          color="grey-5"
                          @click="showPassword = !showPassword"
                      /></template>
                    </q-input>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Confirm Password</label>
                    <q-input
                      v-model="form.confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      placeholder="Confirm your password"
                      outlined
                      dense
                      hide-bottom-space
                      class="san3a-input"
                      :rules="[(val) => val === form.password || 'Passwords must match']"
                    >
                      <template v-slot:prepend><q-icon name="lock" color="grey-5" /></template>
                      <template v-slot:append
                        ><q-icon
                          :name="showConfirmPassword ? 'visibility' : 'visibility_off'"
                          class="cursor-pointer"
                          color="grey-5"
                          @click="showConfirmPassword = !showConfirmPassword"
                      /></template>
                    </q-input>
                  </div>

                  <q-checkbox v-model="form.agreeTerms" dense class="terms-check">
                    <template v-slot:default>
                      <span class="terms-label">I agree to the terms and conditions</span>
                    </template>
                  </q-checkbox>

                  <q-btn
                    unelevated
                    no-caps
                    color="primary"
                    label="Create Customer Account"
                    class="submit-btn"
                    :disable="!isSignUpEnabled"
                    :loading="loading"
                    type="submit"
                  />
                </q-form>
              </q-tab-panel>

              <!-- Technician Form -->
              <q-tab-panel name="fixer" class="q-pa-none">
                <q-form @submit.prevent="onSubmit" class="auth-form">
                  <div class="field-group">
                    <label class="field-label">Full Name</label>
                    <q-input
                      v-model="form.fullName"
                      placeholder="Mohamed Samir"
                      outlined
                      dense
                      hide-bottom-space
                      class="san3a-input"
                      :rules="[(val) => (val && val.length > 0) || 'Name is required']"
                    >
                      <template v-slot:prepend><q-icon name="person" color="grey-5" /></template>
                    </q-input>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Email Address</label>
                    <q-input
                      v-model="form.email"
                      type="email"
                      placeholder="your.email@example.com"
                      outlined
                      dense
                      hide-bottom-space
                      class="san3a-input"
                      :rules="[
                        (val) =>
                          (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) || 'Valid email required',
                      ]"
                    >
                      <template v-slot:prepend><q-icon name="mail" color="grey-5" /></template>
                    </q-input>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Phone Number</label>
                    <q-input
                      v-model="form.phoneNumber"
                      type="tel"
                      placeholder="1XX XXX XXXX"
                      prefix="+20"
                      mask="### ### ####"
                      outlined
                      dense
                      hide-bottom-space
                      class="san3a-input"
                      :rules="[
                        (val) =>
                          (val && val.replace(/\s/g, '').length === 10) ||
                          'Enter a valid phone number',
                        (val) =>
                          /^1[0125]/.test(val ? val.replace(/\s/g, '') : '') ||
                          'Number must start with 10, 11, 12, or 15',
                      ]"
                    >
                      <template v-slot:prepend><q-icon name="phone" color="grey-5" /></template>
                    </q-input>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Password</label>
                    <q-input
                      v-model="form.password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Create a strong password"
                      outlined
                      dense
                      hide-bottom-space
                      class="san3a-input"
                      :rules="[
                        (val) =>
                          (val && val.length >= 6) || 'Password must be at least 6 characters',
                      ]"
                    >
                      <template v-slot:prepend><q-icon name="lock" color="grey-5" /></template>
                      <template v-slot:append
                        ><q-icon
                          :name="showPassword ? 'visibility' : 'visibility_off'"
                          class="cursor-pointer"
                          color="grey-5"
                          @click="showPassword = !showPassword"
                      /></template>
                    </q-input>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Confirm Password</label>
                    <q-input
                      v-model="form.confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      placeholder="Confirm your password"
                      outlined
                      dense
                      hide-bottom-space
                      class="san3a-input"
                      :rules="[(val) => val === form.password || 'Passwords must match']"
                    >
                      <template v-slot:prepend><q-icon name="lock" color="grey-5" /></template>
                      <template v-slot:append
                        ><q-icon
                          :name="showConfirmPassword ? 'visibility' : 'visibility_off'"
                          class="cursor-pointer"
                          color="grey-5"
                          @click="showConfirmPassword = !showConfirmPassword"
                      /></template>
                    </q-input>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Specialty</label>
                    <q-select
                      v-model="form.specialty"
                      :options="specialtyOptions"
                      emit-value
                      map-options
                      outlined
                      dense
                      hide-bottom-space
                      placeholder="Select your specialty"
                      class="san3a-input"
                      :rules="[(val) => !!val || 'Please select a specialty']"
                    >
                      <template v-slot:prepend><q-icon name="build" color="grey-5" /></template>
                    </q-select>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Years of Experience</label>
                    <q-input
                      v-model.number="form.yearsOfExperience"
                      type="number"
                      placeholder="e.g., 5"
                      outlined
                      dense
                      hide-bottom-space
                      min="0"
                      step="1"
                      class="san3a-input"
                      :rules="[
                        (val) =>
                          (val !== null &&
                            val !== '' &&
                            Number.isInteger(Number(val)) &&
                            Number(val) >= 0) ||
                          'Enter a valid number',
                      ]"
                    >
                      <template v-slot:prepend
                        ><q-icon name="workspace_premium" color="grey-5"
                      /></template>
                    </q-input>
                  </div>

                  <!-- Info box -->
                  <div class="info-box">
                    <q-icon name="info" size="18px" />
                    <p>
                      After registration, you'll need to complete your profile and verification
                      before you can start receiving job requests.
                    </p>
                  </div>

                  <q-checkbox v-model="form.agreeTerms" dense class="terms-check">
                    <template v-slot:default>
                      <span class="terms-label">I agree to the terms and conditions</span>
                    </template>
                  </q-checkbox>

                  <q-btn
                    unelevated
                    no-caps
                    color="secondary"
                    label="Create Technician Account"
                    class="submit-btn"
                    :disable="!isSignUpEnabled"
                    :loading="loading"
                    type="submit"
                  />
                </q-form>
              </q-tab-panel>
            </q-tab-panels>

            <!-- Divider -->
            <div class="auth-divider">
              <div class="divider-line"></div>
              <span class="divider-text">or</span>
              <div class="divider-line"></div>
            </div>

            <!-- Sign In link -->
            <p class="switch-text">
              Already have an account?
              <span class="switch-link" @click="goToSignIn">Sign in</span>
            </p>
          </div>

          <!-- Footer -->
          <p class="auth-footer">
            By signing up, you agree to our
            <span class="footer-link">Terms of Service</span> and
            <span class="footer-link">Privacy Policy</span>
          </p>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const router = useRouter()
const $q = useQuasar()

const goBack = () => router.push('/')
const goToSignIn = () => router.push('/signin')

const roleTab = ref('customer')

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
  role: 'customer',
  specialty: null,
  yearsOfExperience: null,
  agreeTerms: false,
})

const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Sync roleTab to form.role
watch(roleTab, (val) => {
  form.value.role = val
})

const isSignUpEnabled = computed(() => {
  const f = form.value
  return (
    f.fullName.trim().length > 0 &&
    f.email.trim().length > 0 &&
    f.phoneNumber.trim().length > 0 &&
    f.password.length > 0 &&
    f.confirmPassword.length > 0 &&
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

    if (authError) {
      $q.notify({ type: 'negative', message: authError.message })
      return
    }

    const table = form.value.role === 'customer' ? 'users' : 'technician'

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
    }

    $q.notify({
      type: 'positive',
      message: `Welcome ${form.value.fullName}! Account created successfully.`,
    })

    const selectedRole = form.value.role
    const verificationQuery = {
      accountType: selectedRole === 'fixer' ? 'technician' : 'user',
      email: form.value.email,
      fullName: form.value.fullName,
      phoneNumber: form.value.phoneNumber,
      role: selectedRole,
      authId: authData?.user?.id || '',
      specialty: form.value.specialty || '',
      yearsOfExperience:
        form.value.yearsOfExperience !== null && form.value.yearsOfExperience !== ''
          ? String(form.value.yearsOfExperience)
          : '',
    }

    await router.push({ path: '/verify-identity/id-front', query: verificationQuery })
  } catch (err) {
    $q.notify({ type: 'negative', message: 'An unexpected error occurred. Please try again.' })
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--san3a-bg), var(--san3a-primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.auth-wrapper {
  width: 100%;
  max-width: 520px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--san3a-gray-600);
  cursor: pointer;
  margin-bottom: 28px;
  transition: color 0.2s;
}
.back-link:hover {
  color: var(--san3a-primary);
}

.auth-card {
  background: #fff;
  border-radius: var(--san3a-radius-2xl);
  box-shadow: var(--san3a-shadow-xl);
  padding: 36px 32px;
}

.auth-logo {
  text-align: center;
  margin-bottom: 24px;
}

.brand-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.brand-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 24px;
}

.brand-text {
  font-size: 30px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--san3a-gray-900);
  margin: 0 0 6px;
}

.auth-subtitle {
  font-size: 15px;
  color: var(--san3a-gray-500);
  margin: 0;
}

.role-tabs {
  margin-bottom: 4px;
  border-radius: var(--san3a-radius-md);
  background: var(--san3a-gray-100);
}

.role-tabs :deep(.q-tab) {
  border-radius: var(--san3a-radius-md);
  font-weight: 600;
  min-height: 40px;
}

.role-panels {
  background: transparent;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--san3a-gray-700);
}

.san3a-input :deep(.q-field__control) {
  height: 44px;
}

.info-box {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  background: var(--san3a-info-light);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--san3a-radius-md);
  color: var(--san3a-info);
  font-size: 13px;
  line-height: 1.5;
}

.info-box p {
  margin: 0;
}

.terms-check {
  font-size: 14px;
}

.terms-label {
  font-size: 13px;
  color: var(--san3a-gray-600);
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 700;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: var(--san3a-gray-200);
}

.divider-text {
  font-size: 13px;
  color: var(--san3a-gray-500);
}

.switch-text {
  text-align: center;
  font-size: 14px;
  color: var(--san3a-gray-600);
  margin: 0;
}

.switch-link {
  color: var(--san3a-primary);
  font-weight: 700;
  cursor: pointer;
}
.switch-link:hover {
  text-decoration: underline;
}

.auth-footer {
  text-align: center;
  font-size: 12px;
  color: var(--san3a-gray-500);
  margin-top: 24px;
}

.footer-link {
  color: var(--san3a-primary);
  cursor: pointer;
}
.footer-link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 24px 18px;
  }
}
</style>
