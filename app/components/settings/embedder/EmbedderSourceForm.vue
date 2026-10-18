<template>
  <OpenAIEmbedderForm v-if="'openAi' === embedder.source" v-model="embedder" />
  <HuggingFaceEmbedderForm v-else-if="'huggingFace' === embedder.source" v-model="embedder" />
  <OllamaEmbedderForm v-else-if="'ollama' === embedder.source" v-model="embedder" />
  <RestEmbedderForm v-else-if="'rest' === embedder.source" v-model="embedder" :part />
  <UserProvidedEmbedderForm v-else-if="'userProvided' === embedder.source" v-model="embedder" :name />
  <CompositeEmbedderForm v-else-if="'composite' === embedder.source" v-model="embedder" :name />
</template>

<script setup lang="ts">
import CompositeEmbedderForm from '~/components/settings/embedder/CompositeEmbedderForm.vue'
import HuggingFaceEmbedderForm from '~/components/settings/embedder/HuggingFaceEmbedderForm.vue'
import OllamaEmbedderForm from '~/components/settings/embedder/OllamaEmbedderForm.vue'
import OpenAIEmbedderForm from '~/components/settings/embedder/OpenAIEmbedderForm.vue'
import RestEmbedderForm from '~/components/settings/embedder/RestEmbedderForm.vue'
import UserProvidedEmbedderForm from '~/components/settings/embedder/UserProvidedEmbedderForm.vue'
import type { CompositeEmbedderPart, EmbedderFormSettings } from '~/utils'

defineProps<{
  name: string
  // Set when editing a part of a composite embedder
  part?: CompositeEmbedderPart
}>()
const embedder = defineModel<EmbedderFormSettings>({ required: true })
</script>
