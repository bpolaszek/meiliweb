<template>
  <Layout :title="humanizeString(index.uid)" :subtitle="subtitle">
    <SlideOver no-padding v-model:open="filterPanelOpen" :title="t('labels.filters')">
      <FilterPanel
        v-model:applied-sort="appliedSort"
        v-model:facets="facets"
        v-model:applied-filters="appliedFilters"
        :client="searchClient"
        :index-uid="index.uid"
        :sortable-attributes="sortableAttributes"
        :filterable-attributes="filterableAttributes" />
    </SlideOver>

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

      <SearchInput v-model="searchTerms" class="grow lg:w-80" />

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
      :fields="fields" />

    <template #footer>
      <DocumentsFooter
        v-model:offset="offset"
        v-model:items-per-page="itemsPerPage"
        :current-page="currentPage"
        :last-page="lastPage"
        :previous-page="previousPage"
        :next-page="nextPage"
        :nb-total-items="resultset.estimatedTotalHits"
        :processing-time-ms="resultset.processingTimeMs" />
    </template>
  </Layout>
</template>

<script setup lang="ts">
import { useFields, useIndexLocalSettings, useMeiliClient, useMultiTenancy, usePagination } from '~/composables'
import { tryOrThrow } from '~/utils'
import { NuxtLink } from '#components'
import SlideOver from '~/components/layout/SlideOver.vue'
import FilterPanel from '~/components/documents/FilterPanel.vue'
import { AppliedFilters } from '~/utils/applied-filters'
import humanizeString from 'humanize-string'
import SearchInput from '~/components/layout/forms/SearchInput.vue'
import match from 'match-operator'
import DocumentsAsCards from '~/components/documents/DocumentsAsCards.vue'
import DocumentsAsTable from '~/components/documents/DocumentsAsTable.vue'
import Button from '~/components/layout/forms/Button.vue'
import DocumentsAsMap from '~/components/documents/DocumentsAsMap.vue'
import { reactiveComputed } from '@vueuse/core'

const { t } = useI18n()
const route = useRoute()
const indexUid = route.params.indexUid
const meili = useMeiliClient()
const tenant = useMultiTenancy()
const searchClient = reactiveComputed(() => (tenant.tenantToken ? useMeiliClient(tenant.tenantToken as string) : meili))
const { formatDate } = useDateFormatter()
const index = await tryOrThrow(() => meili.getIndex(indexUid as string))
const filterPanelOpen = ref(false)
const [primaryKey, filterableAttributes, sortableAttributes, stats] = await Promise.all([
  index.fetchPrimaryKey() as Promise<string>,
  index.getFilterableAttributes(),
  index.getSortableAttributes(),
  index.getStats(),
])

const { fields } = useFields(primaryKey, Object.keys(stats.fieldDistribution))
const { appliedSort, facets, itemsPerPage, viewMode } = useIndexLocalSettings(index.uid)
const appliedFilters = reactive(new AppliedFilters()) as AppliedFilters
const searchTerms = ref('')
const { offset, totalItems, currentPage, previousPage, nextPage, lastPage } = usePagination(itemsPerPage)
const searchParams = reactive({
  q: searchTerms,
  sort: appliedSort,
  limit: itemsPerPage,
  offset,
  filter: computed(() => `${appliedFilters}`),
})
const resultset = ref(await tryOrThrow(() => searchClient.index(index.uid).search(null, searchParams)))

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
watch(appliedSort, () => (searchParams.offset = 0))
watch(appliedFilters, () => (searchParams.offset = 0))
watch(itemsPerPage, () => (searchParams.offset = 0))
watch(searchTerms, () => (searchParams.offset = 0))
watch(
  searchParams,
  async (searchParams) => (self.resultset = await searchClient.index(index.uid).search(null, searchParams)),
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
</i18n>
