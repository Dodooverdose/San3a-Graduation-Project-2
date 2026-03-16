<template>
  <q-page class="flex flex-center">
    <div class="q-pa-lg" style="max-width: 500px; width: 100%">
      <q-card>
        <q-card-section class="text-h6 text-center q-pb-none">
          Create Account
        </q-card-section>

        <q-card-section>
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input
              v-model="form.fullName"
              label="Full Name"
              type="text"
              filled
              outlined
              rules="[val => val && val.length > 0 || 'Name is required']"
            />

            <q-input
              v-model="form.email"
              label="Email"
              type="email"
              filled
              outlined
              rules="[val => val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Valid email required']"
            />

            <q-input
              v-model="form.password"
              label="Password"
              type="password"
              filled
              outlined
              rules="[val => val && val.length >= 6 || 'Password must be at least 6 characters']"
            />

            <q-input
              v-model="form.confirmPassword"
              label="Confirm Password"
              type="password"
              filled
              outlined
              rules="[val => val === form.password || 'Passwords must match']"
            />

            <q-checkbox
              v-model="form.agreeTerms"
              label="I agree to the terms and conditions"
            />

            <q-btn
              unelevated
              type="submit"
              color="primary"
              label="Sign Up"
              size="lg"
              class="full-width"
            />
          </q-form>

          <div class="text-center q-mt-md">
            <span>Already have an account? </span>
            <q-btn
              flat
              color="primary"
              label="Sign In"
              to="/"
            />
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
