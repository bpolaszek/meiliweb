<template>
  <Layout :title="humanizeString(index.uid)" :subtitle="subtitle">
    <USlideover
      v-model:open="filterPanelOpen"
      :title="t('labels.filters')"
      side="right"
      :overlay="false"
      :ui="{ content: 'max-w-lg', title: 'text-2xl font-semibold', body: 'p-0 sm:p-0' }">
      <template #body>
        <FilterPanel
          v-model:applied-sort="appliedSort"
          v-model:facets="facets"
          v-model:applied-filters="appliedFilters"
          :client="searchClient"
          :index-uid="index.uid"
          :sortable-attributes="sortableAttributes"
          :filterable-attributes="facetSearchableAttributes" />
      </template>
    </USlideover>

    <DocumentSlideOver
      v-if="null !== openedDocumentId"
      v-model:open="documentSlideOverOpen"
      :index-uid="index.uid"
      :primary-key="primaryKey"
      :document-id="openedDocumentId"
      @saved="refreshDocuments()"
      @deleted="refreshDocuments()" />

    <template #actions>
      <div
        v-if="tenant.tenantToken"
        class="inline-flex items-center gap-1 rounded-lg border-0 border-gray-200 px-4 py-2">
        <span class="font-medium text-gray-600">
          {{ t('labels.multitenancyEnabled') }}
        </span>
        <Button
          v-tippy="t('actions.clearTenantToken')"
          no-padding
          no-border
          no-rounded
          @click="tenant.clearTenantToken()">
          <Icon name="uil:times" class="size-6 text-primary-600" />
        </Button>
      </div>

      <UInput
        v-model="searchTerms"
        type="search"
        icon="heroicons:magnifying-glass-20-solid"
        :placeholder="t('labels.search')"
        :ui="{ base: 'rounded-lg' }"
        class="grow lg:w-80" />

      <HybridSearchControl
        v-if="hasEmbedders"
        v-model:enabled="hybridEnabled"
        v-model:embedder="hybridEmbedder"
        v-model:semantic-ratio="hybridSemanticRatio"
        :embedders="embedderNames" />

      <DebugSearchControl
        v-model:show-ranking-score="showRankingScore"
        v-model:show-ranking-score-details="showRankingScoreDetails"
        v-model:show-performance-details="showPerformanceDetails" />

      <PersonalizeSearchControl
        v-if="personalizeAvailable"
        v-model:enabled="personalizeEnabled"
        v-model:user-context="personalizeUserContext" />

      <button v-tippy="t('actions.documentView')" @click="viewMode = 'documents'">
        <Icon
          name="fa-solid:id-card"
          :class="['documents' === viewMode ? 'text-primary-700' : 'text-gray-600 hover:text-gray-800', 'size-6']" />
      </button>

      <button v-tippy="t('actions.tableView')" type="button" @click="viewMode = 'table'">
        <Icon
          name="nimbus:list"
          :class="['table' === viewMode ? 'text-primary-700' : 'text-gray-600 hover:text-gray-800', 'size-6']" />
      </button>

      <button v-if="hasGeoDocuments" v-tippy="t('actions.mapView')" type="button" @click="viewMode = 'map'">
        <Icon
          name="gis:poi-map"
          :class="['map' === viewMode ? 'text-primary-700' : 'text-gray-600 hover:text-gray-800', 'size-6']" />
      </button>

      <button v-tippy="t('actions.toggleFilters')" @click="filterPanelOpen = true">
        <Icon
          name="ph:funnel-fill"
          class="size-6"
          :class="
            appliedFilters.length > 0 ? 'text-primary-600 hover:text-primary-800' : 'text-gray-600 hover:text-gray-800'
          " />
      </button>
    </template>
    <template #title-actions>
      <NuxtLink :to="`/indexes/${index.uid}/settings`" v-tippy="t('actions.goToSettings')">
        <Icon name="heroicons-outline:cog" />
      </NuxtLink>
    </template>

    <DocumentsEmptyState
      v-if="0 === resultset.estimatedTotalHits"
      :index-uid="index.uid"
      :request-has-filters="!!(searchParams.filter || searchParams.q)"></DocumentsEmptyState>

    <MainComponent
      v-else
      :index-uid="index.uid"
      :documents="resultset.hits"
      :primary-key="primaryKey"
      :applied-filters="appliedFilters"
      :can-filter-geo-documents="canFilterGeoDocuments"
      :fields="displayFields" />

    <template #footer>
      <DocumentsFooter
        v-model:offset="offset"
        v-model:items-per-page="itemsPerPage"
        :current-page="currentPage"
        :last-page="lastPage"
        :previous-page="previousPage"
        :next-page="nextPage"
        :nb-total-items="resultset.estimatedTotalHits"
        :processing-time-ms="resultset.processingTimeMs"
        :index-uid="index.uid"
        :performance-details="resultset.performanceDetails" />
    </template>
  </Layout>
