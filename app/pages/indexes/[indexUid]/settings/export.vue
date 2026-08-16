<template>
  <section class="space-y-4">
    <h3 class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('title') }}
    </h3>

    <Alert v-if="!satisfiesVersion(EXPORT_MIN_VERSION)" theme="warning" :title="t('unavailable.title')">
      {{ t('unavailable.text') }}
    </Alert>
    <ExportForm v-else :index-uid="indexUid" />
  </section>
</template>

<script setup lang="ts">
import Alert from '~/components/layout/Alert.vue'
import ExportForm from '~/components/export/ExportForm.vue'
import { EXPORT_MIN_VERSION } from '~/composables'
import { useVersion } from '~/stores'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const { satisfiesVersion } = useVersion()

useHead({ title: `${t('title')} - ${props.indexUid}` })
</script>

<i18n>
en:
  title: Export
  unavailable:
    title: Export unavailable
    text: Exporting to a remote instance requires Meilisearch 1.16 or later.
</i18n>
