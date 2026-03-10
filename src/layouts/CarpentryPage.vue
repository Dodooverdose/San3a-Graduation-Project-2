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
        <img src="/icons/carpentry.png" alt="Carpentry" style="height: 36px; object-fit: contain" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="page-content">
        <div class="request-card">
          <div class="text-h6 q-mb-md">Post a Request</div>

          <q-input
            v-model="requestText"
            type="textarea"
            filled
            outlined
            label="Describe your carpentry issue..."
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
            <q-icon name="warning" color="grey-6" size="sm" class="q-ml-sm" />
          </div>

          <div class="attachments-row q-mb-md">
            <q-btn flat round icon="add_a_photo" color="primary" size="md" @click="openImagePicker">
              <q-tooltip>Attach Photos</q-tooltip>
            </q-btn>
            <q-btn flat round icon="location_on" color="primary" size="md" @click="attachLocation">
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
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()
const imageInputRef = ref(null)
const requestText = ref('')
const selectedImages = ref([])
const location = ref(null)
const appointmentDate = ref(null)
const appointmentTime = ref(null)
const amPm = ref('AM')
const urgency = ref('standard')
const urgencyOptions = [
  { label: 'Standard', value: 'standard' },
  { label: 'Urgent', value: 'urgent' },
]

const goBack = () => {
  router.push('/home')
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
    (pos) => {
      location.value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
      $q.loading.hide()
      $q.notify({ type: 'positive', message: 'Location attached!' })
    },
    () => {
      $q.loading.hide()
      $q.notify({ type: 'negative', message: 'Unable to get your location' })
    },
  )
}

const submitRequest = () => {
  if (!requestText.value.trim()) {
    $q.notify({ type: 'warning', message: 'Please describe your issue' })
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
  urgency.value = 'standard'
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
</style>
