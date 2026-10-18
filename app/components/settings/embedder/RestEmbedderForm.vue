<template>
  <section class="space-y-2 rounded-lg bg-gray-50 p-3">
    <div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
      <UFormField :label="t('labels.preset')">
        <USelect v-model="presetId" :items="presetItems" :placeholder="t('placeholders.preset')" class="w-full" />
      </UFormField>
      <UFormField :label="t('labels.presetModel')">
        <USelect v-model="presetModelName" :items="presetModelItems" :disabled="!preset" class="w-full" />
      </UFormField>
      <UButton type="button" color="neutral" variant="outline" :disabled="!preset" @click="applyPreset()">
        {{ t('actions.applyPreset') }}
      </UButton>
    </div>
    <p v-if="preset" class="text-xs text-gray-600">
      <template v-if="te(`presetHints.${preset.id}`)">
        {{ t(`presetHints.${preset.id}`, PRESET_URL_PLACEHOLDERS) }}
      </template>
      <a :href="preset.docUrl" target="_blank" class="ml-1 underline">{{ t('actions.openGuide') }}</a>
    </p>
  </section>

  <UFormField :label="t('labels.url')" required>
    <UInput v-model="embedder.url" required type="url" autocomplete="off" class="w-full" />
  </UFormField>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <UFormField :label="t('labels.apiKey')" :help="t('hints.apiKey')">
      <UInput v-model="embedder.apiKey" type="password" autocomplete="off" class="w-full" />
    </UFormField>

    <UFormField
      :label="t('labels.dimensions')"
      :help="hasIndexingFragments ? t('hints.dimensionsRequired') : t('hints.dimensions')"
      :required="hasIndexingFragments">
      <UInput
        v-model.number="embedder.dimensions"
        :required="hasIndexingFragments"
        type="number"
        :min="1"
        class="w-full" />
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

  <details
    v-if="multimodalSupported || hasFragments"
    class="rounded-lg border border-gray-200 text-sm"
    :open="hasFragments">
    <summary class="cursor-pointer px-3 py-2 font-medium text-gray-700">{{ t('sections.multimodal') }}</summary>
    <div class="space-y-4 px-3 pb-3">
      <UAlert
        v-if="!multimodal"
        color="warning"
        variant="subtle"
        icon="heroicons:exclamation-triangle"
        :title="t('notices.multimodalDisabled')">
        <template #description>
          <NuxtLink to="/experimental-features" class="underline">{{ t('actions.enableMultimodal') }}</NuxtLink>
        </template>
      </UAlert>
      <template v-if="multimodal || hasFragments">
        <EmbedderFragmentsEditor v-for="field of fragmentFields" :key="field" v-model="embedder[field]" :kind="field" />
      </template>
    </div>
  </details>
</template>

<script setup lang="ts">
import Textarea from '~/components/layout/forms/Textarea.vue'
import EmbedderFragmentsEditor from '~/components/settings/embedder/EmbedderFragmentsEditor.vue'
import { useConfirmationDialog } from '~/stores'
import {
  embedderAcceptsField,
  EMBEDDER_FEATURES,
  EMBEDDER_FRAGMENT_FIELDS,
  EMBEDDER_JSON_FIELDS,
  EMBEDDER_PRESETS,
  MULTIMODAL_MIN_VERSION,
  OPTIONAL_EMBEDDER_JSON_FIELDS,
  type CompositeEmbedderPart,
  type EmbedderFormSettings,
  type EmbedderFragmentRow,
} from '~/utils'

// Passed as parameters: vue-i18n would parse the braces of literal placeholders as its own interpolations,
// and refuses HTML-like tags in messages
const PRESET_URL_PLACEHOLDERS = { accountId: '<ACCOUNT_ID>', region: '<REGION>' }
const LIQUID_PLACEHOLDERS = {
  text: '{{text}}',
  fragment: '{{fragment}}',
  embedding: '{{embedding}}',
  repeat: '{{..}}',
}

const props = defineProps<{
  // Set when editing a part of a composite embedder
  part?: CompositeEmbedderPart
}>()
const embedder = defineModel<EmbedderFormSettings>({ required: true })
const { t, te } = useI18n()
const { confirm } = useConfirmationDialog()
const { multimodal } = inject(EMBEDDER_FEATURES)!

