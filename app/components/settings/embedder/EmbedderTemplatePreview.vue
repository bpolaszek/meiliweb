<template>
  <div v-if="satisfiesVersion(RENDER_ROUTE_MIN_VERSION)" class="space-y-2">
    <div class="flex items-center gap-2">
      <UButton
        type="button"
        size="xs"
        variant="link"
        color="neutral"
        :icon="open ? 'heroicons:eye-slash' : 'heroicons:eye'"
        :disabled="!renderRoute || !template?.trim()"
        class="px-0"
        @click="toggle()">
        {{ t(open ? 'actions.hidePreview' : 'actions.preview') }}
      </UButton>
      <span v-if="!renderRoute" class="text-xs text-gray-500">
        {{ t('notices.renderRouteDisabled') }}
        <NuxtLink to="/experimental-features" class="underline">{{ t('actions.enableRenderRoute') }}</NuxtLink>
      </span>
    </div>

    <div v-if="open" class="space-y-3 rounded-lg bg-gray-50 p-3">
      <div class="flex items-end gap-2">
        <UFormField :label="t(isSearch ? 'labels.query' : 'labels.documentId')" class="flex-1">
          <!-- Enter would submit the settings form this preview sits in -->
          <UInput v-model="input" size="sm" autocomplete="off" class="w-full" @keydown.enter.prevent="render()" />
        </UFormField>
        <UButton type="button" size="sm" :loading icon="heroicons:arrow-path" @click="render()">
          {{ t('actions.render') }}
        </UButton>
      </div>

      <p v-if="error" class="text-xs whitespace-pre-line text-red-600">{{ error }}</p>
      <template v-else-if="undefined !== rendered">
        <pre
          class="max-h-64 overflow-auto rounded bg-white p-2 font-mono text-xs break-words whitespace-pre-wrap"><span>{{ kept }}</span><span v-if="truncated" class="text-gray-400 line-through">{{ truncated }}</span></pre>
        <p v-if="'documentTemplate' === kind" class="text-xs" :class="truncated ? 'text-amber-700' : 'text-gray-500'">
          {{ t(truncated ? 'notices.truncated' : 'notices.size', { bytes: renderedBytes, maxBytes }) }}
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeiliClient, useTemplatePreview, type TemplatePreviewKind } from '~/composables'
import { EMBEDDER_FEATURES, RENDER_ROUTE_MIN_VERSION } from '~/utils'

const DEFAULT_DOCUMENT_TEMPLATE_MAX_BYTES = 400

const props = defineProps<{
  kind: TemplatePreviewKind
  // Liquid template, or JSON text for fragments
  template: string | undefined
  maxBytes?: number | null
}>()

const { t } = useI18n()
const indexUid = useRoute().params.indexUid as string
const meili = useMeiliClient()
const renderTemplate = useTemplatePreview(indexUid)
const { renderRoute } = inject(EMBEDDER_FEATURES)!
const { satisfiesVersion } = useVersion()

const open = ref(false)
const loading = ref(false)
const input = ref('')
const rendered = ref<unknown>()
const error = ref<string | null>(null)
const isSearch = computed(() => 'searchFragments' === props.kind)
const maxBytes = computed(() => props.maxBytes || DEFAULT_DOCUMENT_TEMPLATE_MAX_BYTES)

const encoder = new TextEncoder()
const renderedText = computed(() =>
  typeof rendered.value === 'string' ? rendered.value : JSON.stringify(rendered.value, null, 2),
)
const renderedBytes = computed(() => encoder.encode(renderedText.value).length)
// Meilisearch truncates rendered document templates to `documentTemplateMaxBytes`: show what gets cut off.
const kept = computed(() => {
  if ('documentTemplate' !== props.kind || renderedBytes.value <= maxBytes.value) {
    return renderedText.value
  }
  // A cut in the middle of a multibyte character decodes as a replacement character: drop it
  const bytes = encoder.encode(renderedText.value).slice(0, maxBytes.value)
  return new TextDecoder().decode(bytes).replace(/�$/, '')
})
const truncated = computed(() => renderedText.value.slice(kept.value.length))

const fetchFirstDocumentId = async () => {
  const index = meili.index(indexUid)
  const primaryKey = await index.fetchPrimaryKey()
  if (!primaryKey) {
    return ''
  }
  const { results } = await index.getDocuments({ limit: 1, fields: [primaryKey] })
  return undefined === results[0]?.[primaryKey] ? '' : String(results[0][primaryKey])
}

const render = async () => {
  loading.value = true
  error.value = null
  rendered.value = undefined
  try {
    let template: unknown = props.template
    if ('documentTemplate' !== props.kind) {
      try {
        template = JSON.parse(props.template ?? '')
      } catch {
        error.value = t('errors.invalidJson')
        return
      }
    }
    rendered.value = (await renderTemplate(props.kind, template, input.value)).rendered
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

const toggle = async () => {
  open.value = !open.value
  if (!open.value) {
    return
  }
  if (!isSearch.value && '' === input.value) {
    input.value = await fetchFirstDocumentId().catch(() => '')
  }
  if ('' !== input.value) {
    await render()
  }
}
</script>

<i18n>
en:
  labels:
    documentId: Document ID
    query: Query
  actions:
    preview: Preview
    hidePreview: Hide preview
    render: Render
    enableRenderRoute: Enable it
  notices:
    renderRouteDisabled: Previews require the renderRoute experimental feature.
    size: "{bytes} bytes (max. {maxBytes})"
    truncated: "{bytes} bytes: truncated to {maxBytes} bytes, the struck-through part is not embedded."
  errors:
    invalidJson: Invalid JSON
</i18n>
