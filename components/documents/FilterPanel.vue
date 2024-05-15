<template>
  <div class="divide-y divide-gray-200">
    <section class="space-y-2 px-4 pb-6 sm:px-6">
      <h3 class="text-md font-medium">{{ t('titles.sort') }}</h3>
      <UniqueId v-if="sortableAttributes.length > 0" v-slot="{ id }">
        <div class="flex items-center justify-between gap-1 text-sm">
          <Label :for="id" class="text-gray-400">
            {{ t('labels.sortBy') }}
          </Label>
          <Select :id="id" v-model="appliedSort">
            <option :value="[]">Default</option>
            <template v-for="attribute of sortableAttributes">
              <option :value="[`${attribute}:asc`]">
                {{ humanizeString(attribute) }} ⬆
              </option>
              <option :value="[`${attribute}:desc`]">
                {{ humanizeString(attribute) }} ⬇
              </option>
            </template>
          </Select>
        </div>
      </UniqueId>
      <i18n-t
        v-else
        keypath="emptyStates.sort.text"
        tag="p"
        class="text-sm font-light italic text-gray-600">
        <template v-slot:link>
          <NuxtLink
            :to="`/indexes/${indexUid}/settings/sortable-attributes`"
            class="text-primary-600">
            {{ t('emptyStates.sort.link') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </section>

    <section class="space-y-2 px-4 pb-6 pt-6 sm:px-6">
      <h3 class="text-md font-medium">{{ t('titles.facets') }}</h3>
      <UniqueId v-if="filterableAttributes.length > 0" v-slot="{ id }">
        <div class="space-y-1 text-sm">
          <MultiCombobox
            v-model="facets"
            :items="filterableAttributes.filter(a => '_geo' !== a)"
            class="block w-full"
            :input-attrs="{
              class: 'text-xs',
              placeholder: t('placeholders.enableFacets'),
            }" />
        </div>
      </UniqueId>
      <i18n-t
        v-else
        keypath="emptyStates.facets.text"
        tag="p"
        class="text-sm font-light italic text-gray-600">
        <template v-slot:link>
          <NuxtLink
            :to="`/indexes/${indexUid}/settings/filterable-attributes`"
            class="text-primary-600">
            {{ t('emptyStates.facets.link') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </section>

    <section
      v-if="(facets as NonNullable<string[]>).length > 0"
      class="space-y-6 pb-6 pt-6">
      <h3 class="text-md px-4 font-medium sm:px-6">
        {{ t('titles.filters') }}
      </h3>
      <template v-for="facet of facets" :key="facet">
        <StringFacet
          v-if="FACET_TYPE_STRING === facetsTypeMap.get(facet)"
          :index-uid="indexUid"
          :facet
          :applied-filters="appliedFilters" />
        <RangeFacet
          v-if="FACET_TYPE_RANGE === facetsTypeMap.get(facet)"
          :index-uid="indexUid"
          :facet
          :min="facetStats[facet].min"
          :max="facetStats[facet].max"
          :applied-filters="appliedFilters" />
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useMeiliClient } from '~/composables'
import MultiCombobox from '~/components/layout/forms/MultiCombobox.vue'
import StringFacet from '~/components/documents/StringFacet.vue'
import type { AppliedFilters } from '~/utils/applied-filters'
import type { FacetDistribution, FacetStats } from 'meilisearch'
import RangeFacet from '~/components/documents/RangeFacet.vue'
import Select from '~/components/layout/forms/Select.vue'
import Label from '~/components/layout/forms/Label.vue'
import humanizeString from 'humanize-string'

type Props = {
  indexUid: string
  sortableAttributes: string[]
  filterableAttributes: string[]
}
const props = defineProps<Props>()
const { t } = useI18n()
const meili = useMeiliClient()
const appliedSort = defineModel<string[]>('appliedSort')
const appliedFilters = defineModel<AppliedFilters>(
  'appliedFilters',
) as unknown as AppliedFilters
const facets = defineModel<string[]>('facets')
const FACET_TYPE_STRING = Symbol()
const FACET_TYPE_RANGE = Symbol()
const FACET_TYPE_GEO = Symbol()
const self = reactive({
  facets,
  appliedStringFilters: appliedFilters,
  facetsTypeMap: new Map(),
  facetStats: {} as FacetStats,
})
const hydrateFacetsTypes = async (facets: string[]) => {
  const search = await meili.index(props.indexUid).search(
    null,
    reactive({
      limit: 0,
      facets,
    }),
  )
  const stringFacets = Object.keys(
    search.facetDistribution as FacetDistribution,
  )
  const numericFacets = Object.keys(search.facetStats as FacetStats)
  for (const facet of facets) {
    if ('_geo' === facet) {
      self.facetsTypeMap.set(facet, FACET_TYPE_GEO)
    } else if (numericFacets.includes(facet)) {
      self.facetsTypeMap.set(facet, FACET_TYPE_RANGE)
    } else if (stringFacets.includes(facet)) {
      self.facetsTypeMap.set(facet, FACET_TYPE_STRING)
    }
  }

  self.facetStats = search.facetStats as FacetStats
}

watch(facets as unknown as string[], hydrateFacetsTypes)
const { facetsTypeMap, facetStats } = toRefs(self)
await hydrateFacetsTypes(self.facets as unknown as string[])
</script>

<i18n>
en:
  titles:
    sort: Sort documents
    facets: Facets
    filters: Filters
  labels:
    sortBy: "Sort by:"
  placeholders:
    enableFacets: "Enable facets..."
  emptyStates:
    sort:
      text: Sorting is not enabled on this index.
            Go to {link} to configure it.
      link: Settings > Sortable attributes
    facets:
      text: Filtering is not enabled on this index.
            Go to {link} to configure it.
      link: Settings > Filterable attributes
</i18n>
