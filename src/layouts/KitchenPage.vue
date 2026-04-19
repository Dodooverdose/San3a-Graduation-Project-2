<template>
  <ServiceRequestPage
    serviceType="kitchen_fitter"
    :serviceLabel="t('services.kitchenUtilities')"
    serviceIcon="/icons/kitchen.png"
  />
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import ServiceRequestPage from 'src/components/ServiceRequestPage.vue'

const { t } = useI18n()
</script>
