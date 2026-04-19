<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Header -->
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <q-btn flat round dense icon="arrow_back" class="back-btn" @click="goBack" />
        <div class="header-brand">
          <div class="header-brand-icon">
            <img src="/icons/White.png" alt="Sanعa logo" class="brand-logo-mark" />
          </div>
          <span class="header-brand-name">Sanعa</span>
        </div>
        <q-space />
        <div class="header-service-badge">
          <img :src="serviceIcon" :alt="serviceLabel" class="header-service-img" />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="page-content">
        <div class="request-shell">
          <!-- Tabs -->
          <q-tabs
            v-model="activeTab"
            dense
            no-caps
            class="section-tabs"
            active-color="primary"
            indicator-color="primary"
            align="justify"
          >
            <q-tab name="post" :label="$t('serviceRequest.postRequest')" icon="edit" />
            <q-tab name="history" :label="$t('serviceRequest.requestHistory')" icon="history" />
          </q-tabs>

          <!-- POST REQUEST TAB -->
          <div v-if="activeTab === 'post'" class="tab-content san3a-animate-in">
            <h2 class="tab-heading">{{ $t('serviceRequest.postARequest') }}</h2>

            <div class="form-grid">
              <div class="field-group full-width">
                <label class="field-label"
                  >{{ $t('serviceRequest.describeIssue', { service: serviceLabel.toLowerCase() }) }}</label
                >
                <q-input
                  v-model="requestText"
                  type="textarea"
                  outlined
                  autogrow
                  :input-style="{ minHeight: '120px' }"
                  :placeholder="$t('serviceRequest.descriptionPlaceholder')"
                  class="san3a-input"
                />
              </div>

              <div class="field-group">
                <label class="field-label">{{ $t('serviceRequest.appointmentDate') }}</label>
                <q-input
                  v-model="appointmentDate"
                  outlined
                  dense
                  class="san3a-input"
                  :placeholder="$t('serviceRequest.selectDate')"
                >
                  <template #prepend>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="appointmentDate" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup :label="$t('common.close')" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="field-group">
                <label class="field-label">{{ $t('serviceRequest.appointmentTime') }}</label>
                <q-input
                  v-model="appointmentTime"
                  outlined
                  dense
                  class="san3a-input"
                  :placeholder="$t('serviceRequest.timePlaceholder')"
                >
                  <template #prepend>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time v-model="appointmentTime" mask="hh:mm A">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup :label="$t('common.close')" color="primary" flat />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="field-group full-width">
                <label class="field-label">{{ $t('serviceRequest.district') }}</label>
                <q-select
                  v-model="district"
                  :options="cairoDistricts"
                  outlined
                  dense
                  clearable
                  class="san3a-input"
                  :placeholder="$t('serviceRequest.selectDistrict')"
                >
                  <template #prepend><q-icon name="location_city" /></template>
                </q-select>
              </div>

              <div class="field-group">
                <label class="field-label">{{ $t('serviceRequest.urgency') }}</label>
                <q-select
                  v-model="urgency"
                  :options="urgencyOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="san3a-input"
                />
              </div>

              <div class="field-group">
                <label class="field-label">{{ $t('serviceRequest.paymentMethod') }}</label>
                <div class="payment-options">
                  <q-btn
                    :outline="paymentMethod !== 'cash'"
                    :color="paymentMethod === 'cash' ? 'primary' : 'grey-7'"
                    no-caps
                    class="payment-btn"
                    @click="paymentMethod = 'cash'"
                  >
                    <q-icon name="payments" class="q-mr-sm" /> {{ $t('serviceRequest.cash') }}
                  </q-btn>
                  <q-btn
                    :outline="paymentMethod !== 'instapay'"
                    :color="paymentMethod === 'instapay' ? 'primary' : 'grey-7'"
                    no-caps
                    class="payment-btn"
                    @click="paymentMethod = 'instapay'"
                  >
                    <q-icon name="credit_card" class="q-mr-sm" /> {{ $t('serviceRequest.instapay') }}
                  </q-btn>
                </div>
              </div>
            </div>

            <!-- Attachments -->
            <div class="attachments-bar">
              <q-btn
                flat
                round
                icon="add_a_photo"
                color="primary"
                size="md"
                @click="openImagePicker"
              >
                <q-tooltip>{{ $t('serviceRequest.attachPhotos') }}</q-tooltip>
              </q-btn>
              <q-space />
              <q-btn
                unelevated
                color="primary"
                icon="send"
                :label="$t('common.submit')"
                no-caps
                class="submit-request-btn"
                @click="submitRequest"
              />
            </div>

            <input
              ref="imageInputRef"
              type="file"
              accept="image/*"
              multiple
              class="hidden-input"
              @change="onImagesSelected"
            />

            <div v-if="selectedImages.length" class="image-preview">
              <div v-for="(img, i) in selectedImages" :key="i" class="preview-item">
                <img :src="img.url" alt="Attached image" />
                <q-btn
                  flat
                  round
                  dense
                  icon="close"
                  size="xs"
                  color="negative"
                  class="remove-btn"
                  @click="removeImage(i)"
                />
              </div>
            </div>
          </div>

          <!-- REQUEST HISTORY TAB -->
          <div v-if="activeTab === 'history'" class="tab-content san3a-animate-in">
            <div class="tab-header">
              <h2 class="tab-heading">{{ $t('serviceRequest.requestHistory') }}</h2>
              <q-badge
                v-if="!historyLoading && requestHistory.length"
                color="primary"
                :label="`${requestHistory.length} request${requestHistory.length > 1 ? 's' : ''}`"
                class="q-pa-sm"
              />
            </div>

            <div v-if="historyLoading" class="state-center">
              <q-spinner color="primary" size="48px" />
              <div class="q-mt-md text-grey-7">{{ $t('serviceRequest.loadingRequests') }}</div>
            </div>

            <div v-else-if="historyError" class="state-center">
              <q-icon name="error" size="64px" color="negative" />
              <div class="state-title">{{ $t('serviceRequest.failedToLoad') }}</div>
              <div class="state-sub">{{ historyError }}</div>
              <q-btn
                flat
                color="primary"
                :label="$t('common.retry')"
                icon="refresh"
                class="q-mt-sm"
                @click="fetchHistory"
              />
            </div>

            <div v-else-if="requestHistory.length === 0" class="state-center">
              <q-icon name="inbox" size="64px" color="grey-4" />
              <div class="state-title">{{ $t('serviceRequest.noRequestsYet') }}</div>
              <q-btn
                flat
                color="primary"
                :label="$t('serviceRequest.postFirstRequest')"
                icon="edit"
                class="q-mt-sm"
                @click="activeTab = 'post'"
              />
            </div>

            <div v-else class="history-grid">
              <div v-for="req in requestHistory" :key="req.request_id" class="history-card">
                <div class="history-card-header">
                  <span class="history-id">Request #{{ req.request_id }}</span>
                  <q-badge
                    :color="statusColor(req.request_status)"
                    :label="req.request_status || 'pending'"
                  />
                </div>
                <p class="history-desc">{{ req.description_of_issue || $t('common.noDescription') }}</p>
                <div class="history-meta">
                  <div v-if="req.request_date" class="meta-item">
                    <q-icon name="event" size="14px" color="grey-6" />
                    <span>{{ formatDate(req.request_date) }}</span>
                  </div>
                  <div v-if="req.schedule_time" class="meta-item">
                    <q-icon name="schedule" size="14px" color="grey-6" />
                    <span>{{ formatDate(req.schedule_time) }}</span>
                  </div>
                  <div v-if="req.service_location" class="meta-item">
                    <q-icon name="location_on" size="14px" color="grey-6" />
                    <span>{{ req.service_location }}</span>
                  </div>
                  <div v-if="req.payment_method" class="meta-item">
                    <q-icon name="payments" size="14px" color="grey-6" />
                    <span class="text-capitalize">{{ req.payment_method }}</span>
                  </div>
                </div>
                <div
                  v-if="req.urgency || req.customer_price || req.fixer_price"
                  class="history-chips"
                >
                  <q-badge
                    v-if="req.urgency"
                    :color="req.urgency === 'urgent' ? 'red' : 'blue'"
                    :label="req.urgency"
                  />
                  <q-chip
                    v-if="req.customer_price"
                    dense
                    size="sm"
                    color="green-2"
                    text-color="green-9"
                    icon="person"
                    >{{ req.customer_price }} EGP</q-chip
                  >
                  <q-chip
                    v-if="req.fixer_price"
                    dense
                    size="sm"
                    color="orange-2"
                    text-color="orange-9"
                    icon="build"
                    >{{ req.fixer_price }} EGP</q-chip
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { supabase } from 'src/boot/supabase'

