<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="verify-page">
        <div class="verify-wrapper san3a-animate-in">
          <div class="verify-card">
            <div class="verify-head">
              <q-chip color="primary" text-color="white" icon="verified_user">
                {{ $t('verification.stepOf', { step: currentStepIndex + 1 }) }}
              </q-chip>
              <h1>{{ currentConfig.title }}</h1>
              <p>{{ currentConfig.subtitle }}</p>
            </div>

            <div class="verify-progress">
              <div
                v-for="(step, idx) in stepConfig"
                :key="step.key"
                class="progress-item"
                :class="{
                  'is-active': idx === currentStepIndex,
                  'is-done': isStepComplete(step.key),
                }"
              >
                <span>{{ idx + 1 }}</span>
                <small>{{ step.shortLabel }}</small>
              </div>
            </div>

            <div class="capture-frame">
              <div class="frame-overlay">
                <q-icon :name="currentConfig.icon" size="30px" />
                <div>{{ currentConfig.guide }}</div>
              </div>
              <img
                v-if="previewImage"
                :src="previewImage"
                alt="Verification preview"
                class="preview-image"
              />
            </div>

            <div class="tips-box">
              <strong>{{ $t('verification.tips') }}</strong>
              <ul>
                <li>{{ $t('verification.tip1') }}</li>
                <li>{{ $t('verification.tip2') }}</li>
                <li>{{ $t('verification.tip3') }}</li>
              </ul>
            </div>

            <div class="actions-row">
              <q-btn
                outline
                color="primary"
                icon="photo_camera"
                :label="$t('verification.takePhoto')"
                no-caps
                @click="openCameraCapture"
              />
              <q-btn
                flat
                color="primary"
                icon="photo_library"
                :label="$t('verification.uploadFromGallery')"
                no-caps
                @click="openGalleryInput"
              />
            </div>

            <div class="footer-actions">
              <q-btn flat no-caps icon="arrow_back" :label="$t('common.back')" @click="goBack" />
              <div class="footer-right">
                <q-btn
                  flat
                  no-caps
                  color="negative"
                  :label="$t('verification.retake')"
                  :disable="!previewImage"
                  @click="retake"
                />
                <q-btn
                  unelevated
                  color="primary"
                  no-caps
                  :label="
                    isLastStep
                      ? $t('verification.submitVerification')
                      : $t('verification.confirmContinue')
                  "
                  :disable="!previewImage"
                  :loading="saving"
                  @click="saveAndContinue"
                />
              </div>
            </div>

            <div class="privacy-note">
              <q-icon name="shield" size="16px" />
              <span>
                {{ $t('verification.privacyNote') }}
              </span>
            </div>
          </div>
        </div>

        <input
          ref="captureInputRef"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden-input"
          @change="onFileSelected"
        />
        <input
          ref="galleryInputRef"
          type="file"
          accept="image/*"
          class="hidden-input"
          @change="onFileSelected"
        />

        <q-dialog v-model="cameraDialog" persistent>
          <q-card class="camera-dialog-card">
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h6">{{ $t('verification.takePhoto') }}</div>
              <q-space />
              <q-btn icon="close" flat round dense @click="closeCameraDialog" />
            </q-card-section>

            <q-card-section>
              <div class="camera-preview-wrap">
                <video ref="cameraVideoRef" autoplay playsinline class="camera-preview"></video>
              </div>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat no-caps :label="$t('common.cancel')" @click="closeCameraDialog" />
              <q-btn
                unelevated
                color="primary"
                no-caps
                :label="$t('verification.capture')"
                @click="captureFromCamera"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <canvas ref="cameraCanvasRef" class="hidden-input"></canvas>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { supabase } from 'src/boot/supabase'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const { t } = useI18n()

const stepOrder = ['id-front', 'id-back', 'selfie']
const stepConfig = computed(() => [
  {
    key: 'id-front',
    shortLabel: t('verification.idFront'),
    title: t('verification.captureIdFront'),
    subtitle: t('verification.captureIdFrontSub'),
    guide: t('verification.alignFront'),
    icon: 'badge',
    column: 'national_id_front_image',
  },
  {
    key: 'id-back',
    shortLabel: t('verification.idBack'),
    title: t('verification.captureIdBack'),
    subtitle: t('verification.captureIdBackSub'),
    guide: t('verification.alignBack'),
    icon: 'credit_card',
    column: 'national_id_back_image',
  },
  {
    key: 'selfie',
    shortLabel: t('verification.selfie'),
    title: t('verification.captureSelfie'),
    subtitle: t('verification.captureSelfieSub'),
    guide: t('verification.centerFace'),
    icon: 'face',
    column: 'selfie_image',
  },
])

const captureInputRef = ref(null)
const galleryInputRef = ref(null)
const cameraDialog = ref(false)
const cameraVideoRef = ref(null)
const cameraCanvasRef = ref(null)
const cameraStream = ref(null)
const previewImage = ref('')
const saving = ref(false)

