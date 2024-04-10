<template>
  <div class="flex flex-col items-center justify-center gap-6 py-20">
    <template v-if="requestHasFilters">
      <p class="text-5xl font-light text-gray-700">🤷🏻</p>
      <p class="text-2xl font-light text-gray-700">{{ t('emptyResults') }}</p>
    </template>
    <template v-else>
      <p class="text-5xl font-light text-gray-700">🧐</p>
      <p class="text-2xl font-light text-gray-700">{{ t('emptyIndex') }}</p>
      <Button
        :as="NuxtLink"
        :to="`/indexes/${indexUid}/settings/import-documents`"
        theme="primary"
        icon="ph:upload-fill">
        {{ t('actions.importDocuments') }}
      </Button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import Button from '~/components/layout/forms/Button.vue'
import { useI18n } from 'vue-i18n'

type Props = {
  indexUid: string
  requestHasFilters: boolean
}

defineProps<Props>()
const { t } = useI18n()
</script>

<i18n>
en:
  emptyIndex: Your index is empty.
  emptyResults: Your query produced no results.
  actions:
    importDocuments: Import documents
</i18n>
