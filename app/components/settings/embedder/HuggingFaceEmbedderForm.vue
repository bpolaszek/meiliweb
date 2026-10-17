<template>
  <UFormField :label="t('labels.model')" :help="t('hints.model')">
    <UInput
      v-model="embedder.model"
      :list="modelsListId"
      placeholder="BAAI/bge-base-en-v1.5"
      autocomplete="off"
      class="w-full" />
    <datalist :id="modelsListId">
      <option v-for="model of HUGGINGFACE_MODELS" :key="model" :value="model" />
    </datalist>
  </UFormField>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <UFormField :label="t('labels.revision')" :help="t('hints.revision')">
      <UInput v-model="embedder.revision" autocomplete="off" spellcheck="false" class="w-full font-mono" />
    </UFormField>

    <UFormField :label="t('labels.pooling')" :help="t('hints.pooling')">
      <USelect v-model="embedder.pooling" :items="poolingItems" placeholder="useModel" class="w-full" />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import type { EmbedderFormSettings } from '~/utils'

const HUGGINGFACE_MODELS = [
  'BAAI/bge-base-en-v1.5',
  'BAAI/bge-small-en-v1.5',
  'BAAI/bge-large-en-v1.5',
  'sentence-transformers/all-MiniLM-L6-v2',
  'sentence-transformers/all-mpnet-base-v2',
  'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
  'intfloat/multilingual-e5-large',
]
const POOLING_METHODS = ['useModel', 'forceMean', 'forceCls'] as const

const embedder = defineModel<EmbedderFormSettings>({ required: true })
const { t } = useI18n()
const modelsListId = useId()
const poolingItems = POOLING_METHODS.map((value) => ({ value, label: t(`pooling.${value}`) }))
</script>

<i18n>
en:
  labels:
    model: Model
    revision: Revision
    pooling: Pooling
  hints:
    model: Downloaded from the Hugging Face Hub and run locally by Meilisearch.
    revision: Commit hash of the model. Defaults to its latest revision.
    pooling: How token embeddings are combined into a document embedding.
  pooling:
    useModel: useModel (default)
    forceMean: forceMean
    forceCls: forceCls
</i18n>