const submission = ref(null)
const authUser = ref(null)

const currentStep = computed(() => String(route.params.step || 'id-front'))
const currentStepIndex = computed(() => {
  const idx = stepOrder.indexOf(currentStep.value)
  return idx >= 0 ? idx : 0
})
const isLastStep = computed(() => currentStepIndex.value === stepOrder.length - 1)
const currentConfig = computed(() => stepConfig.value[currentStepIndex.value])

const accountType = computed(() => {
  const queryType = String(route.query.accountType || '').toLowerCase()
  if (queryType === 'technician' || queryType === 'user') return queryType

  const metadataRole = String(authUser.value?.user_metadata?.role || '').toLowerCase()
  return metadataRole === 'fixer' ? 'technician' : 'user'
})

const normalizedProfileDetails = computed(() => ({
  role: String(route.query.role || authUser.value?.user_metadata?.role || ''),
  phoneNumber: String(route.query.phoneNumber || ''),
  specialty:
    accountType.value === 'technician'
      ? String(route.query.specialty || authUser.value?.user_metadata?.specialty || '')
      : null,
  yearsOfExperience:
    accountType.value === 'technician'
      ? String(
          route.query.yearsOfExperience || authUser.value?.user_metadata?.years_of_experience || '',
        )
      : null,
}))

const isStepComplete = (stepKey) => {
  const step = stepConfig.value.find((item) => item.key === stepKey)
  if (!step) return false
  return Boolean(submission.value?.[step.column])
}

const openCaptureInput = () => {
  captureInputRef.value?.click()
}

const openGalleryInput = () => {
  galleryInputRef.value?.click()
}

const stopCameraStream = () => {
  if (!cameraStream.value) return
  for (const track of cameraStream.value.getTracks()) {
    track.stop()
  }
  cameraStream.value = null
}

const closeCameraDialog = () => {
  cameraDialog.value = false
  stopCameraStream()
}

const openCameraCapture = async () => {
  const supportsCamera =
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'

  if (!supportsCamera) {
    openCaptureInput()
    return
  }

  try {
    const facingMode = currentStep.value === 'selfie' ? 'user' : 'environment'
    cameraStream.value = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false,
    })
    cameraDialog.value = true

    // Wait for dialog and video element to exist before assigning stream.
    requestAnimationFrame(() => {
      if (cameraVideoRef.value) {
        cameraVideoRef.value.srcObject = cameraStream.value
      }
    })
  } catch (error) {
    console.warn('Falling back to file capture input:', error)
    openCaptureInput()
  }
}

const captureFromCamera = () => {
  const videoEl = cameraVideoRef.value
  const canvasEl = cameraCanvasRef.value

  if (!videoEl || !canvasEl) return

  const width = videoEl.videoWidth || 1280
  const height = videoEl.videoHeight || 720

  canvasEl.width = width
  canvasEl.height = height
  const ctx = canvasEl.getContext('2d')
  if (!ctx) return

  ctx.drawImage(videoEl, 0, 0, width, height)
  previewImage.value = canvasEl.toDataURL('image/jpeg', 0.92)
  closeCameraDialog()
}

const ensureSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    router.push('/signin')
    return null
  }

  authUser.value = session.user
  return session.user
}

const loadSubmission = async () => {
  if (!authUser.value?.id) return

  const { data, error } = await supabase
    .from('profile_verification_submissions')
    .select('*')
    .eq('auth_id', authUser.value.id)
    .maybeSingle()

  if (error) {
    console.error('Failed to load verification submission:', error)
    return
  }

  submission.value = data
  if (data?.[currentConfig.value.column]) {
    previewImage.value = data[currentConfig.value.column]
  }
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const onFileSelected = async (event) => {
  const file = event?.target?.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    $q.notify({ type: 'negative', message: t('verification.selectImageFile') })
    return
  }

  if (file.size > 6 * 1024 * 1024) {
    $q.notify({ type: 'negative', message: t('verification.imageTooLarge') })
    return
  }

  try {
    const imageData = await readFileAsDataUrl(file)
    previewImage.value = imageData
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: t('verification.couldNotRead') })
  } finally {
    if (event?.target) {
      event.target.value = ''
    }
  }
}

const basePayload = () => ({
  auth_id: authUser.value.id,
  account_type: accountType.value,
  full_name: String(route.query.fullName || authUser.value?.user_metadata?.full_name || ''),
  email: String(route.query.email || authUser.value?.email || ''),
  profile_details: normalizedProfileDetails.value,
  submitted_at: new Date().toISOString(),
  review_status: submission.value?.review_status || 'pending',
})

