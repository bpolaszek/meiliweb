<template>
  <section class="space-y-4 rounded-lg border border-gray-200 p-4">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <UFormField :label="t('labels.name')" :help="entry.persisted ? t('hints.persistedName') : undefined" required>
        <UInput
          v-model="entry.name"
          required
          :disabled="entry.persisted"
          autocapitalize="off"
          autocomplete="off"
          spellcheck="false"
          class="w-full" />
      </UFormField>

      <UFormField :label="t('labels.source')" :help="sourceHint" required>
        <USelect
          v-model="entry.settings.source"
          :items="sourceItems"
          :disabled="!isEditableEmbedderSource(entry.settings.source)"
          class="w-full" />
      </UFormField>
    </div>

    <UAlert
      v-if="!isEditableEmbedderSource(entry.settings.source)"
      color="warning"
      variant="subtle"
      icon="heroicons:exclamation-triangle"
      :title="t('notices.notEditable', { source: entry.settings.source })" />
    <EmbedderSourceForm v-else v-model="entry.settings" :name="entry.name" />

    <EmbedderCommonFields
      v-if="isEditableEmbedderSource(entry.settings.source)"
      v-model="entry.settings"
      :binary-quantized-locked="binaryQuantizedLocked" />

    <footer class="flex justify-end">
      <UButton
        type="button"
        variant="ghost"
        color="neutral"
        icon="heroicons:trash"
        class="hover:text-red-600"
        @click="$emit('remove')">
        {{ t('actions.remove') }}
      </UButton>
    </footer>
  </section>
</template>

<script setup lang="ts">
import EmbedderCommonFields from '~/components/settings/embedder/EmbedderCommonFields.vue'
import EmbedderSourceForm from '~/components/settings/embedder/EmbedderSourceForm.vue'
import {
  COMPOSITE_EMBEDDERS_MIN_VERSION,
  EMBEDDER_FEATURES,
  EMBEDDER_SOURCES,
  isEditableEmbedderSource,
  type EmbedderFormEntry,
  type EmbedderFormSettings,
} from '~/utils'

type Props = {
  // Settings as currently saved on the instance, if any.
  initial?: EmbedderFormSettings
}
const props = defineProps<Props>()
const entry = defineModel<EmbedderFormEntry>({ required: true })
defineEmits<{ (e: 'remove'): void }>()

const { t } = useI18n()
const { satisfiesVersion } = useVersion()
const features = inject(EMBEDDER_FEATURES)!
const sourceItems = computed(() =>
  EMBEDDER_SOURCES.filter(
    (value) =>
      'composite' !== value ||
      satisfiesVersion(COMPOSITE_EMBEDDERS_MIN_VERSION) ||
      value === entry.value.settings.source,
  ).map((value) => {
    const disabled = 'composite' === value && !features.compositeEmbedders
    return { value, disabled, label: t(disabled ? 'sources.compositeDisabled' : `sources.${value}`) }
  }),
)
const sourceHint = computed(() =>
  props.initial && props.initial.source !== entry.value.settings.source ? t('hints.sourceChanged') : undefined,
)
const binaryQuantizedLocked = computed(() => true === props.initial?.binaryQuantized)
</script>

<i18n>
en:
  labels:
    name: Embedder name
    source: Source
  hints:
    persistedName: Saved embedders cannot be renamed. Remove it and add a new one instead.
    sourceChanged: Changing the source resets the whole configuration and regenerates all embeddings.
  sources:
    openAi: OpenAI
    huggingFace: Hugging Face (local)
    ollama: Ollama
    rest: REST
    userProvided: User provided
    composite: Composite
    compositeDisabled: Composite (requires the compositeEmbedders experimental feature)
  notices:
    notEditable: "The {source} source cannot be edited here: this embedder is left untouched when saving."
  actions:
    remove: Remove
</i18n>
