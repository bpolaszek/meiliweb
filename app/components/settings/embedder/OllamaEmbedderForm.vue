<template>
  <UFormField :label="t('labels.url')" :help="t('hints.url')">
    <UInput
      v-model="embedder.url"
      type="url"
      placeholder="http://localhost:11434/api/embed"
      autocomplete="off"
      class="w-full" />
  </UFormField>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <UFormField :label="t('labels.model')" required>
      <UInput
        v-model="embedder.model"
        required
        :list="modelsListId"
        placeholder="nomic-embed-text"
        autocomplete="off"
        class="w-full" />
      <datalist :id="modelsListId">
        <option v-for="model of OLLAMA_MODELS" :key="model" :value="model" />
      </datalist>
    </UFormField>

    <UFormField :label="t('labels.dimensions')" :help="t('hints.dimensions')">
      <UInput v-model.number="embedder.dimensions" type="number" :min="1" class="w-full" />
    </UFormField>
  </div>

  <UFormField :label="t('labels.apiKey')" :help="t('hints.apiKey')">
    <UInput v-model="embedder.apiKey" type="password" autocomplete="off" class="w-full" />
  </UFormField>
</template>

<script setup lang="ts">
import type { EmbedderFormSettings } from '~/utils'

const OLLAMA_MODELS = [
  'embeddinggemma',
  'qwen3-embedding',
  'nomic-embed-text',
  'mxbai-embed-large',
  'snowflake-arctic-embed2',
  'bge-m3',
  'all-minilm',
]

const embedder = defineModel<EmbedderFormSettings>({ required: true })
const { t } = useI18n()
const modelsListId = useId()
</script>

<i18n>
en:
  labels:
    url: URL
    apiKey: API Key
    model: Model
    dimensions: Dimensions
  hints:
    url: As reached from the Meilisearch server. Local addresses need the --experimental-allowed-ip-networks option.
    apiKey: Only needed when Ollama sits behind an authenticating proxy.
    dimensions: Inferred from the model when left blank.
</i18n>
