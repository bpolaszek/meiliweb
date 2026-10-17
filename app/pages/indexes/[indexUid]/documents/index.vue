<template>
  <Layout no-padding-bottom :title="humanizeString(index.uid)" :subtitle="subtitle">
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

      <button v-tippy="t('actions.searchSettings')" type="button" @click="openSearchSettings()">
        <Icon
          name="ph:sliders-fill"
          :class="[
            'size-6',
            hasCustomSearchSettings ? 'text-primary-600 hover:text-primary-800' : 'text-gray-600 hover:text-gray-800',
          ]" />
      </button>

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

    <SimilarDocumentsBanner
      v-if="similarDocuments"
      v-model:embedder="selectedEmbedder"
      :document-id="similarDocuments.documentId"
      :embedders="embedderNames"
      @close="clearSimilarDocuments()"
      class="mb-6 w-full" />

    <DocumentsEmptyState
      v-if="0 === resultset.estimatedTotalHits"
      :index-uid="index.uid"
      :request-has-filters="!!(searchParams.filter || searchParams.q)"></DocumentsEmptyState>

    <MainComponent
      v-else
      :index-uid="index.uid"
      :documents="hits"
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
        :performance-details="resultset.performanceDetails"
        :show-rerank="personalizeAvailable"
        :can-rerank="'' !== personalizeUserContext.trim()"
        :rerank-loading="rerankLoading"
        :personalize-applied="personalizeApplied"
        @rerank="rerank" />
    </template>
  </Layout>
</template>

<script setup lang="ts">
import {
  extractEmbedding,
  provideDocumentViewer,
  provideHighlightTags,
  provideSimilarDocuments,
  useFields,
  useIndexLocalSettings,
  useMeiliClient,
  useMultiTenancy,
  usePagination,
  type DocumentId,
} from '~/composables'
import {
  buildSearchParams,
  DEFAULT_SEARCH_SETTINGS,
  getFacetSearchableAttributePatterns,
  getFilterableAttributePatterns,
  getFormattedAttributes,
  tryOrThrow,
  type SearchSettings,
} from '~/utils'
import { NuxtLink } from '#components'
import FilterPanel from '~/components/documents/FilterPanel.vue'
import { AppliedFilters } from '~/utils/applied-filters'
import humanizeString from 'humanize-string'
import match from 'match-operator'
import DocumentsAsCards from '~/components/documents/DocumentsAsCards.vue'
import DocumentsAsTable from '~/components/documents/DocumentsAsTable.vue'
import Button from '~/components/layout/forms/Button.vue'
import DocumentsAsMap from '~/components/documents/DocumentsAsMap.vue'
import SimilarDocumentsBanner from '~/components/documents/SimilarDocumentsBanner.vue'
import SearchSettingsModal from '~/components/documents/search-settings/SearchSettingsModal.vue'
import { reactiveComputed } from '@vueuse/core'
import { field as filterField } from 'meilisearch-filters'
import type { SearchParams } from 'meilisearch'
import { TOAST_FAILURE, usePromisifiedDialogs, useToasts, useVersion } from '~/stores'

const { t } = useI18n()
const route = useRoute()
const indexUid = route.params.indexUid
const meili = useMeiliClient()
const tenant = useMultiTenancy()
const { satisfiesVersion } = useVersion()
const { createToast } = useToasts()
const { openDialog } = usePromisifiedDialogs()
// Search personalization requires Meilisearch >= 1.25. Unlike hybrid search's embedders,
// there's no capability endpoint to probe whether the instance's Cohere key is actually
// configured — that can only be discovered by a failing search, handled below.
const personalizeAvailable = computed(() => satisfiesVersion('>=1.25.0'))
const searchClient = reactiveComputed(() => (tenant.tenantToken ? useMeiliClient(tenant.tenantToken as string) : meili))
const { formatDate } = useDateFormatter()
const index = await tryOrThrow(() => meili.getIndex(indexUid as string))
const filterPanelOpen = ref(false)
const [primaryKey, rawFilterableAttributes, sortableAttributes, searchableAttributes, stats] = await Promise.all([
  index.fetchPrimaryKey() as Promise<string>,
  index.getFilterableAttributes(),
  index.getSortableAttributes(),
  index.getSearchableAttributes(),
  index.getStats(),
])
const filterableAttributes = getFilterableAttributePatterns(rawFilterableAttributes)
const facetSearchableAttributes = getFacetSearchableAttributePatterns(rawFilterableAttributes)

