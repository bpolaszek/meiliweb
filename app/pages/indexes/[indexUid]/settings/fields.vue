<template>
  <section class="space-y-4">
    <h3 class="inline-flex w-full items-start justify-between">
      <span class="inline-flex flex-col gap-1">
        <span class="text-xl font-semibold">{{ t('title') }}</span>
        <span class="text-sm text-gray-600 italic">{{ t('description') }}</span>
      </span>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/indexes/list-index-fields" />
    </h3>

    <Alert v-if="!available" theme="warning" :title="t('unavailable.title')">
      {{ t('unavailable.text', { version: FIELDS_MIN_VERSION }) }}
    </Alert>

    <template v-else>
      <Alert v-if="self.error" dismissable theme="danger" @close="self.error = null">
        {{ self.error }}
      </Alert>

      <div class="flex flex-wrap items-end gap-3">
        <UFormField :label="t('filters.pattern')" class="min-w-56 flex-1">
          <UInput v-model="self.pattern" :placeholder="t('filters.patternPlaceholder')" class="w-full" />
        </UFormField>

        <UFormField v-for="key in booleanFilterKeys" :key="key" :label="t(`filters.labels.${key}`)">
          <USelect v-model="self.filters[key]" :items="triStateItems" class="w-32" />
        </UFormField>
      </div>

      <Table
        :items="self.fields.results"
        :columns="[
          t('columns.field'),
          t('columns.displayed'),
          t('columns.searchable'),
          t('columns.sortable'),
          t('columns.distinct'),
          t('columns.rankingRule'),
          t('columns.filterable'),
          t('columns.localized'),
        ]">
        <template #default="{ item }">
          <td class="font-mono text-xs font-medium">{{ item.name }}</td>
          <td class="text-center">
            <Icon v-if="item.displayed?.enabled" name="mdi:check" class="text-green-600" />
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
          <td class="text-center">
            <Icon v-if="item.searchable?.enabled" name="mdi:check" class="text-green-600" />
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
          <td class="text-center">
            <Icon v-if="item.sortable?.enabled" name="mdi:check" class="text-green-600" />
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
          <td class="text-center">
            <Icon v-if="item.distinct?.enabled" name="mdi:check" class="text-green-600" />
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
          <td class="text-center">
            <span v-if="item.rankingRule?.enabled" class="inline-flex items-center gap-1">
              <Icon name="mdi:check" class="text-green-600" />
              <Badge v-if="item.rankingRule.order" theme="neutral" class="text-xs">
                {{ item.rankingRule.order }}
              </Badge>
            </span>
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
          <td>
            <span v-if="item.filterable?.enabled" class="inline-flex flex-wrap items-center gap-1">
              <Icon name="mdi:check" class="text-green-600" />
              <Badge v-if="item.filterable.sortBy" theme="neutral" class="text-xs">
                {{ t('badges.sortBy', { value: item.filterable.sortBy }) }}
              </Badge>
              <Badge v-if="item.filterable.facetSearch" theme="neutral" class="text-xs">
                {{ t('badges.facetSearch') }}
              </Badge>
              <Badge v-if="item.filterable.equality" theme="neutral" class="text-xs">
                {{ t('badges.equality') }}
              </Badge>
              <Badge v-if="item.filterable.comparison" theme="neutral" class="text-xs">
                {{ t('badges.comparison') }}
              </Badge>
            </span>
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
          <td>
            <span v-if="item.localized?.locales?.length" class="inline-flex flex-wrap gap-1">
              <Badge v-for="locale in item.localized.locales" :key="locale" theme="neutral" class="text-xs">
                {{ locale }}
              </Badge>
            </span>
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
        </template>
      </Table>

      <div v-if="0 === self.fields.results.length" class="py-8 text-center text-sm text-gray-400 italic">
        {{ t('emptyState') }}
      </div>

      <div class="flex items-center justify-between">
        <PageSize v-model="itemsPerPage" />
        <UPagination
          :page="currentPage"
          :total="lastPage"
          :items-per-page="1"
          :sibling-count="2"
          active-color="primary"
          variant="ghost"
          @update:page="handlePageChange" />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import type { FieldsFilter, FieldsResults } from 'meilisearch'