const persistCurrentStepImage = async () => {
  const payload = {
    ...basePayload(),
    [currentConfig.value.column]: previewImage.value,
  }

  const { data, error } = await supabase
    .from('profile_verification_submissions')
    .upsert(payload, { onConflict: 'auth_id' })
    .select('*')
    .single()

  if (error) throw error
  submission.value = data
}

const saveAndContinue = async () => {
  if (!previewImage.value) {
    $q.notify({ type: 'negative', message: t('verification.captureFirst') })
    return
  }

  saving.value = true
  try {
    await persistCurrentStepImage()

    const nextIndex = currentStepIndex.value + 1
    if (nextIndex < stepOrder.length) {
      router.push({
        path: `/verify-identity/${stepOrder[nextIndex]}`,
        query: route.query,
      })
      return
    }

    const completionPayload = {
      ...basePayload(),
      verification_completed_at: new Date().toISOString(),
      review_status: 'pending',
    }

    const { error } = await supabase
      .from('profile_verification_submissions')
      .upsert(completionPayload, { onConflict: 'auth_id' })

    if (error) throw error

    $q.notify({
      type: 'positive',
      message: t('verification.verificationSubmitted'),
    })
    router.push('/pending-approval')
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: error?.message || t('verification.verificationFailed'),
    })
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  const previousIndex = currentStepIndex.value - 1
  if (previousIndex >= 0) {
    router.push({
      path: `/verify-identity/${stepOrder[previousIndex]}`,
      query: route.query,
    })
    return
  }

  if (accountType.value === 'technician') {
    router.push('/signup')
  } else {
    router.push('/signup')
  }
}

const retake = () => {
  previewImage.value = ''
}

const normalizeStep = () => {
  if (!stepOrder.includes(currentStep.value)) {
    router.replace({ path: '/verify-identity/id-front', query: route.query })
  }
}

watch(
  () => route.params.step,
  async () => {
    normalizeStep()
    if (submission.value?.[currentConfig.value.column]) {
      previewImage.value = submission.value[currentConfig.value.column]
    } else {
      previewImage.value = ''
    }
  },
)

onMounted(async () => {
  normalizeStep()
  const user = await ensureSession()
  if (!user) return
  await loadSubmission()
})

onBeforeUnmount(() => {
  stopCameraStream()
})

watch(
  () => cameraDialog.value,
  (isOpen) => {
    if (!isOpen) {
      stopCameraStream()
    }
  },
)
</script>

<style scoped>
.verify-page {
  min-height: 100vh;
  background: linear-gradient(160deg, var(--san3a-bg), #e8f4f4);
  padding: 24px 14px;
}

.verify-wrapper {
  max-width: 760px;
  margin: 0 auto;
}

.verify-card {
  background: #fff;
  border-radius: var(--san3a-radius-2xl);
  box-shadow: var(--san3a-shadow-xl);
  border: 1px solid var(--san3a-gray-200);
  padding: 24px;
}

.verify-head h1 {
  font-size: 24px;
  line-height: 1.2;
  margin: 14px 0 6px;
  color: var(--san3a-gray-900);
}

.verify-head p {
  margin: 0;
  color: var(--san3a-gray-600);
  font-size: 14px;
}

.verify-progress {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.progress-item {
  border: 1px solid var(--san3a-gray-200);
  border-radius: 10px;
  padding: 10px;
  text-align: center;
  color: var(--san3a-gray-600);
}

.progress-item span {
  font-size: 18px;
  font-weight: 700;
  display: block;
}

.progress-item.is-active {
  border-color: var(--san3a-primary);
  background: var(--san3a-primary-light);
  color: var(--san3a-primary);
}

.progress-item.is-done {
  border-color: #86efac;
  background: #f0fdf4;
  color: #166534;
}

.capture-frame {
  margin-top: 18px;
  border: 2px dashed var(--san3a-gray-300);
  border-radius: 16px;
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #fbfdfd;
}

.frame-overlay {
  color: var(--san3a-gray-500);
  text-align: center;
  font-size: 14px;
  padding: 14px;
}

.preview-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tips-box {
  margin-top: 14px;
  background: var(--san3a-info-light);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 12px;
  padding: 10px 12px;
  color: var(--san3a-info);
  font-size: 13px;
}

.tips-box ul {
  margin: 6px 0 0;
  padding-left: 18px;
}

.actions-row {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.footer-actions {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.footer-right {
  display: flex;
  gap: 10px;
}

.privacy-note {
  margin-top: 14px;
  border-top: 1px solid var(--san3a-gray-200);
  padding-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--san3a-gray-600);
  font-size: 13px;
}

.hidden-input {
  display: none;
}

.camera-dialog-card {
  width: min(640px, 95vw);
  border-radius: 14px;
}

.camera-preview-wrap {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #111827;
}

.camera-preview {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  display: block;
}

@media (max-width: 640px) {
  .verify-card {
    padding: 16px;
  }

  .verify-progress {
    grid-template-columns: 1fr;
  }

  .footer-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
