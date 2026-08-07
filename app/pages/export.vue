<template>
  <Layout :title="t('title')" :subtitle="t('subtitle')">
    <Alert v-if="!satisfiesVersion(EXPORT_MIN_VERSION)" theme="warning" :title="t('unavailable.title')">
      {{ t('unavailable.text') }}
    </Alert>
    <ExportForm v-else />
  </Layout>
</template>

<script setup lang="ts">
import Alert from '~/components/layout/Alert.vue'
import ExportForm from '~/components/export/ExportForm.vue'
import { EXPORT_MIN_VERSION } from '~/composables'
import { useVersion } from '~/stores'

const { t } = useI18n()
const { satisfiesVersion } = useVersion()

useHead({ title: t('title') })
</script>

<i18n>
en:
  title: Export
  subtitle: Export all or part of this instance to another Meilisearch instance.
  unavailable:
    title: Export unavailable
    text: Exporting to a remote instance requires Meilisearch 1.16 or later.
</i18n>
