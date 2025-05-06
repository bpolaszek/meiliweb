<template>
  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label required :for="id">{{ t('labels.url') }}</Label>
    <input v-model="embedder!.url" required autocomplete="off" type="url" class="form-input w-full text-sm" />
  </UniqueId>

  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.apiKey') }}</Label>
    <input v-model="embedder!.apiKey" autocomplete="off" type="password" class="form-input w-full text-sm" />
  </UniqueId>

  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.request') }}</Label>
    <Textarea
      v-model="embedder!.request as unknown as string"
      no-padding
      class="form-input w-full font-mono text-xs"
      rows="6" />
  </UniqueId>

  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.response') }}</Label>
    <Textarea
      v-model="embedder!.response as unknown as string"
      no-padding
      class="form-input w-full font-mono text-xs"
      rows="6" />
  </UniqueId>

  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.headers') }}</Label>
    <Textarea
      v-model="embedder!.headers as unknown as string"
      no-padding
      class="form-input w-full font-mono text-xs"
      rows="6" />
  </UniqueId>

  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.dimensions') }}</Label>
    <input v-model="embedder!.dimensions" autocomplete="off" type="number" min="0" class="form-input w-full text-sm" />
  </UniqueId>
</template>

<script setup lang="ts">
import type { RestEmbedder } from 'meilisearch'
import Label from '~/components/layout/forms/Label.vue'
import Textarea from '~/components/layout/forms/Textarea.vue'

const embedder = defineModel<RestEmbedder>()
const { t } = useI18n()
</script>

<i18n>
en:
  labels:
    url: URL
    apiKey: API Key
    request: Request (as JSON)
    response: Response (as JSON)
    headers: Headers (as JSON)
    dimensions: Dimensions
</i18n>
