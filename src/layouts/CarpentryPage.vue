<template>
  <ServiceRequestPage
    serviceType="carpenter"
    :serviceLabel="t('services.carpentry')"
    serviceIcon="/icons/carpentry.png"
  />
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import ServiceRequestPage from 'src/components/ServiceRequestPage.vue'

const { t } = useI18n()
</script>