const { t } = useI18n()

const props = defineProps({
  serviceType: { type: String, required: true },
  serviceLabel: { type: String, required: true },
  serviceIcon: { type: String, required: true },
})

const router = useRouter()
const $q = useQuasar()
const imageInputRef = ref(null)
const requestText = ref('')
const currentUserId = ref(null)
const activeTab = ref('post')
const requestHistory = ref([])
const historyLoading = ref(false)
const historyError = ref(null)
const selectedImages = ref([])
const appointmentDate = ref(null)
const appointmentTime = ref(null)
const paymentMethod = ref('cash')
const district = ref(null)
const urgency = ref('standard')

const urgencyOptions = computed(() => [
  { label: t('serviceRequest.standard'), value: 'standard' },
  { label: t('common.urgent'), value: 'urgent' },
])

const cairoDistricts = [
  'Downtown / Wust El-Balad',
  'Abdeen',
  'Azbakeya',
  "Bab El-Sha'reya",
  'El-Gamaliya',
  'El-Mosky',
  'El-Darb El-Ahmar',
  'El-Khalifa',
  'El-Sayeda Zeinab',
  'Zamalek',
  'Garden City',
  'Bulaq',
  'Shubra',
  'Rod El-Farag',
  'El-Sharabiya',
  'El-Zawya El-Hamra',
  'El-Wayli',
  'Abbassia',
  'Heliopolis / Masr El-Gedida',
  'Nasr City',
  'Ain Shams',
  'El-Matareya',
  'El-Marg',
  'El-Salam',
  'Maadi',
  'Misr El-Kadima / Old Cairo',
  'Basatin',
  'Helwan',
  '15th of May City',
  'Tura',
  'New Cairo / El-Tagammu',
  'Rehab City',
  'Madinaty',
  'Shorouk City',
  'Obour City',
  'Badr City',
  'Dokki',
  'Mohandessin',
  'Agouza',
  'Imbaba',
  'Bulaq El-Dakrour',
  'El-Haram',
  'Faisal',
  'El-Omraniya',
  'Giza',
  '6th of October City',
  'Sheikh Zayed',
  'Hadayek El-Ahram',
]

