<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round dense icon="arrow_back" @click="goBack" />
        <q-toolbar-title style="display: flex; align-items: center">
          Sanعa
          <img src="/icons/White.png" alt="San3a" style="height: 40px; margin-left: 10px" />
        </q-toolbar-title>
        <q-space />
        <img
          src="/icons/electrical.png"
          alt="Electrical"
          style="height: 36px; object-fit: contain"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="page-content">
        <div class="request-card">
          <q-tabs
            v-model="activeTab"
            dense
            class="text-primary q-mb-md"
            align="justify"
            narrow-indicator
          >
            <q-tab name="post" label="Post Request" icon="edit" />
            <q-tab name="history" label="Request History" icon="history" />
          </q-tabs>

          <q-separator class="q-mb-md" />

          <!-- POST REQUEST TAB -->
          <div v-if="activeTab === 'post'">
            <div class="text-h6 q-mb-md">Post a Request</div>

            <q-input
              v-model="requestText"
              type="textarea"
              filled
              outlined
              label="Describe your electrical issue..."
              autogrow
              :input-style="{ minHeight: '150px' }"
              class="q-mb-md"
            />

            <div class="date-time-row q-mb-md">
              <q-input
                v-model="appointmentDate"
                filled
                outlined
                label="Appointment Date"
                class="date-input"
              >
                <template #prepend>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="appointmentDate" mask="YYYY-MM-DD">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>

              <q-input
                v-model="appointmentTime"
                filled
                outlined
                label="Appointment Time"
                class="time-input"
              >
                <template #prepend>
                  <q-icon name="access_time" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-time v-model="appointmentTime" mask="hh:mm">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>

              <q-select
                v-model="amPm"
                :options="['AM', 'PM']"
                filled
                outlined
                label="AM/PM"
                class="ampm-select"
              />
            </div>

            <q-select
              v-model="district"
              :options="cairoDistricts"
              label="District"
              filled
              outlined
              clearable
              class="q-mb-md"
            >
              <template #prepend>
                <q-icon name="location_city" />
              </template>
            </q-select>

            <div class="urgency-row q-mb-md">
              <q-select
                v-model="urgency"
                :options="urgencyOptions"
                label="Urgency"
                filled
                outlined
                emit-value
                map-options
                style="flex: 1"
              />
              <q-icon
                name="warning"
                :color="urgency === 'urgent' ? 'amber' : 'grey-6'"
                size="sm"
                class="q-ml-sm"
              />
            </div>

            <div class="payment-row q-mb-md">
              <div class="text-subtitle2 q-mb-sm">Payment Method</div>
              <div class="payment-options">
                <q-btn
                  :outline="paymentMethod !== 'cash'"
                  :color="paymentMethod === 'cash' ? 'primary' : 'grey-7'"
                  class="payment-btn"
                  @click="selectCash"
                >
                  <q-icon
                    name="payments"
                    :class="['q-mr-sm', { 'cash-count-anim': cashAnimating }]"
                  />
                  Cash
                </q-btn>
                <q-btn
                  :outline="paymentMethod !== 'instapay'"
                  :color="paymentMethod === 'instapay' ? 'primary' : 'grey-7'"
                  class="payment-btn"
                  @click="selectInstapay"
                >
                  <q-icon
                    name="credit_card"
                    :class="['q-mr-sm', { 'card-flip-anim': cardFlipping }]"
                  />
                  Instapay
                </q-btn>
              </div>
            </div>

            <div class="attachments-row q-mb-md">
              <q-btn
                flat
                round
                icon="add_a_photo"
                color="primary"
                size="md"
                @click="openImagePicker"
              >
                <q-tooltip>Attach Photos</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                icon="location_on"
                color="primary"
                size="md"
                @click="attachLocation"
              >
                <q-tooltip>Attach Location</q-tooltip>
              </q-btn>
              <q-space />
              <q-btn round color="primary" icon="send" size="md" @click="submitRequest">
                <q-tooltip>Submit Request</q-tooltip>
              </q-btn>
            </div>

            <input
              ref="imageInputRef"
              type="file"
              accept="image/*"
              multiple
              class="hidden-input"
              @change="onImagesSelected"
            />

            <div v-if="selectedImages.length" class="image-preview q-mb-md">
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

            <div v-if="location" class="location-info q-mb-sm">
              <q-icon name="location_on" color="positive" size="sm" />
              <span class="q-ml-xs">{{ location }}</span>
              <q-btn
                flat
                round
                dense
                icon="close"
                size="xs"
                color="negative"
                @click="location = null"
              />
            </div>
          </div>

          <!-- REQUEST HISTORY TAB -->
          <div v-if="activeTab === 'history'">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6">Request History</div>
              <q-badge
                v-if="!historyLoading && requestHistory.length"
                color="primary"
                :label="`${requestHistory.length} request${requestHistory.length > 1 ? 's' : ''}`"
                class="text-body2 q-pa-sm"
              />
            </div>

            <div v-if="historyLoading" class="text-center q-pa-xl">
              <q-spinner color="primary" size="48px" />
              <div class="q-mt-md text-grey-7">Loading your requests...</div>
            </div>

            <div v-else-if="historyError" class="text-center q-pa-xl">
              <q-icon name="error" size="64px" color="negative" />
              <div class="text-h6 text-negative q-mt-md">Failed to load requests</div>
              <div class="text-body2 text-grey-7 q-mt-sm">{{ historyError }}</div>
              <q-btn
                flat
                color="primary"
                label="Retry"
                icon="refresh"
                class="q-mt-sm"
                @click="fetchHistory"
              />
            </div>

            <div v-else-if="requestHistory.length === 0" class="text-center q-pa-xl">
              <q-icon name="inbox" size="64px" color="grey-5" />
              <div class="text-h6 text-grey-6 q-mt-md">You haven't posted any requests yet.</div>
              <q-btn
                flat
                color="primary"
                label="Post your first request"
                icon="edit"
                class="q-mt-sm"
                @click="activeTab = 'post'"
              />
            </div>

            <div v-else class="row q-col-gutter-md">
              <div
                v-for="req in requestHistory"
                :key="req.request_id"
                class="col-12 col-sm-6 col-md-6"
              >
                <q-card bordered flat class="history-card">
                  <q-card-section>
                    <div class="row items-center justify-between q-mb-sm">
                      <div class="text-subtitle1 text-weight-bold ellipsis" style="max-width: 70%">
                        Request #{{ req.request_id }}
                      </div>
                      <q-badge
                        :color="statusColor(req.request_status)"
                        :label="req.request_status || 'pending'"
                      />
                    </div>
                    <div class="text-body2 q-mb-md" style="white-space: pre-line">
                      {{ req.description_of_issue || 'No description' }}
                    </div>

                    <q-separator class="q-mb-sm" />

                    <div class="history-details">
                      <div v-if="req.request_date" class="detail-row">
                        <q-icon name="event" size="xs" color="grey-7" />
                        <span>{{ formatDate(req.request_date) }}</span>
                      </div>
                      <div v-if="req.schedule_time" class="detail-row">
                        <q-icon name="schedule" size="xs" color="grey-7" />
                        <span>Scheduled: {{ formatDate(req.schedule_time) }}</span>
                      </div>
                      <div v-if="req.service_location" class="detail-row">
                        <q-icon name="location_on" size="xs" color="grey-7" />
                        <span>{{ req.service_location }}</span>
                      </div>
                      <div v-if="req.payment_method" class="detail-row">
                        <q-icon name="payments" size="xs" color="grey-7" />
                        <span class="text-capitalize">{{ req.payment_method }}</span>
                      </div>
                    </div>
                  </q-card-section>

                  <q-separator v-if="req.urgency || req.customer_price || req.fixer_price" />

                  <q-card-section
                    v-if="req.urgency || req.customer_price || req.fixer_price"
                    class="q-py-sm"
                  >
                    <div class="row items-center q-gutter-sm">
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
                      >
                        {{ req.customer_price }} EGP
                      </q-chip>
                      <q-chip
                        v-if="req.fixer_price"
                        dense
                        size="sm"
                        color="orange-2"
                        text-color="orange-9"
                        icon="build"
                      >
                        {{ req.fixer_price }} EGP
                      </q-chip>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const router = useRouter()
