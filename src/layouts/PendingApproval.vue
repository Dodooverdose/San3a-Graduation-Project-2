<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="pending-page">
        <div class="pending-card san3a-animate-in">
          <div class="pending-icon-wrap">
            <q-icon name="hourglass_top" size="46px" color="warning" />
          </div>
          <h1>Your Profile Is Under Review</h1>
          <p>
            Thank you for submitting your verification documents. Your account is currently in
            pending approval state. You will get full access once an admin approves your profile.
          </p>

          <div class="status-chip-row">
            <q-chip :color="statusChip.color" text-color="white" :icon="statusChip.icon">
              {{ statusChip.label }}
            </q-chip>
          </div>

          <div class="actions-row">
            <q-btn
              flat
              color="primary"
              icon="refresh"
              no-caps
              label="Check Status"
              :loading="loading"
              @click="checkStatus"
            />
            <q-btn
              v-if="canResubmit"
              outline
              color="warning"
              icon="upload_file"
              no-caps
              label="Resubmit Documents"
              @click="goToResubmission"
            />
            <q-btn
              unelevated
              color="primary"
              icon="logout"
              no-caps
              label="Sign Out"
              @click="signOut"
            />
          </div>

          <div v-if="lastStatusMessage" class="status-msg">
            {{ lastStatusMessage }}
          </div>

          <div v-if="rejectionReason" class="rejection-reason-box">
            <div class="reason-title">Admin Rejection Reason</div>
            <div class="reason-body">{{ rejectionReason }}</div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const router = useRouter()
const $q = useQuasar()

const loading = ref(false)
const lastStatusMessage = ref('')
const canResubmit = ref(false)
const rejectionReason = ref('')
const currentStatus = ref('pending')

const statusChip = computed(() => {
  if (currentStatus.value === 'rejected') {
    return { label: 'Rejected', color: 'negative', icon: 'gpp_bad' }
  }
  if (currentStatus.value === 'approved') {
    return { label: 'Approved', color: 'positive', icon: 'verified' }
  }
  return { label: 'Pending Approval', color: 'orange', icon: 'pending_actions' }
})

const checkStatus = async () => {
  loading.value = true
  lastStatusMessage.value = ''

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      router.push('/signin')
      return
    }

    const { data, error } = await supabase
      .from('profile_verification_submissions')
      .select('review_status,reviewer_notes')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (error) throw error

    if (data?.review_status === 'approved') {
      currentStatus.value = 'approved'
      canResubmit.value = false
      rejectionReason.value = ''
      const role = user.user_metadata?.role
      if (role === 'fixer') {
        await router.push('/service-provider')
      } else {
        await router.push('/home')
      }
      return
    }

    if (data?.review_status === 'rejected') {
      currentStatus.value = 'rejected'
      canResubmit.value = true
      rejectionReason.value = data?.reviewer_notes || ''
      lastStatusMessage.value = 'Your profile was rejected. Please fix the issue and resubmit.'
      return
    }

    currentStatus.value = 'pending'
    canResubmit.value = false
    rejectionReason.value = ''
    lastStatusMessage.value = 'Still pending. Please check back later.'
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Could not refresh status. Please try again.' })
  } finally {
    loading.value = false
  }
}

const signOut = async () => {
  await supabase.auth.signOut()
  router.push('/signin')
}

const goToResubmission = async () => {
  loading.value = true
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      await router.push('/signin')
      return
    }

    canResubmit.value = false
    currentStatus.value = 'rejected'
    await router.push({ path: '/verify-identity/id-front', query: { resubmission: '1' } })
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Could not start resubmission. Please try again.' })
  } finally {
    loading.value = false
  }
}

checkStatus()
</script>

<style scoped>
.pending-page {
  min-height: 100vh;
  background: linear-gradient(160deg, var(--san3a-bg), #e7f2f2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.pending-card {
  width: min(620px, 100%);
  background: #fff;
  border: 1px solid var(--san3a-gray-200);
  border-radius: var(--san3a-radius-2xl);
  box-shadow: var(--san3a-shadow-xl);
  padding: 28px;
  text-align: center;
}

.pending-icon-wrap {
  width: 74px;
  height: 74px;
  border-radius: 20px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pending-card h1 {
  margin: 0;
  font-size: 28px;
  color: var(--san3a-gray-900);
}

.pending-card p {
  margin: 12px 0 0;
  color: var(--san3a-gray-600);
  line-height: 1.6;
}

.status-chip-row {
  margin-top: 14px;
}

.actions-row {
  margin-top: 22px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-msg {
  margin-top: 14px;
  color: var(--san3a-gray-600);
  font-size: 13px;
}

.rejection-reason-box {
  margin-top: 14px;
  text-align: left;
  border: 1px solid #fecaca;
  background: #fef2f2;
  border-radius: 12px;
  padding: 12px;
}

.reason-title {
  font-size: 12px;
  font-weight: 700;
  color: #b91c1c;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.reason-body {
  font-size: 14px;
  color: #7f1d1d;
  line-height: 1.45;
}

@media (max-width: 600px) {
  .pending-card {
    padding: 18px;
  }

  .pending-card h1 {
    font-size: 23px;
  }
}
</style>