const { fields } = useFields(primaryKey, Object.keys(stats.fieldDistribution), index.uid)
const { appliedSort, facets, itemsPerPage, viewMode, searchSettings, similarDocumentsEmbedder } = useIndexLocalSettings(
  index.uid,
)
const appliedFilters = reactive(new AppliedFilters()) as AppliedFilters

// Facets/sort stored while connected to this index may no longer be filterable/sortable (removed
// from the index settings since last visit) — reconcile against the live lists *before* they can
// ever be sent to Meilisearch, which would otherwise reject the search and break the page.
const validFacets = facets.value.filter((facet) => filterableAttributes.includes(facet))
if (validFacets.length !== facets.value.length) facets.value = validFacets
const validSort = appliedSort.value.filter((sort) => sortableAttributes.includes(sort.replace(/:(asc|desc)$/, '')))
if (validSort.length !== appliedSort.value.length) appliedSort.value = validSort
const searchTerms = ref('')
const { offset, totalItems, currentPage, previousPage, nextPage, lastPage } = usePagination(itemsPerPage)

// Settings are only ever replaced wholesale (the modal hands back a full object), so patching a
// single knob goes through here rather than mutating the stored object in place.
const updateSearchSettings = (patch: Partial<SearchSettings>) =>
  (searchSettings.value = { ...searchSettings.value, ...patch })

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

// Resets everything hybrid-related in one go, so no caller can reset one field and forget the
// others (e.g. leaving a stale semanticRatio next to an empty embedder).
const resetHybridSearch = () =>
  updateSearchSettings({
    hybridEnabled: DEFAULT_SEARCH_SETTINGS.hybridEnabled,
    hybridEmbedder: DEFAULT_SEARCH_SETTINGS.hybridEmbedder,
    hybridSemanticRatio: DEFAULT_SEARCH_SETTINGS.hybridSemanticRatio,
  })

// The embedder stored in localStorage may no longer exist (renamed/deleted since the user
// last configured hybrid search) — reconcile against the live list *before* it can ever be
// sent to Meilisearch, which would otherwise reject the search and break the page.
if (!hasEmbedders) {
  if (searchSettings.value.hybridEnabled || searchSettings.value.hybridEmbedder) resetHybridSearch()
} else if (searchSettings.value.hybridEmbedder && !embedderNames.includes(searchSettings.value.hybridEmbedder)) {
  resetHybridSearch()
}
// Pre-select an embedder for convenience once one exists — this only fills the dropdown,
// it does NOT turn hybrid search on (hybridEnabled stays whatever it was/defaults to false).
if (hasEmbedders && !searchSettings.value.hybridEmbedder) {
  updateSearchSettings({ hybridEmbedder: embedderNames[0] })
}

// Same reconciliation for the embedder the "similar documents" mode compares on, which is
// remembered per index: a stored embedder that no longer exists must never reach a search request.
if (!hasEmbedders) {
  similarDocumentsEmbedder.value = null
} else if (!similarDocumentsEmbedder.value || !embedderNames.includes(similarDocumentsEmbedder.value)) {
  similarDocumentsEmbedder.value = embedderNames[0] as string
}
// Non-null wherever the banner is rendered: the mode can only be entered when an embedder exists.
const selectedEmbedder = computed({
  get: () => similarDocumentsEmbedder.value as string,
  set: (embedder: string) => (similarDocumentsEmbedder.value = embedder),
})

// The document the results are currently compared to, together with the embedding it was compared
// on. Both are kept in a single ref so the embedder and its vector can never be out of sync — a
// vector of the wrong dimensions would make every subsequent search fail. `null` = plain search.
type SimilarDocuments = { documentId: DocumentId; embedder: string; vector: Array<number> }
const similarDocuments = ref<SimilarDocuments | null>(null)
const clearSimilarDocuments = () => {
  similarDocuments.value = null
  offset.value = 0
}

// Fetching the document's embedding is what "find similar documents" really does: the vector then
// rides along with every search until the mode is closed. Failures (no embedding for this
// embedder, document gone, ...) fall back to plain search rather than leaving a stale vector
// behind — see the note on the ref above.
const findSimilarDocuments = async (documentId: DocumentId) => {
  const embedder = similarDocumentsEmbedder.value
  if (!embedder) return
  try {
    const document = await meili.index(index.uid).getDocument(documentId, { retrieveVectors: true })
    const vector = extractEmbedding(document, embedder)
    if (null === vector) throw new Error(t('errors.noEmbedding', { embedder }))
    searchTerms.value = ''
    offset.value = 0
    similarDocuments.value = { documentId, embedder, vector }
  } catch (error) {
    clearSimilarDocuments()
    createToast({
      ...TOAST_FAILURE(t),
      title: t('errors.similarDocumentsFailed'),
      text: (error as Error).message,
    })
  }
}
// Provided only where it can work, so the button hides itself on indexes without embedders.
if (hasEmbedders) provideSimilarDocuments(findSimilarDocuments)