const fragmentFields = EMBEDDER_FRAGMENT_FIELDS.filter((field) => embedderAcceptsField('rest', field, props.part))
const hasFragments = computed(() => fragmentFields.some((field) => embedder.value[field]?.length))
// Meilisearch can't infer the dimensions of an embedder using indexing fragments
const hasIndexingFragments = computed(() => embedder.value.indexingFragments?.length > 0)

const { satisfiesVersion } = useVersion()
const multimodalSupported = computed(() => satisfiesVersion(MULTIMODAL_MIN_VERSION))
// Presets relying on fragments can't work before multimodal embedders exist
const presetItems = computed(() =>
  EMBEDDER_PRESETS.filter(
    ({ build, models }) => multimodalSupported.value || undefined === build(models[0]!).indexingFragments,
  ).map(({ id, label }) => ({ value: id, label })),
)
const presetId = ref<string>()
const preset = computed(() => EMBEDDER_PRESETS.find(({ id }) => id === presetId.value))
const presetModelName = ref<string>()
const presetModelItems = computed(() =>
  (preset.value?.models ?? []).map(({ name, dimensions }) => ({
    value: name,
    label: t('presetModel', { name, dimensions }),
  })),
)
watch(preset, (preset) => (presetModelName.value = preset?.models[0]?.name))

const toJson = (value: unknown) => (undefined === value ? '' : JSON.stringify(value, null, 2))
const toFragmentRows = (fragments: Record<string, { value: any }> = {}): EmbedderFragmentRow[] =>
  Object.entries(fragments).map(([name, { value }]) => ({ name, value: toJson(value) }))

const applyPreset = async () => {
  const model = preset.value?.models.find(({ name }) => name === presetModelName.value)
  if (!preset.value || !model) {
    return
  }
  const hasTemplates = [embedder.value.request, embedder.value.response].some((value) => value?.trim())
  if (hasTemplates && !(await confirm({ text: t('confirmations.applyPreset', { preset: preset.value.label }) }))) {
    return
  }
  const { url, request, response, headers, dimensions, ...fragments } = preset.value.build(model)
  Object.assign(embedder.value, {
    url,
    request: toJson(request),
    response: toJson(response),
    headers: toJson(headers),
    dimensions,
    ...Object.fromEntries(fragmentFields.map((field) => [field, toFragmentRows(fragments[field])])),
  })
}

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
  presetModel: "{name} ({dimensions} dimensions)"
  labels:
    preset: Start from a provider
    presetModel: Model
    url: URL
    apiKey: API Key
    dimensions: Dimensions
    request: Request (as JSON)
    response: Response (as JSON)
    headers: Headers (as JSON)
  hints:
    apiKey: Sent as a bearer token in the Authorization header.
    dimensions: Inferred from a test request when left blank.
    dimensionsRequired: Mandatory with indexing fragments.
    request: Body sent to the endpoint. Put "{text}" where the input goes (or "{fragment}" with multimodal fragments), and "{repeat}" after it to batch several inputs.
    response: Shape of the endpoint's response. Put "{embedding}" where the embedding array is, and "{repeat}" for batches.
    headers: Extra headers sent with each request. Content-Type and Authorization are set by Meilisearch.
  sections:
    multimodal: Multimodal fragments
  notices:
    multimodalDisabled: Fragments require the multimodal experimental feature.
  placeholders:
    preset: Choose a provider…
  actions:
    applyPreset: Apply
    openGuide: Read the guide
    enableMultimodal: Enable it in the experimental features
  confirmations:
    applyPreset: "Replace the URL, request, response, headers, dimensions and fragments with the {preset} configuration?"
  presetHints:
    cohere: Indexes with input_type set to search_document.
    voyage: Keys issued by MongoDB Atlas work on https://ai.mongodb.com/v1/embeddings instead.
    voyageMultimodal: Requires the multimodal experimental feature. Adapt the document fields used by the fragments to yours. Keys issued by MongoDB Atlas work on https://ai.mongodb.com/v1/multimodalembeddings instead.
    gemini: Gemini doesn't accept bearer tokens. Put your API key in the x-goog-api-key header, and leave the API key field blank.
    cloudflare: Replace {accountId} in the URL with your Cloudflare account ID.
    bedrock: Replace {region} in the URL with your AWS region, and use a Bedrock API key.
    huggingFaceInference: Uses serverless inference. For a dedicated Inference Endpoint, replace the URL with your endpoint's.
  errors:
    invalidJson: Invalid JSON
</i18n>
