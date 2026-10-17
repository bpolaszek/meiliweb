<template>
  <Layout :title="t('title')">
    <PageTabs :items="tabs" />

    <Alert v-if="!satisfiesVersion(EXPORT_MIN_VERSION)" theme="warning" :title="t('unavailable.title')">
      {{ t('unavailable.text') }}
    </Alert>
    <ExportForm v-else />
  </Layout>
</template>

<script setup lang="ts">
import Alert from '~/components/layout/Alert.vue'
import PageTabs from '~/components/layout/PageTabs.vue'
import ExportForm from '~/components/export/ExportForm.vue'
import { EXPORT_MIN_VERSION } from '~/composables'
import { useVersion } from '~/stores'

const { t } = useI18n()
const { satisfiesVersion } = useVersion()

const tabs = [
  { label: t('tabs.dumps'), to: '/backup/dumps' },
  { label: t('tabs.snapshots'), to: '/backup/snapshots' },
  { label: t('tabs.export'), to: '/backup/export' },
]

useHead({ title: t('pageTitle') })
</script>

<i18n>
en:
  title: Backup
  pageTitle: Export
  tabs:
    dumps: Dumps
    snapshots: Snapshots
    export: Export
  unavailable:
    title: Export unavailable
    text: Exporting to a remote instance requires Meilisearch 1.16 or later.
</i18n>
