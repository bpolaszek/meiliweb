<template>
  <Layout :title="t('title')" :subtitle="t('subtitle')">
    <template #title-actions>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/experimental_features" />
    </template>

    <Alert v-if="loadError" theme="danger" :title="t('errors.unavailable.title')">
      {{ t('errors.unavailable.text') }}
    </Alert>

    <ul v-else class="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-sm">
      <li v-for="feature in sortedFeatures" :key="feature" class="flex items-center justify-between gap-6 px-4 py-4">
        <div class="flex flex-col gap-1">
          <span class="font-medium text-gray-900">{{ labelFor(feature) }}</span>
          <span v-if="descriptionFor(feature)" class="text-sm text-gray-500">{{ descriptionFor(feature) }}</span>
        </div>
        <Toggle
          :model-value="!!features[feature]"
          :disabled="pending.has(feature)"
          @update:model-value="toggle(feature, $event)" />
      </li>
    </ul>
  </Layout>
</template>

<script setup lang="ts">
import { useMeiliClient, useToasts } from '#imports'
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS } from '~/stores/toasts'
import Alert from '~/components/layout/Alert.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Toggle from '~/components/layout/forms/Toggle.vue'
import { humanize } from '~/utils'
import type { RuntimeTogglableFeatures } from 'meilisearch'

// The set of supported features depends on the running Meilisearch version, so we list them
// dynamically from the API instead of hardcoding. Keys are typed loosely because a newer
// instance may report features unknown to our TS types and i18n catalogue.
type FeatureMap = Record<string, boolean>

const { t } = useI18n()
const meili = useMeiliClient()
const { createToast } = useToasts()

// Register lifecycle-bound composables before the first `await` so they keep their component context.
useHead({ title: t('title') })

const self = reactive({
  features: {} as FeatureMap,
  loadError: false,
})

try {
  // Direct call (not tryOrThrow): we want to degrade gracefully here rather than route to
  // the global fatal error page, since an older instance may simply not expose this endpoint.
  self.features = (await meili.getExperimentalFeatures()) as FeatureMap
} catch {
  // Older instances (or ones with the endpoint disabled) return 404 — degrade gracefully.
  self.loadError = true
}

// Known features ordered as in the docs; anything else is appended alphabetically.
const KNOWN_ORDER = [
  'metrics',
  'logsRoute',
  'editDocumentsByFunction',
  'containsFilter',
  'dynamicSearchRules',
  'network',
  'getTaskDocumentsRoute',
  'taskQueueCompactionRoute',
  'compositeEmbedders',
  'chatCompletions',
  'multimodal',
  'foreignKeys',
]

const sortedFeatures = computed(() => {
  const keys = Object.keys(self.features)
  const known = KNOWN_ORDER.filter((key) => keys.includes(key))
  const unknown = keys.filter((key) => !KNOWN_ORDER.includes(key)).sort()
  return [...known, ...unknown]
})

// A missing translation resolves back to its own key, which we treat as "unknown feature":
// labels fall back to a humanized key, descriptions are simply omitted.
const translate = (key: string) => {
  const value = t(key)
  return value === key ? null : value
}
const labelFor = (key: string) => translate(`features.${key}.label`) ?? humanize(key)
const descriptionFor = (key: string) => translate(`features.${key}.description`) ?? ''

const pending = reactive(new Set<string>())

const toggle = async (key: string, value: boolean) => {
  const previous = !!self.features[key]
  self.features[key] = value // optimistic update
  pending.add(key)

  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    title: t('toasts.updating', { feature: labelFor(key) }),
  })

  try {
    // PATCH is partial: send only the toggled key. This is not an async task.
    await meili.updateExperimentalFeatures({ [key]: value } as unknown as RuntimeTogglableFeatures)
    toast.update({ ...TOAST_SUCCESS(t), title: t('toasts.updated', { feature: labelFor(key) }) })
  } catch {
    self.features[key] = previous // rollback
    toast.update({ ...TOAST_FAILURE(t), text: t('toasts.error', { feature: labelFor(key) }) })
  } finally {
    pending.delete(key)
  }
}

const { features, loadError } = toRefs(self)
</script>

<i18n>
en:
  title: Experimental features
  subtitle: Enable or disable experimental features for this Meilisearch instance.
  errors:
    unavailable:
      title: Experimental features unavailable
      text: This Meilisearch instance does not expose the experimental features endpoint.
            It may be running an older version.
  toasts:
    updating: 'Updating {feature}...'
    updated: '{feature} updated'
    error: 'Could not update {feature}. The change was reverted.'
  features:
    metrics:
      label: Metrics endpoint
      description: Exposes the /metrics endpoint for Prometheus monitoring.
    logsRoute:
      label: Logs route
      description: Enables the /logs route to customise log output at runtime.
    editDocumentsByFunction:
      label: Edit documents by function
      description: Allows updating documents with a function expression via the document edition endpoint.
    containsFilter:
      label: CONTAINS filter operator
      description: Enables the CONTAINS operator in filter expressions.
    dynamicSearchRules:
      label: Dynamic search rules
      description: Enables dynamic search rules and the related routes.
    network:
      label: Network
      description: Enables the /network route and distributed, federated search across remote instances.
    getTaskDocumentsRoute:
      label: Task documents route
      description: Enables retrieving the documents associated with a task.
    taskQueueCompactionRoute:
      label: Task queue compaction route
      description: Enables the route to compact the task queue database.
    compositeEmbedders:
      label: Composite embedders
      description: Enables composite embedders combining multiple embedding sources.
    chatCompletions:
      label: Chat completions
      description: Enables chat completion capabilities.
    multimodal:
      label: Multimodal search
      description: Enables multimodal search across images and other media.
    foreignKeys:
      label: Foreign keys
      description: Enables foreign key support for document hydration.
</i18n>
