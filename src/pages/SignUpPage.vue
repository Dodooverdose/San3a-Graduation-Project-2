<template>
  <q-page class="flex flex-center">
    <div class="q-pa-lg" style="max-width: 500px; width: 100%">
      <q-card>
        <q-card-section class="text-h6 text-center q-pb-none">
          {{ $t('signUpPage.createAccount') }}
        </q-card-section>

        <q-card-section>
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input
              v-model="form.fullName"
              :label="$t('signUpPage.fullName')"
              type="text"
              filled
              outlined
              :rules="[(val) => (val && val.length > 0) || $t('signUpPage.nameRequired')]"
            />

            <q-input
              v-model="form.email"
              :label="$t('signUpPage.emailAddress')"
              type="email"
              filled
              outlined
              :rules="[
                (val) =>
                  (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) ||
                  $t('signUpPage.validEmailRequired'),
              ]"
            />

            <q-input
              v-model="form.password"
              :label="$t('signUpPage.password')"
              type="password"
              filled
              outlined
              :rules="[(val) => (val && val.length >= 6) || $t('signUpPage.passwordMinLength')]"
            />

            <q-input
              v-model="form.confirmPassword"
              :label="$t('signUpPage.confirmPassword')"
              type="password"
              filled
              outlined
              :rules="[(val) => val === form.password || $t('signUpPage.passwordsMustMatch')]"
            />

            <q-checkbox v-model="form.agreeTerms" :label="$t('signUpPage.agreeTerms')" />

            <q-btn
              unelevated
              type="submit"
              color="primary"
              :label="$t('common.signUp')"
              size="lg"
              class="full-width"
            />
          </q-form>

          <div class="text-center q-mt-md">
            <span>{{ $t('signUpPage.alreadyHaveAccount') }} </span>
            <q-btn flat color="primary" :label="$t('common.signIn')" to="/" />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const form = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
})

const onSubmit = () => {
  console.log('Form submitted:', form.value)
  // Handle sign up logic here
}
</script>
