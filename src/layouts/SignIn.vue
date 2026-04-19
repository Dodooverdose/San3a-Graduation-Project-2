<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="auth-page">
        <div class="auth-wrapper san3a-animate-in">
          <!-- Back link -->
          <div class="back-link" @click="goBack">
            <q-icon name="arrow_back" size="18px" />
            <span>{{ $t('signInPage.backToHome') }}</span>
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
              <h1 class="auth-title">{{ $t('signInPage.welcomeBack') }}</h1>
              <p class="auth-subtitle">{{ $t('signInPage.subtitle') }}</p>
            </div>

            <!-- Form -->
            <q-form @submit.prevent="onSubmit" class="auth-form">
              <div class="field-group">
                <label class="field-label">{{ $t('signInPage.emailOrPhone') }}</label>
                <q-input
                  v-model="form.identifier"
                  :placeholder="$t('signInPage.emailPlaceholder')"
                  outlined
                  dense
                  hide-bottom-space
                  class="san3a-input"
                  :rules="[
                    (val) => (val && val.trim().length > 0) || $t('signInPage.emailRequired'),
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="mail" color="grey-5" />
                  </template>
                </q-input>
              </div>

              <div class="field-group">
                <label class="field-label">{{ $t('signInPage.password') }}</label>
                <q-input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="$t('signInPage.passwordPlaceholder')"
                  outlined
                  dense
                  hide-bottom-space
                  class="san3a-input"
                  :rules="[
                    (val) => (val && val.length >= 6) || $t('signInPage.passwordMinLength'),
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="lock" color="grey-5" />
                  </template>
                  <template v-slot:append>
                    <q-icon
                      :name="showPassword ? 'visibility' : 'visibility_off'"
                      class="cursor-pointer"
                      color="grey-5"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </q-input>
              </div>

              <div class="remember-row">
                <q-checkbox
                  v-model="form.rememberMe"
                  :label="$t('signInPage.rememberMe')"
                  dense
                  class="remember-check"
                />
                <span class="forgot-link" @click="onForgotPassword">{{ $t('signInPage.forgotPassword') }}</span>
              </div>

              <q-btn
                unelevated
                no-caps
                color="primary"
                :label="$t('common.signIn')"
                class="submit-btn"
                :disable="!isSignInEnabled"
                :loading="loading"
                @click="onSubmit"
              />
            </q-form>

            <!-- Divider -->
            <div class="auth-divider">
              <div class="divider-line"></div>
              <span class="divider-text">{{ $t('common.or') }}</span>
              <div class="divider-line"></div>
            </div>

            <!-- Sign Up link -->
            <p class="switch-text">
              {{ $t('signInPage.noAccount') }}
              <span class="switch-link" @click="goToSignUp">{{ $t('signInPage.signUpFree') }}</span>
            </p>
          </div>

          <!-- Footer -->
          <p class="auth-footer">
            {{ $t('signInPage.agreeText') }}
            <span class="footer-link">{{ $t('landing.termsOfService') }}</span>
            {{ $t('common.and') || '' }}
            <span class="footer-link">{{ $t('landing.privacyPolicy') }}</span>
          </p>
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

onMounted(() => {
  authStore.initSession()
})

const goBack = () => router.push('/')
const goToSignUp = () => router.push('/signup')
const goToForgotPassword = () => router.push('/forgot-password')

const form = ref({
  identifier: '',
  password: '',
  rememberMe: false,
})

const loading = ref(false)
const showPassword = ref(false)

const isSignInEnabled = computed(() => {
  const f = form.value
  return f.identifier.trim().length > 0 && f.password.length > 0
})

const isEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)

const lookupEmailByPhone = async (phone) => {
  let { data } = await supabase
    .from('users')
    .select('email')
    .eq('phone_number', phone)
    .limit(1)
    .single()

  if (data?.email) return data.email
  ;({ data } = await supabase
    .from('technician')
    .select('email')
    .eq('phone_number', phone)
    .limit(1)
    .single())

  return data?.email || null
}

const onForgotPassword = () => {
  goToForgotPassword()
}

const onSubmit = async () => {
  const identifier = form.value.identifier.trim()

  if (!identifier) {
    $q.notify({ type: 'negative', message: t('signInPage.enterEmailOrPhone') })
    return
  }

  if (!form.value.password || form.value.password.length < 6) {
    $q.notify({ type: 'negative', message: t('signInPage.passwordTooShort') })
    return
  }

  loading.value = true

  try {
    let email = identifier

    if (!isEmail(identifier)) {
      email = await lookupEmailByPhone(identifier)
      if (!email) {
        $q.notify({ type: 'negative', message: t('signInPage.noAccountPhone') })
        return
      }
    }

    const { success, error } = await authStore.signIn(email, form.value.password)

    if (!success) {
      $q.notify({
        type: 'negative',
        message: error?.message || t('signInPage.signInFailed'),
        position: 'top',
      })
      return
    }

    $q.notify({
      type: 'positive',
      message: t('signInPage.welcomeBackMsg'),
      icon: 'check_circle',
      position: 'top-right',
      timeout: 1400,
      progress: true,
    })

    const path = authStore.getRedirectPath()
    router.push(path)
  } catch (err) {
    $q.notify({ type: 'negative', message: t('signInPage.unexpectedError') })
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
  max-width: 440px;
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
  padding: 40px 32px;
}

.auth-logo {
  text-align: center;
  margin-bottom: 32px;
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

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--san3a-gray-700);
}

.san3a-input :deep(.q-field__control) {
  height: 44px;
}

.remember-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.remember-check {
  font-size: 14px;
}

.forgot-link {
  font-size: 13px;
  color: var(--san3a-primary);
  cursor: pointer;
  font-weight: 600;
}
.forgot-link:hover {
  text-decoration: underline;
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
    padding: 28px 20px;
  }
}
</style>