// Comparing to a document is a pure vector search: the embedding replaces the query entirely, and
// it overrides whatever hybrid search the user configured for as long as the mode is on.
// Meilisearch only accepts `vector` alongside `hybrid.embedder`.
const similarSearchParams = computed<SearchParams>(() =>
  similarDocuments.value
    ? {
        q: '',
        vector: similarDocuments.value.vector,
        hybrid: { embedder: similarDocuments.value.embedder, semanticRatio: 1 },
      }
    : {},
)

// The compared document itself would always come back first, with a perfect similarity score.
// Excluding it server-side keeps the hit count honest, but filtering on the primary key requires
// it to be filterable — which it isn't by default, hence the client-side fallback in `hits`.
const canExcludeSimilarDocument = filterableAttributes.includes(primaryKey)
const searchFilter = computed(() => {
  const applied = `${appliedFilters}`
  if (!similarDocuments.value || !canExcludeSimilarDocument) return applied
  const exclusion = filterField(primaryKey).notEquals(similarDocuments.value.documentId).toString()
  return applied ? `(${applied}) AND ${exclusion}` : exclusion
})

// Guarded here too (not just hidden in the modal's UI) so a value persisted while connected to a
// newer instance can't leak into a request against an older one.
const effectiveSettings = computed<SearchSettings>(() => ({
  ...searchSettings.value,
  showPerformanceDetails: searchSettings.value.showPerformanceDetails && satisfiesVersion('>=1.35.0'),
}))
const searchParams = computed<SearchParams>(() => ({
  q: searchTerms.value,
  sort: appliedSort.value,
  limit: itemsPerPage.value,
  offset: offset.value,
  filter: searchFilter.value,
  ...buildSearchParams(effectiveSettings.value),
  ...similarSearchParams.value,
  // personalize is deliberately NOT wired in here: reranking via Cohere is slow and rate-limited,
  // so it must never ride along with search-as-you-type. It's only sent by rerank() below, on
  // explicit user action.
}))
// Anything the user tuned beyond Meilisearch's defaults ends up as a search parameter — which is
// exactly what the settings button lights up for.
const hasCustomSearchSettings = computed(
  () =>
    Object.keys(buildSearchParams(effectiveSettings.value)).length > 0 ||
    '' !== searchSettings.value.personalizeUserContext,
)
const resultset = ref(await tryOrThrow(() => searchClient.index(index.uid).search(null, searchParams.value)))

// Highlighted matches come back wrapped in the configured markers; StringRenderer strips them and
// paints the matches. Cropped-only attributes carry no markers, hence the guard on highlighting.
provideHighlightTags(() =>
  searchSettings.value.attributesToHighlight.length > 0
    ? { preTag: searchSettings.value.highlightPreTag, postTag: searchSettings.value.highlightPostTag }
    : null,
)

const displayFields = computed(() => {
  const { attributesToRetrieve, showRankingScore, showRankingScoreDetails } = searchSettings.value
  // An empty list means Meilisearch returns everything — see SearchSettings.
  const retrieved =
    0 === attributesToRetrieve.length
      ? fields.value
      : fields.value.filter((field) => attributesToRetrieve.includes(field))
  return [
    ...retrieved,
    ...(showRankingScore ? ['_rankingScore'] : []),
    ...(showRankingScoreDetails ? ['_rankingScoreDetails'] : []),
  ]
})
const hasGeoDocuments = computed(() => Object.keys(stats.fieldDistribution).includes('_geo'))
const canFilterGeoDocuments = computed(() => filterableAttributes.includes('_geo'))
const self = reactive({
  resultset,
  totalItems,
  viewMode,
})
// Highlighted and cropped attributes are only available in `_formatted`; swapping them in here
// keeps every view (table, cards, map) unaware that the values went through Meilisearch's
// formatter. Untouched attributes keep their raw value — and their type. `_formatted` itself is
// dropped: the cards view lists whatever keys a hit carries, and it has no business being one.
const hits = computed(() => {
  // Excluding the compared document server-side isn't always possible (see the search filter
  // above) — it is then dropped here, at the cost of one row missing from the page.
  const documents =
    similarDocuments.value && !canExcludeSimilarDocument
      ? self.resultset.hits.filter((hit: any) => `${hit[primaryKey]}` !== `${similarDocuments.value?.documentId}`)
      : self.resultset.hits
  const formattedAttributes = getFormattedAttributes(searchSettings.value)
  if (0 === formattedAttributes.length) return documents
  return documents.map(({ _formatted, ...hit }: Record<string, any>) => ({
    ...hit,
    ...Object.fromEntries(
      formattedAttributes.filter((field) => field in (_formatted ?? {})).map((field) => [field, _formatted[field]]),
    ),
  }))
})
const MainComponent = computed(() =>
  match(self.viewMode, [
    ['documents', DocumentsAsCards],
    ['table', DocumentsAsTable],
    ['map', DocumentsAsMap],
  ]),
)