const $q = useQuasar()
const imageInputRef = ref(null)
const requestText = ref('')
const currentUserId = ref(null)
const activeTab = ref('post')
const requestHistory = ref([])
const historyLoading = ref(false)

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
    if (customer) {
      currentUserId.value = customer.user_id
    }
    if (!currentUserId.value) {
      const { data: tech } = await supabase
        .from('technician')
        .select('technician_id')
        .ilike('email', user.email)
        .maybeSingle()
      if (tech) {
        currentUserId.value = tech.technician_id
      }
    }
  }
  if (currentUserId.value) {
    await fetchHistory()
  }
})
const selectedImages = ref([])
const location = ref(null)
const appointmentDate = ref(null)
const appointmentTime = ref(null)
const amPm = ref('AM')
const paymentMethod = ref('cash')
const cashAnimating = ref(false)
const cardFlipping = ref(false)
const district = ref(null)
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
const urgency = ref('standard')
const urgencyOptions = [
  { label: 'Standard', value: 'standard' },
  { label: 'Urgent', value: 'urgent' },
]

const selectInstapay = () => {
  paymentMethod.value = 'instapay'
  cardFlipping.value = false
  nextTick(() => {
    cardFlipping.value = true
    setTimeout(() => {
      cardFlipping.value = false
    }, 600)
  })
}

