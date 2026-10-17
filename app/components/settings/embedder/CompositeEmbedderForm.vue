<template>
  <p class="text-sm text-gray-600">{{ t('hints.composite') }}</p>

  <section
    v-for="part of PARTS_DISPLAY_ORDER"
    :key="part"
    class="space-y-4 rounded-lg border border-dashed border-gray-300 p-4">
    <header>
      <h4 class="font-semibold text-gray-900">{{ t(`parts.${part}.title`) }}</h4>
      <p class="text-xs text-gray-600">{{ t(`parts.${part}.description`) }}</p>
    </header>

    <UFormField :label="t('labels.source')" required>
      <USelect v-model="embedder[part].source" :items="sourceItems" class="w-full sm:w-1/2" />
    </UFormField>

    <EmbedderSourceForm v-model="embedder[part]" :name :part :multimodal />
    <EmbedderDocumentTemplateFields v-model="embedder[part]" :part />
  </section>
</template>

<script setup lang="ts">
import EmbedderDocumentTemplateFields from '~/components/settings/embedder/EmbedderDocumentTemplateFields.vue'
import EmbedderSourceForm from '~/components/settings/embedder/EmbedderSourceForm.vue'
import {
  COMPOSITE_EMBEDDER_PARTS,
  createEmbedderFormSettings,
  SUB_EMBEDDER_SOURCES,
  type EmbedderFormSettings,
} from '~/utils'

defineProps<{
  name: string
  multimodal: boolean
}>()
const embedder = defineModel<EmbedderFormSettings>({ required: true })
const { t } = useI18n()

// An embedder switched to the composite source has no parts yet
for (const part of COMPOSITE_EMBEDDER_PARTS) {
  embedder.value[part] ??= createEmbedderFormSettings()
}

// Documents get indexed before they can be searched
const PARTS_DISPLAY_ORDER = ['indexingEmbedder', 'searchEmbedder'] as const

const sourceItems = SUB_EMBEDDER_SOURCES.map((value) => ({ value, label: t(`sources.${value}`) }))
</script>

<i18n>
en:
  hints:
    composite: Uses one embedder to index documents and another one to embed search queries, e.g. a remote API for bulk indexing and a local model for fast searches. Both must produce exactly the same vectors for the same text.
  labels:
    source: Source
  parts:
    indexingEmbedder:
      title: Indexing embedder
      description: Embeds documents when they are indexed.
    searchEmbedder:
      title: Search embedder
      description: Embeds search queries.
  sources:
    openAi: OpenAI
    huggingFace: Hugging Face (local)
    ollama: Ollama
    rest: REST
</i18n>
