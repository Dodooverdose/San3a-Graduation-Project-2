<template>
  <ServiceRequestPage serviceType="plumber" :serviceLabel="t('services.plumbing')" serviceIcon="/icons/plumbing.png" />
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import ServiceRequestPage from 'src/components/ServiceRequestPage.vue'

const { t } = useI18n()
</script>