const selectCash = () => {
  paymentMethod.value = 'cash'
  cashAnimating.value = false
  nextTick(() => {
    cashAnimating.value = true
    setTimeout(() => {
      cashAnimating.value = false
    }, 700)
  })
}

const goBack = () => {
  router.push('/home')
}

const historyError = ref(null)

const fetchHistory = async () => {
  if (!currentUserId.value) return
  historyLoading.value = true
  historyError.value = null
  const { data, error } = await supabase
    .from('request')
    .select('*')
    .eq('user_id', currentUserId.value)
    .eq('service_type', 'electrician')
    .order('request_date', { ascending: false })
  if (error) {
    historyError.value = error.message
  } else {
    requestHistory.value = data || []
  }
  historyLoading.value = false
}

watch(activeTab, (tab) => {
  if (tab === 'history') fetchHistory()
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  // Supabase timestamps are UTC — append Z so the browser converts to local time
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
  const map = { pending: 'orange', accepted: 'blue', completed: 'green', cancelled: 'red' }
  return map[status?.toLowerCase()] || 'grey'
}

const openImagePicker = () => {
  imageInputRef.value?.click()
}

const onImagesSelected = (event) => {
  const files = Array.from(event.target.files || [])
  files.forEach((file) => {
    const url = URL.createObjectURL(file)
    selectedImages.value.push({ file, url })
  })
  event.target.value = ''
}

const removeImage = (index) => {
  URL.revokeObjectURL(selectedImages.value[index].url)
  selectedImages.value.splice(index, 1)
}

const attachLocation = () => {
  if (!navigator.geolocation) {
    $q.notify({ type: 'negative', message: 'Geolocation is not supported by your browser' })
    return
  }
  $q.loading.show({ message: 'Getting location...' })
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          { headers: { 'Accept-Language': 'en' } },
        )
        const data = await res.json()
        location.value = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
      } catch {
        location.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
      }
      $q.loading.hide()
      $q.notify({ type: 'positive', message: 'Location attached!' })
    },
    () => {
      $q.loading.hide()
      $q.notify({ type: 'negative', message: 'Unable to get your location' })
    },
  )
}