import { usePagination } from '~/composables'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Alert from '~/components/layout/Alert.vue'
import Badge from '~/components/layout/Badge.vue'
import Table from '~/components/layout/tables/Table.vue'
import PageSize from '~/components/layout/pagination/PageSize.vue'
import { tryOrThrow } from '~/utils'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()

const { t } = useI18n()
const meili = useMeiliClient()
const index = meili.index(props.indexUid)
const { satisfiesVersion } = useVersion()

/** The `POST /indexes/{indexUid}/fields` endpoint landed in Meilisearch 1.33. */
const FIELDS_MIN_VERSION = '>=1.33.0'
const available = computed(() => satisfiesVersion(FIELDS_MIN_VERSION))

const booleanFilterKeys = ['displayed', 'searchable', 'sortable', 'distinct', 'rankingRule', 'filterable'] as const
type BooleanFilterKey = (typeof booleanFilterKeys)[number]

/** `USelect` reserves the empty string for "no selection", so "any" needs its own sentinel. */
const ANY = 'any'
type TriState = typeof ANY | 'true' | 'false'
const toBool = (value: TriState): boolean | undefined => (ANY === value ? undefined : 'true' === value)

const triStateItems = computed(() => [
  { label: t('filters.any'), value: ANY },
  { label: t('filters.yes'), value: 'true' },
  { label: t('filters.no'), value: 'false' },
])

const itemsPerPage = ref(20)
const { offset, totalItems, currentPage, lastPage } = usePagination(itemsPerPage)

const self = reactive({
  error: null as string | null,
  pattern: '',
  filters: Object.fromEntries(booleanFilterKeys.map((key) => [key, ANY as TriState])) as Record<
    BooleanFilterKey,
    TriState
  >,
  fields: { results: [], offset: 0, limit: 0, total: 0 } as FieldsResults,
  totalItems,
  offset,
  itemsPerPage,
  currentPage,
  lastPage,
})

const buildFilter = (): FieldsFilter | undefined => {
  const booleanFilters: Partial<Record<BooleanFilterKey, boolean>> = {}
  for (const key of booleanFilterKeys) {
    const value = toBool(self.filters[key])
    if (undefined !== value) {
      booleanFilters[key] = value
    }
  }
  const pattern = self.pattern.trim()
  const filter: FieldsFilter = {
    ...booleanFilters,
    ...(pattern ? { attributePatterns: [pattern] } : {}),
  }
  return Object.keys(filter).length > 0 ? filter : undefined
}

const fetchFields = () =>
  tryOrThrow(async () => {
    const result = await index.getFields({ offset: self.offset, limit: self.itemsPerPage, filter: buildFilter() })
    self.totalItems = result.total
    return result
  })

const refetch = async () => {
  if (!available.value) {
    return
  }
  self.error = null
  self.fields = await fetchFields()
}

watch(offset, refetch)
watch(itemsPerPage, refetch)
watch(available, (isAvailable) => isAvailable && refetch(), { immediate: true })
watchDebounced(
  [() => self.pattern, () => self.filters],
  async () => {
    self.offset = 0
    await refetch()
  },
  { debounce: 300, deep: true },
)

const handlePageChange = (page: number) => (self.offset = (page - 1) * self.itemsPerPage)

useHead({
  title: `${t('title')} - ${index.uid}`,
})
</script>

<i18n>
en:
  title: Fields
  description: Detailed metadata about every field in this index — display, search, filtering and localization settings.
  emptyState: No fields match your filters.
  unavailable:
    title: Field details are not available
    text: 'Listing field details requires Meilisearch {version}. This instance runs an older version.'
  filters:
    pattern: Attribute / Pattern
    patternPlaceholder: "e.g. genre or price.*"
    any: Any
    yes: 'Yes'
    no: 'No'
    labels:
      displayed: Displayed
      searchable: Searchable
      sortable: Sortable
      distinct: Distinct
      rankingRule: Ranking rule
      filterable: Filterable
  columns:
    field: Field
    displayed: Displayed
    searchable: Searchable
    sortable: Sortable
    distinct: Distinct
    rankingRule: Ranking Rule
    filterable: Filterable
    localized: Localized
  badges:
    sortBy: 'sortBy: {value}'
    facetSearch: facet search
    equality: equality
    comparison: comparison
</i18n>