const goBack = () => router.push('/home')

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const utcStr = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  const d = new Date(utcStr)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusColor = (status) => {
  const map = {
    pending: 'orange',
    accepted: 'blue',
    'on-going': 'purple',
    completed: 'green',
    cancelled: 'red',
  }
  return map[status?.toLowerCase()] || 'grey'
}

onMounted(async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const { data: customer } = await supabase
      .from('users')
      .select('user_id')
      .ilike('email', user.email)
      .maybeSingle()
    if (customer) currentUserId.value = customer.user_id
    if (!currentUserId.value) {
      const { data: tech } = await supabase
        .from('technician')
        .select('technician_id')
        .ilike('email', user.email)
        .maybeSingle()
      if (tech) currentUserId.value = tech.technician_id
    }
  }
  if (currentUserId.value) await fetchHistory()
})

const fetchHistory = async () => {
  if (!currentUserId.value) return
  historyLoading.value = true
  historyError.value = null
  const { data, error } = await supabase
    .from('request')
    .select('*')
    .eq('user_id', currentUserId.value)
    .eq('service_type', props.serviceType)
    .order('request_date', { ascending: false })
  if (error) historyError.value = error.message
  else requestHistory.value = data || []
  historyLoading.value = false
}

watch(activeTab, (tab) => {
  if (tab === 'history') fetchHistory()
})

const openImagePicker = () => imageInputRef.value?.click()

const onImagesSelected = (event) => {
  const files = Array.from(event.target.files || [])
  files.forEach((file) => {
    selectedImages.value.push({ file, url: URL.createObjectURL(file) })
  })
  event.target.value = ''
}

const removeImage = (index) => {
  URL.revokeObjectURL(selectedImages.value[index].url)
  selectedImages.value.splice(index, 1)
}