const submitRequest = async () => {
  const isIncomplete =
    !requestText.value.trim() ||
    !appointmentDate.value ||
    !appointmentTime.value ||
    !district.value ||
    !urgency.value ||
    !paymentMethod.value

  if (isIncomplete) {
    $q.notify({ type: 'warning', message: 'Fill the rest of the form' })
    return
  }
  if (!currentUserId.value) {
    $q.notify({ type: 'negative', message: 'You must be signed in to submit a request' })
    return
  }

  // Build schedule_time from date + time + AM/PM
  let scheduleTime = null
  if (appointmentDate.value && appointmentTime.value) {
    const [hh, mm] = appointmentTime.value.split(':')
    let hours = parseInt(hh, 10)
    if (amPm.value === 'PM' && hours < 12) hours += 12
    if (amPm.value === 'AM' && hours === 12) hours = 0
    scheduleTime = `${appointmentDate.value}T${String(hours).padStart(2, '0')}:${mm}:00`
  }

  const { error } = await supabase.from('request').insert({
    description_of_issue: requestText.value.trim(),
    schedule_time: scheduleTime,
    service_location: district.value || null,
    payment_method: paymentMethod.value,
    urgency: urgency.value,
    user_id: currentUserId.value,
    service_type: 'electrician',
  })

  if (error) {
    $q.notify({ type: 'negative', message: 'Failed to submit request: ' + error.message })
    return
  }

  $q.notify({ type: 'positive', message: 'Request submitted successfully!' })
  requestText.value = ''
  selectedImages.value.forEach((img) => URL.revokeObjectURL(img.url))
  selectedImages.value = []
  location.value = null
  appointmentDate.value = null
  appointmentTime.value = null
  amPm.value = 'AM'
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
.page-content {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
}

.request-card {
  width: 100%;
  max-width: 600px;
  margin-top: 24px;
}

.date-time-row {
  display: flex;
  gap: 12px;
}
.date-time-row .date-input,
.date-time-row .time-input {
  flex: 1;
}
.date-time-row .ampm-select {
  flex: 0 0 90px;
}

.payment-row {
  display: flex;
  flex-direction: column;
}

.payment-options {
  display: flex;
  gap: 12px;
}

.payment-btn {
  flex: 1;
  font-weight: 600;
}

@keyframes cash-count {
  0% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
  15% {
    transform: translateY(-4px) rotate(-12deg) scale(1.25);
  }
  30% {
    transform: translateY(0) rotate(12deg) scale(1.15);
  }
  50% {
    transform: translateY(-4px) rotate(-8deg) scale(1.2);
  }
  70% {
    transform: translateY(0) rotate(8deg) scale(1.1);
  }
  85% {
    transform: translateY(-2px) rotate(-4deg) scale(1.05);
  }
  100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
}

.cash-count-anim {
  animation: cash-count 0.7s ease;
  display: inline-block;
}

@keyframes card-flip {
  0% {
    transform: perspective(400px) rotateY(0deg);
  }
  40% {
    transform: perspective(400px) rotateY(-180deg) scale(1.2);
  }
  70% {
    transform: perspective(400px) rotateY(-340deg) scale(1.05);
  }
  100% {
    transform: perspective(400px) rotateY(-360deg);
  }
}

.card-flip-anim {
  animation: card-flip 0.6s ease;
  display: inline-block;
}

.urgency-row {
  display: flex;
  align-items: center;
}

.attachments-row {
  display: flex;
  align-items: center;
}

.hidden-input {
  display: none;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
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
  font-size: 13px;
  color: #666;
}

.history-card {
  border-radius: 12px;
  transition: box-shadow 0.2s;
}
.history-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.history-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
}
</style>
