<template>
  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.model') }}</Label>
    <input v-model="embedder!.model" autocomplete="off" type="text" class="form-input w-full text-sm" />
  </UniqueId>

  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <UniqueId v-slot="{ id: datalist }">
      <Label :for="id">{{ t('labels.model') }}</Label>
      <input
        v-model="embedder!.model"
        :list="datalist"
        autocomplete="off"
        type="text"
        class="form-input w-full text-sm" />
      <datalist :id="datalist">
        <option value="BAAI/bge-base-en-v1.5" />
      </datalist>
    </UniqueId>
  </UniqueId>
</template>

<script setup lang="ts">
import type { HuggingFaceEmbedder } from 'meilisearch'
import Label from '~/components/layout/forms/Label.vue'

const embedder = defineModel<HuggingFaceEmbedder>()
const { t } = useI18n()
</script>

<i18n>
en:
  labels:
    url: URL
    apiKey: API Key
    model: Model
</i18n>
