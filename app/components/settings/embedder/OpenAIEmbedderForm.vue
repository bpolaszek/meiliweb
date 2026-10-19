<template>
  <UFormField :label="t('labels.apiKey')" :help="t('hints.apiKey')">
    <UInput v-model="embedder.apiKey" type="password" autocomplete="off" class="w-full" />
  </UFormField>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <UFormField :label="t('labels.model')">
      <UInput
        v-model="embedder.model"
        :list="modelsListId"
        placeholder="text-embedding-3-small"
        autocomplete="off"
        class="w-full" />
      <datalist :id="modelsListId">
        <option v-for="model of OPENAI_MODELS" :key="model" :value="model" />
      </datalist>
    </UFormField>

    <UFormField :label="t('labels.dimensions')" :help="t('hints.dimensions')">
      <UInput v-model.number="embedder.dimensions" type="number" :min="1" class="w-full" />
    </UFormField>
  </div>

  <UFormField :label="t('labels.url')" :help="t('hints.url')">
    <UInput
      v-model="embedder.url"
      type="url"
      placeholder="https://api.openai.com/v1/embeddings"
      autocomplete="off"
      class="w-full" />
  </UFormField>
</template>

<script setup lang="ts">
import type { EmbedderFormSettings } from '~/utils'

const OPENAI_MODELS = ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002']

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
    apiKey: Falls back to the OPENAI_API_KEY or MEILI_OPENAI_API_KEY environment variable of the Meilisearch server.
    dimensions: Inferred from the model when left blank. Changing it regenerates all embeddings.
    url: Leave blank to use OpenAI. Set it to target an OpenAI-compatible endpoint.
</i18n>
