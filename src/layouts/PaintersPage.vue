<template>
  <ServiceRequestPage serviceType="painter" :serviceLabel="t('services.paintersAndDecorators')" serviceIcon="/icons/painters.png" />
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import ServiceRequestPage from 'src/components/ServiceRequestPage.vue'

const { t } = useI18n()
</script>
