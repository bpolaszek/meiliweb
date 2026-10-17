<template>
  <button
    v-if="findSimilarDocuments"
    type="button"
    v-tippy="t('actions.findSimilar')"
    class="cursor-pointer align-middle text-gray-400 hover:text-primary-600"
    @click="findSimilarDocuments(documentId)">
    <Icon name="ph:graph" class="size-4" />
  </button>
</template>

<script setup lang="ts">
import { useSimilarDocuments, type DocumentId } from '~/composables'

type Props = {
  documentId: DocumentId
}

defineProps<Props>()

const { t } = useI18n()
/** `null` on indexes without embedders — nothing to compare documents on, so nothing to render. */
const findSimilarDocuments = useSimilarDocuments()
</script>

<i18n>
en:
  actions:
    findSimilar: Similar documents
</i18n>
