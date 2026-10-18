<template>
  <template v-if="visible">
    <UFormField :label="t('labels.documentTemplate')" :help="t('hints.documentTemplate')">
      <Textarea
        v-model="embedder.documentTemplate"
        :placeholder="t('placeholders.documentTemplate', LIQUID_EXAMPLE)"
        class="w-full font-mono text-xs"
        :rows="5" />
      <EmbedderTemplatePreview
        kind="documentTemplate"
        :template="embedder.documentTemplate"
        :max-bytes="embedder.documentTemplateMaxBytes"
        class="mt-1" />
    </UFormField>

    <UFormField :label="t('labels.documentTemplateMaxBytes')" :help="t('hints.documentTemplateMaxBytes')">
      <UInput v-model.number="embedder.documentTemplateMaxBytes" type="number" :min="0" placeholder="400" />
    </UFormField>
  </template>
</template>

<script setup lang="ts">
import Textarea from '~/components/layout/forms/Textarea.vue'
import EmbedderTemplatePreview from '~/components/settings/embedder/EmbedderTemplatePreview.vue'
import { embedderAcceptsField, type CompositeEmbedderPart, type EmbedderFormSettings } from '~/utils'

// Passed as a parameter: vue-i18n would parse the braces of a literal Liquid tag as its own interpolation
const LIQUID_EXAMPLE = {
  example: "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
}

const props = defineProps<{ part?: CompositeEmbedderPart }>()
const embedder = defineModel<EmbedderFormSettings>({ required: true })
const { t } = useI18n()

// Indexing fragments replace the document template, which Meilisearch then ignores.
const visible = computed(
  () =>
    embedderAcceptsField(embedder.value.source, 'documentTemplate', props.part) &&
    !embedder.value.indexingFragments?.length,
)
</script>

<i18n>
en:
  labels:
    documentTemplate: Document template
    documentTemplateMaxBytes: Document template max bytes
  placeholders:
    documentTemplate: "{example}"
  hints:
    documentTemplate: Liquid template turning each document into the text to embed. Leave blank to use every searchable field.
    documentTemplateMaxBytes: Rendered templates longer than this are truncated. Defaults to 400.
</i18n>