</template>

<script setup lang="ts">
import {
  provideDocumentViewer,
  useFields,
  useIndexLocalSettings,
  useMeiliClient,
  useMultiTenancy,
  usePagination,
  type DocumentId,
} from '~/composables'
import { getFacetSearchableAttributePatterns, getFilterableAttributePatterns, tryOrThrow } from '~/utils'
import { NuxtLink } from '#components'
import FilterPanel from '~/components/documents/FilterPanel.vue'
import { AppliedFilters } from '~/utils/applied-filters'
import humanizeString from 'humanize-string'
import match from 'match-operator'
import DocumentsAsCards from '~/components/documents/DocumentsAsCards.vue'
import DocumentsAsTable from '~/components/documents/DocumentsAsTable.vue'
import Button from '~/components/layout/forms/Button.vue'
import DocumentsAsMap from '~/components/documents/DocumentsAsMap.vue'
import HybridSearchControl from '~/components/documents/HybridSearchControl.vue'
import DebugSearchControl from '~/components/documents/DebugSearchControl.vue'
import PersonalizeSearchControl from '~/components/documents/PersonalizeSearchControl.vue'
import { reactiveComputed } from '@vueuse/core'
import { TOAST_FAILURE, useToasts, useVersion } from '~/stores'

const { t } = useI18n()
const route = useRoute()
const indexUid = route.params.indexUid
const meili = useMeiliClient()
const tenant = useMultiTenancy()
const { satisfiesVersion } = useVersion()
const { createToast } = useToasts()
// Search personalization requires Meilisearch >= 1.25. Unlike hybrid search's embedders,
// there's no capability endpoint to probe whether the instance's Cohere key is actually
// configured — that can only be discovered by a failing search, handled below.
const personalizeAvailable = computed(() => satisfiesVersion('>=1.25.0'))
const searchClient = reactiveComputed(() => (tenant.tenantToken ? useMeiliClient(tenant.tenantToken as string) : meili))
const { formatDate } = useDateFormatter()
const index = await tryOrThrow(() => meili.getIndex(indexUid as string))
const filterPanelOpen = ref(false)
const [primaryKey, rawFilterableAttributes, sortableAttributes, stats] = await Promise.all([
  index.fetchPrimaryKey() as Promise<string>,
  index.getFilterableAttributes(),
  index.getSortableAttributes(),
  index.getStats(),
])
const filterableAttributes = getFilterableAttributePatterns(rawFilterableAttributes)
const facetSearchableAttributes = getFacetSearchableAttributePatterns(rawFilterableAttributes)

const { fields } = useFields(primaryKey, Object.keys(stats.fieldDistribution))
const {
  appliedSort,
  facets,
  itemsPerPage,
  viewMode,
  hybridEnabled,
  hybridEmbedder,
  hybridSemanticRatio,
  resetHybridSearch,
  showRankingScore,
  showRankingScoreDetails,
  showPerformanceDetails,
  personalizeEnabled,
  personalizeUserContext,
  resetPersonalize,
} = useIndexLocalSettings(index.uid)
const appliedFilters = reactive(new AppliedFilters()) as AppliedFilters
const searchTerms = ref('')
const { offset, totalItems, currentPage, previousPage, nextPage, lastPage } = usePagination(itemsPerPage)

// Direct call (not tryOrThrow): older instances (or ones without the vector store feature
// enabled) don't expose embedders — degrade to "no hybrid search" rather than the fatal
// error page. See app/pages/experimental-features.vue for the same pattern.
let embedders: Record<string, unknown> = {}
try {
  embedders = (await index.getEmbedders()) ?? {}
} catch {
  embedders = {}
}
const embedderNames = Object.keys(embedders)
const hasEmbedders = embedderNames.length > 0

// The embedder stored in localStorage may no longer exist (renamed/deleted since the user
// last configured hybrid search) — reconcile against the live list *before* it can ever be
// sent to Meilisearch, which would otherwise reject the search and break the page.
if (!hasEmbedders) {
  if (hybridEnabled.value || hybridEmbedder.value) resetHybridSearch()
} else if (hybridEmbedder.value && !embedderNames.includes(hybridEmbedder.value)) {
  resetHybridSearch()
}
// Pre-select an embedder for convenience once one exists — this only fills the dropdown,
// it does NOT turn hybrid search on (hybridEnabled stays whatever it was/defaults to false).
if (hasEmbedders && !hybridEmbedder.value) {
  hybridEmbedder.value = embedderNames[0]
}

