<template>
  <div class="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5">
    <img :src="src" :alt="fileName" class="size-8 shrink-0 rounded object-cover" />
    <span class="font-medium text-nowrap text-gray-600">{{ t('labels.searchingBy', { fileName }) }}</span>
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
import type { MediaBinary } from 'meilisearch'
import Button from '~/components/layout/forms/Button.vue'

type Props = {
  fileName: string
  image: MediaBinary
  embedders: Array<string>
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()
const embedder = defineModel<string>('embedder', { required: true })

const { t } = useI18n()
const src = computed(() => `data:${props.image.mime};base64,${props.image.data}`)
</script>

<i18n>
en:
  labels:
    searchingBy: 'Searching by image: {fileName}'
    embedder: 'Embedder:'
  actions:
    close: Back to search
</i18n>
