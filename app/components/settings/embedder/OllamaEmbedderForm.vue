<template>
  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.url') }}</Label>
    <input v-model="embedder!.url" autocomplete="off" type="url" class="form-input w-full text-sm" />
  </UniqueId>

  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.apiKey') }}</Label>
    <input v-model="embedder!.apiKey" autocomplete="off" type="password" class="form-input w-full text-sm" />
  </UniqueId>

  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <UniqueId v-slot="{ id: datalist }">
      <Label required :for="id">{{ t('labels.model') }}</Label>
      <input
        v-model="embedder!.model"
        required
        :list="datalist"
        autocomplete="off"
        type="text"
        class="form-input w-full text-sm" />
      <datalist :id="datalist">
        <option value="all-minilm" />
        <option value="nomic-embed-text" />
        <option value="mxbai-embed-large" />
      </datalist>
    </UniqueId>
  </UniqueId>

  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.dimensions') }}</Label>
    <input v-model="embedder!.dimensions" autocomplete="off" type="number" min="0" class="form-input w-full text-sm" />
  </UniqueId>
</template>

<script setup lang="ts">
import type { OllamaEmbedder } from 'meilisearch'
import Label from '~/components/layout/forms/Label.vue'

const embedder = defineModel<OllamaEmbedder>()
const { t } = useI18n()
</script>

<i18n>
en:
  labels:
    url: URL
    apiKey: API Key
    model: Model
    dimensions: Dimensions
</i18n>