const searchParams = reactive({
  q: searchTerms,
  sort: appliedSort,
  limit: itemsPerPage,
  offset,
  filter: computed(() => `${appliedFilters}`),
  hybrid: computed(() =>
    hybridEnabled.value && hybridEmbedder.value
      ? { embedder: hybridEmbedder.value, semanticRatio: hybridSemanticRatio.value }
      : undefined,
  ),
  showRankingScore,
  showRankingScoreDetails,
  // Guarded here too (not just hidden in DebugSearchControl's UI) so a value persisted while
  // connected to a newer instance can't leak into a request against an older one.
  showPerformanceDetails: computed(() => showPerformanceDetails.value && satisfiesVersion('>=1.35.0')),
  personalize: computed(() =>
    personalizeAvailable.value && personalizeEnabled.value && personalizeUserContext.value.trim()
      ? { userContext: personalizeUserContext.value }
      : undefined,
  ),
})
const resultset = ref(await tryOrThrow(() => searchClient.index(index.uid).search(null, searchParams)))

const displayFields = computed(() => [
  ...fields.value,
  ...(showRankingScore.value ? ['_rankingScore'] : []),
  ...(showRankingScoreDetails.value ? ['_rankingScoreDetails'] : []),
])
const hasGeoDocuments = computed(() => Object.keys(stats.fieldDistribution).includes('_geo'))
const canFilterGeoDocuments = computed(() => filterableAttributes.includes('_geo'))
const self = reactive({
  resultset,
  totalItems,
  viewMode,
})
const MainComponent = computed(() =>
  match(self.viewMode, [
    ['documents', DocumentsAsCards],
    ['table', DocumentsAsTable],
    ['map', DocumentsAsMap],
  ]),
)

// Clicking a document id anywhere in the results (table cells, cards) opens the CRUD slideover.
// It is loaded on demand: it pulls in vanilla-jsoneditor, which weighs more than this page does.
const DocumentSlideOver = defineAsyncComponent(() => import('~/components/documents/DocumentSlideOver.vue'))
const openedDocumentId = ref<DocumentId | null>(null)
const documentSlideOverOpen = ref(false)
provideDocumentViewer((documentId: DocumentId) => {
  openedDocumentId.value = documentId
  documentSlideOverOpen.value = true
})
const refreshDocuments = async () => {
  self.resultset = await searchClient.index(index.uid).search(null, searchParams)
}

watch(appliedSort, () => (searchParams.offset = 0))
watch(appliedFilters, () => (searchParams.offset = 0))
watch(itemsPerPage, () => (searchParams.offset = 0))
watch(searchTerms, () => (searchParams.offset = 0))
watch(hybridEnabled, () => (searchParams.offset = 0))
watch(hybridEmbedder, () => (searchParams.offset = 0))
watch(hybridSemanticRatio, () => (searchParams.offset = 0))
watch(personalizeEnabled, () => (searchParams.offset = 0))
watch(personalizeUserContext, () => (searchParams.offset = 0))
watch(
  searchParams,
  async (searchParams) => {
    try {
      self.resultset = await searchClient.index(index.uid).search(null, searchParams)
    } catch (error) {
      // There's no way to know ahead of time whether the instance's Cohere key is configured
      // (see personalizeAvailable above) — a rejected personalized search is the only signal.
      // Fall back to a plain search rather than leaving the page stuck on stale results.
      if (!personalizeEnabled.value) throw error
      resetPersonalize()
      createToast({ ...TOAST_FAILURE(t), title: t('errors.personalizeFailed') })
      self.resultset = await searchClient.index(index.uid).search(null, searchParams)
    }
  },
  { deep: true },
)
watch(resultset, () => (self.totalItems = self.resultset.estimatedTotalHits), {
  deep: true,
  immediate: true,
})
const subtitle = computed(
  () =>
    `${t('nbDocs', { nb: stats.numberOfDocuments })} - ${t('updatedAt', { updatedAt: formatDate(index.updatedAt, { displayTimeZone: true }) })}`,
)
useHead({ title: `Documents - ${index.uid}` })
</script>

<i18n>
en:
  nbDocs: "{nb} document | {nb} documents | {nb} documents"
  updatedAt: "Last updated: {updatedAt}"
  actions:
    goToSettings: Go to Index Settings
    documentView: View as documents
    tableView: View as data table
    mapView: View as map
    toggleFilters: Open filter panel
    clearTenantToken: Clear tenant token
  labels:
    filters: Sort & Filter
    multitenancyEnabled: Tenant preview
    search: Search...
  errors:
    personalizeFailed: Search personalization isn't configured on this instance. It has been turned off.
</i18n>
