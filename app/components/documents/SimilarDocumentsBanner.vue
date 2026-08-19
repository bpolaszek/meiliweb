<template>
  <div class="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5">
    <Icon name="ph:graph" class="size-5 shrink-0 text-primary-600" />
    <span class="font-medium text-nowrap text-gray-600">{{ t('labels.similarTo', { documentId }) }}</span>
    <label class="inline-flex items-center gap-1 text-nowrap text-gray-500">
      {{ t('labels.embedder') }}
      <USelect v-model="embedder" :items="embedders" size="sm" class="w-40" />
    </label>
    <Button v-tippy="t('actions.close')" no-padding no-border no-rounded @click="emit('close')">
      <Icon name="uil:times" class="size-6 text-primary-600" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from '~/components/layout/forms/Button.vue'
import type { DocumentId } from '~/composables'

type Props = {
  documentId: DocumentId
  embedders: Array<string>
}

defineProps<Props>()
const emit = defineEmits<{ close: [] }>()
const embedder = defineModel<string>('embedder', { required: true })

const { t } = useI18n()
</script>

<i18n>
en:
  labels:
    similarTo: 'Documents similar to #{documentId}'
    embedder: 'Embedder:'
  actions:
    close: Back to search
</i18n>