const submitRequest = async () => {
  if (
    !requestText.value.trim() ||
    !appointmentDate.value ||
    !appointmentTime.value ||
    !district.value ||
    !urgency.value ||
    !paymentMethod.value
  ) {
    $q.notify({ type: 'warning', message: t('serviceRequest.fillForm') })
    return
  }
  if (!currentUserId.value) {
    $q.notify({ type: 'negative', message: t('serviceRequest.mustBeSignedIn') })
    return
  }

  let scheduleTime = null
  if (appointmentDate.value && appointmentTime.value) {
    const [time, period] = appointmentTime.value.split(' ')
    const [hh, mm] = time.split(':')
    let hours = parseInt(hh, 10)
    if (period === 'PM' && hours < 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    scheduleTime = `${appointmentDate.value}T${String(hours).padStart(2, '0')}:${mm}:00`
  }

  let attachedImageUrl = null
  if (selectedImages.value.length > 0) {
    const imgFile = selectedImages.value[0].file
    const fileExt = imgFile.name.split('.').pop()
    const filePath = `${currentUserId.value}/${Date.now()}.${fileExt}`
    const { error: uploadErr } = await supabase.storage
      .from('request-images')
      .upload(filePath, imgFile)
    if (uploadErr) {
      $q.notify({ type: 'negative', message: 'Failed to upload image: ' + uploadErr.message })
      return
    }
    const { data: urlData } = supabase.storage.from('request-images').getPublicUrl(filePath)
    attachedImageUrl = urlData.publicUrl
  }

  const { error } = await supabase.from('request').insert({
    description_of_issue: requestText.value.trim(),
    schedule_time: scheduleTime,
    service_location: district.value || null,
    payment_method: paymentMethod.value,
    urgency: urgency.value,
    user_id: currentUserId.value,
    service_type: props.serviceType,
    request_status: 'pending',
    attached_image: attachedImageUrl,
  })

  if (error) {
    $q.notify({ type: 'negative', message: 'Failed to submit request: ' + error.message })
    return
  }

  $q.notify({ type: 'positive', message: 'Request submitted successfully!' })
  requestText.value = ''
  selectedImages.value.forEach((img) => URL.revokeObjectURL(img.url))
  selectedImages.value = []
  appointmentDate.value = null
  appointmentTime.value = null
  paymentMethod.value = 'cash'
  urgency.value = 'standard'
  district.value = null
  fetchHistory()
}

onBeforeUnmount(() => {
  selectedImages.value.forEach((img) => URL.revokeObjectURL(img.url))
})
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, var(--san3a-primary), var(--san3a-primary-hover)) !important;
}
.app-toolbar {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}
.back-btn {
  color: rgba(255, 255, 255, 0.9) !important;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}
.header-brand-name {
  color: #fff;
  font-weight: 800;
  font-size: 20px;
}
.header-service-badge {
  display: inline-flex;
}
.header-service-img {
  height: 36px;
  object-fit: contain;
}

.page-content {
  display: flex;
  justify-content: center;
  padding: 24px 16px 40px;
  background: var(--san3a-bg);
}

.request-shell {
  width: 100%;
  max-width: 700px;
}

.section-tabs {
  margin-bottom: 24px;
  border-radius: var(--san3a-radius-lg);
  background: var(--san3a-gray-100);
}
.section-tabs :deep(.q-tab) {
  border-radius: var(--san3a-radius-md);
  font-weight: 600;
}

.tab-content {
  display: block;
}

.tab-heading {
  font-size: 22px;
  font-weight: 800;
  color: var(--san3a-gray-900);
  margin: 0 0 20px;
}

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.tab-header .tab-heading {
  margin-bottom: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.full-width {
  grid-column: 1 / -1;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--san3a-gray-700);
}

.san3a-input :deep(.q-field__control) {
  border-radius: var(--san3a-radius-md) !important;
}

.time-row {
  display: flex;
  gap: 10px;
}
.time-field {
  flex: 1;
}
.ampm-field {
  flex: 0 0 80px;
}

.payment-options {
  display: flex;
  gap: 10px;
}
.payment-btn {
  flex: 1;
  font-weight: 600;
}

.attachments-bar {
  display: flex;
  align-items: center;
  margin-top: 20px;
  padding: 12px 0;
  border-top: 1px solid var(--san3a-gray-200);
}

.submit-request-btn {
  padding: 8px 24px !important;
  font-weight: 700;
}

.hidden-input {
  display: none;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}
.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: var(--san3a-radius-md);
  overflow: hidden;
  border: 1px solid var(--san3a-gray-200);
}
.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(255, 255, 255, 0.8);
}

.location-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--san3a-gray-600);
  margin-top: 12px;
}

.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  min-height: 200px;
}
.state-title {
  margin-top: 16px;
  font-size: 18px;
  font-weight: 700;
  color: var(--san3a-gray-700);
}
.state-sub {
  margin-top: 6px;
  font-size: 14px;
  color: var(--san3a-gray-400);
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.history-card {
  background: #fff;
  border: 1px solid var(--san3a-gray-200);
  border-radius: var(--san3a-radius-xl);
  padding: 20px;
  transition: box-shadow 0.2s;
}
.history-card:hover {
  box-shadow: var(--san3a-shadow-md);
}

.history-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.history-id {
  font-size: 15px;
  font-weight: 700;
  color: var(--san3a-gray-900);
}

.history-desc {
  font-size: 14px;
  color: var(--san3a-gray-700);
  line-height: 1.5;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--san3a-gray-500);
}

.history-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .history-grid {
    grid-template-columns: 1fr;
  }
}
</style>
