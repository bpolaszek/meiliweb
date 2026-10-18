<template>
  <UFormField :label="t('labels.url')" required>
    <UInput v-model="embedder.url" required type="url" autocomplete="off" class="w-full" />
  </UFormField>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <UFormField :label="t('labels.apiKey')" :help="t('hints.apiKey')">
      <UInput v-model="embedder.apiKey" type="password" autocomplete="off" class="w-full" />
    </UFormField>

    <UFormField :label="t('labels.dimensions')" :help="t('hints.dimensions')">
      <UInput v-model.number="embedder.dimensions" type="number" :min="1" class="w-full" />
    </UFormField>
  </div>

  <UFormField
    v-for="field of EMBEDDER_JSON_FIELDS"
    :key="field"
    :label="t(`labels.${field}`)"
    :help="t(`hints.${field}`, LIQUID_PLACEHOLDERS)"
    :error="!isValidJson(embedder[field]) && t('errors.invalidJson')"
    :required="!OPTIONAL_EMBEDDER_JSON_FIELDS.includes(field)">
    <Textarea
      v-model="embedder[field]"
      :required="!OPTIONAL_EMBEDDER_JSON_FIELDS.includes(field)"
      class="w-full font-mono text-xs"
      :rows="6" />
  </UFormField>
</template>

<script setup lang="ts">
import Textarea from '~/components/layout/forms/Textarea.vue'
import { EMBEDDER_JSON_FIELDS, OPTIONAL_EMBEDDER_JSON_FIELDS, type EmbedderFormSettings } from '~/utils'

// Passed as parameters: vue-i18n would parse the braces of literal placeholders as its own interpolations
const LIQUID_PLACEHOLDERS = { text: '{{text}}', embedding: '{{embedding}}', repeat: '{{..}}' }

const embedder = defineModel<EmbedderFormSettings>({ required: true })
const { t } = useI18n()

const isValidJson = (value: string | undefined) => {
  if (!value?.trim()) {
    return true
  }
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}
</script>

<i18n>
en:
  labels:
    url: URL
    apiKey: API Key
    dimensions: Dimensions
    request: Request (as JSON)
    response: Response (as JSON)
    headers: Headers (as JSON)
  hints:
    apiKey: Sent as a bearer token in the Authorization header.
    dimensions: Inferred from a test request when left blank.
    request: Body sent to the endpoint. Put "{text}" where the input goes, and "{repeat}" after it to batch several inputs.
    response: Shape of the endpoint's response. Put "{embedding}" where the embedding array is, and "{repeat}" for batches.
    headers: Extra headers sent with each request. Content-Type and Authorization are set by Meilisearch.
  errors:
    invalidJson: Invalid JSON
</i18n>
