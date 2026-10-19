<template>
  <UFormField :label="t('labels.dimensions')" :help="t('hints.dimensions', { name })" required>
    <UInput v-model.number="embedder.dimensions" required type="number" :min="1" class="w-full" />
  </UFormField>
</template>

<script setup lang="ts">
import type { EmbedderFormSettings } from '~/utils'

defineProps<{ name: string }>()
const embedder = defineModel<EmbedderFormSettings>({ required: true })
const { t } = useI18n()
</script>

<i18n>
en:
  labels:
    dimensions: Dimensions
  hints:
    dimensions: "Size of the vectors your documents provide in their _vectors.{name} field. Indexing fails for documents without it, unless set to null."
</i18n>
