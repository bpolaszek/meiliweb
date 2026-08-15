<template>
  <button
    v-if="openDocument"
    type="button"
    v-tippy="t('actions.open')"
    class="cursor-pointer underline decoration-dotted underline-offset-4 hover:text-primary-600"
    @click="openDocument(documentId)">
    <slot />
  </button>
  <slot v-else />
</template>

<script setup lang="ts">
import { useDocumentViewer, type DocumentId } from '~/composables'

type Props = {
  documentId: DocumentId
}

defineProps<Props>()

const { t } = useI18n()
const openDocument = useDocumentViewer()
</script>

<i18n>
en:
  actions:
    open: View, edit or delete this document
</i18n>