const openSearchSettings = async () => {
  try {
    const settings = await openDialog(SearchSettingsModal, {
      settings: searchSettings.value,
      attributes: fields.value,
      primaryKey,
      filterableAttributes,
      searchableAttributes,
      embedders: embedderNames,
      personalizeAvailable: personalizeAvailable.value,
    })
    searchSettings.value = settings
    // Narrower results may not reach the page the user was on.
    offset.value = 0
  } catch {
    // DismissedDialog — the modal was closed without applying anything, leave the search alone.
  }
}

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
  self.resultset = await searchClient.index(index.uid).search(null, searchParams.value)
  personalizeApplied.value = false
}

// Explicit, user-triggered rerank of the current results via Cohere personalization — see the
// comment on searchParams above for why this isn't wired into search-as-you-type.
const rerankLoading = ref(false)
// Tracks whether the currently displayed results are the personalized ones, so the rerank
// button can reflect it — cleared as soon as any other search overwrites the resultset.
const personalizeApplied = ref(false)
// An empty user context is what "personalization off" looks like now that the modal has no
// switch for it: there is nothing to personalize on.
const personalizeUserContext = computed(() => searchSettings.value.personalizeUserContext)
const rerank = async () => {
  // Toggle: re-clicking while personalized results are showing reverts to the plain search
  // instead of reranking again.
  if (personalizeApplied.value) {
    rerankLoading.value = true
    self.resultset = await searchClient.index(index.uid).search(null, searchParams.value)
    personalizeApplied.value = false
    rerankLoading.value = false
    return
  }
  rerankLoading.value = true
  try {
    self.resultset = await searchClient.index(index.uid).search(null, {
      ...searchParams.value,
      personalize: { userContext: personalizeUserContext.value },
    })
    personalizeApplied.value = true
  } catch (error) {
    // There's no way to know ahead of time whether personalization is usable on this instance
    // (see personalizeAvailable above) — a rejected search is the only signal, and its message is
    // the only thing that tells the two failure modes apart: the feature being off entirely, or a
    // key the instance can't authenticate with. Hence the server's own wording, and hence *not*
    // clearing the user context: it's valid input, and it's the only way back to this state.
    createToast({
      ...TOAST_FAILURE(t),
      title: t('errors.personalizeFailed'),
      text: (error as Error).message,
    })
  } finally {
    rerankLoading.value = false
  }
}

watch(appliedSort, () => (offset.value = 0))
watch(appliedFilters, () => (offset.value = 0))
watch(itemsPerPage, () => (offset.value = 0))
// Typing a query means the user wants to search again, not to keep comparing to a document.
watch(searchTerms, (searchTerms) => {
  if ('' !== searchTerms) clearSimilarDocuments()
  offset.value = 0
})
// Switching embedder re-compares the same document on the new one.
watch(similarDocumentsEmbedder, () => {
  if (similarDocuments.value) findSimilarDocuments(similarDocuments.value.documentId)
})
watch(searchParams, async (searchParams) => {
  self.resultset = await searchClient.index(index.uid).search(null, searchParams)
  personalizeApplied.value = false
})
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
    searchSettings: Search settings
    clearTenantToken: Clear tenant token
  labels:
    filters: Sort & Filter
    multitenancyEnabled: Tenant preview
    search: Search...
  errors:
    personalizeFailed: Personalized search failed
    similarDocumentsFailed: Could not find similar documents
    noEmbedding: This document has no embedding for the "{embedder}" embedder.
</i18n>
