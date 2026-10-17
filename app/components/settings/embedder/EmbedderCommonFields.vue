<template>
  <template v-if="embedderAcceptsField(embedder.source, 'documentTemplate')">
    <UFormField :label="t('labels.documentTemplate')" :help="t('hints.documentTemplate')">
      <Textarea
        v-model="embedder.documentTemplate"
        :placeholder="t('placeholders.documentTemplate', LIQUID_EXAMPLE)"
        class="w-full font-mono text-xs"
        :rows="5" />
    </UFormField>

    <UFormField :label="t('labels.documentTemplateMaxBytes')" :help="t('hints.documentTemplateMaxBytes')">
      <UInput v-model.number="embedder.documentTemplateMaxBytes" type="number" :min="0" placeholder="400" />
    </UFormField>
  </template>

  <UFormField :help="binaryQuantizedLocked ? t('hints.binaryQuantizedLocked') : t('hints.binaryQuantized')">
    <USwitch
      v-model="embedder.binaryQuantized"
      :disabled="binaryQuantizedLocked"
      :label="t('labels.binaryQuantized')" />
  </UFormField>

  <details class="rounded-lg border border-gray-200 text-sm" :open="hasDistribution">
    <summary class="cursor-pointer px-3 py-2 font-medium text-gray-700">{{ t('sections.advanced') }}</summary>
    <div class="space-y-2 px-3 pb-3">
      <p class="text-xs text-gray-600">{{ t('hints.distribution') }}</p>
      <div class="grid grid-cols-2 gap-4">
        <UFormField :label="t('labels.mean')" :required="hasDistribution">
          <UInput
            v-model.number="embedder.distribution.mean"
            :required="hasDistribution"
            type="number"
            :min="0"
            :max="1"
            step="any"
            class="w-full" />
        </UFormField>
        <UFormField :label="t('labels.sigma')" :required="hasDistribution">
          <UInput
            v-model.number="embedder.distribution.sigma"
            :required="hasDistribution"
            type="number"
            :min="0"
            :max="1"
            step="any"
            class="w-full" />
        </UFormField>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import Textarea from '~/components/layout/forms/Textarea.vue'
import { embedderAcceptsField, type EmbedderFormSettings } from '~/utils'

// Passed as a parameter: vue-i18n would parse the braces of a literal Liquid tag as its own interpolation
const LIQUID_EXAMPLE = {
  example: "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
}

defineProps<{
  // Binary quantization cannot be reverted once saved.
  binaryQuantizedLocked: boolean
}>()
const embedder = defineModel<EmbedderFormSettings>({ required: true })
const { t } = useI18n()

const isFilled = (value: unknown) => '' !== value && null !== value && undefined !== value
// Mean and sigma only make sense together: filling one of them requires the other.
const hasDistribution = computed(
  () => isFilled(embedder.value.distribution.mean) || isFilled(embedder.value.distribution.sigma),
)
</script>

<i18n>
en:
  labels:
    documentTemplate: Document template
    documentTemplateMaxBytes: Document template max bytes
    binaryQuantized: Binary quantization
    mean: Mean
    sigma: Sigma
  sections:
    advanced: Advanced
  placeholders:
    documentTemplate: "{example}"
  hints:
    documentTemplate: Liquid template turning each document into the text to embed. Leave blank to use every searchable field.
    documentTemplateMaxBytes: Rendered templates longer than this are truncated. Defaults to 400.
    binaryQuantized: Shrinks vectors to 1 bit per dimension, which saves space and speeds up search at the cost of relevancy. Irreversible once enabled.
    binaryQuantizedLocked: Binary quantization is enabled and cannot be disabled anymore.
    distribution: Corrects the distribution of semantic scores, as an affine transformation of their mean and standard deviation (sigma). Both are between 0 and 1.
</i18n>
