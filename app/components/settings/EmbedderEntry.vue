<template>
  <div class="grid grid-cols-12 space-x-4">
    <UniqueId v-slot="{ id }" as="div" class="col-span-4 space-y-2">
      <div class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.name') }}</Label>
        <input v-model="embedder[0]" required autocomplete="off" type="text" class="form-input w-full text-sm" />
      </div>
      <Button
        type="button"
        size="small"
        theme="primary"
        icon="mdi:bin"
        @click="$emit('remove', embedder[0])"
        class="w-auto">
        {{ t('actions.remove') }}
      </Button>
    </UniqueId>
    <div class="col-span-8 space-y-2">
      <UniqueId v-slot="{ id }" as="section">
        <Label required :for="id">{{ t('labels.source') }}</Label>
        <Select v-model="embedder[1]!.source" required :id class="w-full">
          <option value="openAi">OpenAI</option>
          <option value="huggingFace">HuggingFace</option>
          <option value="ollama">Ollama</option>
          <option value="rest">REST</option>
          <option value="userProvided">User Provided</option>
        </Select>
      </UniqueId>

      <RestEmbedderForm v-if="'rest' === embedder[1]!.source" v-model="embedder[1] as RestEmbedder" />
      <OllamaEmbedderForm v-if="'ollama' === embedder[1]!.source" v-model="embedder[1] as OllamaEmbedder" />
      <OpenAIEmbedderForm v-if="'openAi' === embedder[1]!.source" v-model="embedder[1] as OpenAiEmbedder" />
      <HuggingFaceEmbedderForm
        v-if="'huggingFace' === embedder[1]!.source"
        v-model="embedder[1] as HuggingFaceEmbedder" />

      <UniqueId v-if="'userProvided' !== embedder[1]!.source" v-slot="{ id }" as="section" class="flex flex-col gap-1">
        <Label :for="id">{{ t('labels.documentTemplate') }}</Label>
        <Textarea v-model="embedder[1]!.documentTemplate" class="form-input w-full text-sm" rows="5" />
      </UniqueId>
    </div>
  </div>
</template>

<script setup lang="ts">
import Label from '~/components/layout/forms/Label.vue'
import Button from '~/components/layout/forms/Button.vue'
import type { Embedder, HuggingFaceEmbedder, OllamaEmbedder, OpenAiEmbedder, RestEmbedder } from 'meilisearch'
import Select from '~/components/layout/forms/Select.vue'
import RestEmbedderForm from '~/components/settings/embedder/RestEmbedderForm.vue'
import Textarea from '~/components/layout/forms/Textarea.vue'
import OllamaEmbedderForm from '~/components/settings/embedder/OllamaEmbedderForm.vue'
import OpenAIEmbedderForm from '~/components/settings/embedder/OpenAIEmbedderForm.vue'
import HuggingFaceEmbedderForm from '~/components/settings/embedder/HuggingFaceEmbedderForm.vue'

type Props = {
  embedder: [string, Embedder]
}
defineProps<Props>()

const { t } = useI18n()
</script>

<i18n>
en:
  labels:
    name: Embedder name
    source: Source
    documentTemplate: Document template
  actions:
    remove: Remove
</i18n>
