<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
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
            <q-card-section class="text-h6 text-center q-pb-none">
              Set New Password
            </q-card-section>

            <q-card-section>
              <q-form @submit.prevent="onSubmit" class="q-gutter-y-md">
                <q-input
                  v-model="password"
                  label="New Password"
                  :type="showPassword ? 'text' : 'password'"
                  filled
                  outlined
                  hide-bottom-space
                  :rules="[(val) => (val && val.length >= 6) || 'Password must be at least 6 characters']"
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
                  v-model="confirmPassword"
                  label="Confirm New Password"
                  :type="showConfirm ? 'text' : 'password'"
                  filled
                  outlined
                  hide-bottom-space
                  :rules="[(val) => val === password || 'Passwords do not match']"
                >
                  <template v-slot:append>
                    <q-icon
                      :name="showConfirm ? 'visibility' : 'visibility_off'"
                      class="cursor-pointer"
                      @click="showConfirm = !showConfirm"
                    />
                  </template>
                </q-input>

                <q-btn
                  unelevated
                  color="primary"
                  label="Update Password"
                  size="lg"
                  class="full-width"
                  type="submit"
                  :loading="loading"
                  :disable="!password || password.length < 6 || password !== confirmPassword"
                />
              </q-form>
            </q-card-section>
          </q-card>
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
  if (password.value !== confirmPassword.value) {
    $q.notify({ type: 'negative', message: 'Passwords do not match' })
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: password.value })
    if (error) {
      $q.notify({ type: 'negative', message: error.message })
      return
    }
    $q.notify({ type: 'positive', message: 'Password updated successfully! Please sign in.' })
    await supabase.auth.signOut()
    router.push('/signin')
  } catch (err) {
    $q.notify({ type: 'negative', message: 'An unexpected error occurred. Please try again.' })
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>
