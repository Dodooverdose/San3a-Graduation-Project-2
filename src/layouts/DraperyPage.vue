<template>
  <ServiceRequestPage serviceType="drapery_seamstress" :serviceLabel="t('services.draperySeamstress')" serviceIcon="/icons/drapery.png" />
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import ServiceRequestPage from 'src/components/ServiceRequestPage.vue'

const { t } = useI18n()
</script>
