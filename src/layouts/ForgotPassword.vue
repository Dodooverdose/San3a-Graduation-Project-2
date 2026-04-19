<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="auth-page">
        <div class="auth-wrapper san3a-animate-in">
          <div class="back-link" @click="goToSignIn">
            <q-icon name="arrow_back" size="18px" />
            <span>{{ $t('forgotPasswordPage.backToSignIn') }}</span>
          </div>

          <div class="auth-card">
            <div class="auth-logo">
              <div class="brand-row">
                <div class="brand-icon">
                  <img src="/icons/White.png" alt="Sanعa logo" class="brand-logo-mark" />
                </div>
                <span class="brand-text">Sanعa</span>
              </div>
              <h1 class="auth-title">{{ $t('forgotPasswordPage.title') }}</h1>
              <p class="auth-subtitle">
                {{ $t('forgotPasswordPage.subtitle') }}
              </p>
            </div>

            <q-form @submit.prevent="onSubmit" class="auth-form">
              <div class="field-group">
                <label class="field-label">{{ $t('forgotPasswordPage.emailOrPhone') }}</label>
                <q-input
                  v-model="identifier"
                  :placeholder="$t('forgotPasswordPage.placeholder')"
                  outlined
                  dense
                  hide-bottom-space
                  class="san3a-input"
                  :rules="[
                    (val) => (val && val.trim().length > 0) || $t('forgotPasswordPage.emailRequired'),
                  ]"
                >
                  <template #prepend>
                    <q-icon name="mail" color="grey-5" />
                  </template>
                </q-input>
              </div>

              <q-btn
                unelevated
                no-caps
                color="primary"
                :label="$t('forgotPasswordPage.sendResetLink')"
                class="submit-btn"
                :loading="loading"
                :disable="!identifier.trim()"
                type="submit"
              />
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
import { useI18n } from 'vue-i18n'
import { supabase } from 'src/boot/supabase'

const router = useRouter()
const $q = useQuasar()
const { t } = useI18n()

const identifier = ref('')
const loading = ref(false)

const goToSignIn = () => router.push('/signin')

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

const onSubmit = async () => {
  const value = identifier.value.trim()
  if (!value) {
    $q.notify({ type: 'negative', message: t('forgotPasswordPage.enterEmailOrPhone') })
    return
  }

  loading.value = true
  try {
    let email = value
    if (!isEmail(value)) {
      email = await lookupEmailByPhone(value)
      if (!email) {
        $q.notify({ type: 'negative', message: t('forgotPasswordPage.noAccountPhone') })
        return
      }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    })

    if (error) {
      $q.notify({ type: 'negative', message: error.message })
      return
    }

    $q.notify({ type: 'positive', message: t('forgotPasswordPage.resetEmailSent') })
    identifier.value = ''
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: t('forgotPasswordPage.unexpectedError') })
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
  gap: 8px;
}

.field-label {
  font-size: 13px;
  color: var(--san3a-gray-600);
  font-weight: 600;
}

.submit-btn {
  width: 100%;
  height: 46px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
}

@media (max-width: 600px) {
  .auth-card {
    padding: 30px 20px;
  }
}
</style>
