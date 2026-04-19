<template>
  <ServiceRequestPage
    serviceType="electrician"
    :serviceLabel="t('services.electrical')"
    serviceIcon="/icons/electrical.png"
  />
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import ServiceRequestPage from 'src/components/ServiceRequestPage.vue'

const { t } = useI18n()
</script>
