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

      <div class="flex flex-wrap items-center gap-3">
        <UInput
          v-model="self.pattern"
          icon="i-lucide-search"
          :placeholder="t('filters.patternPlaceholder')"
          class="min-w-56 flex-1" />

        <UPopover>
          <UChip v-if="activeBooleanFilterKeys.length > 0" :text="activeBooleanFilterKeys.length" size="sm">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-sliders-horizontal"
              :label="t('filters.button')" />
          </UChip>
          <UButton
            v-else
            color="neutral"
            variant="outline"
            icon="i-lucide-sliders-horizontal"
            :label="t('filters.button')" />

          <template #content>
            <div class="w-72 space-y-3 p-4">
              <div v-for="key in booleanFilterKeys" :key="key" class="flex items-center justify-between gap-3">
                <span class="text-sm">{{ t(`filters.labels.${key}`) }}</span>
                <UFieldGroup size="xs">
                  <UButton
                    v-for="option in triStateItems"
                    :key="option.value"
                    :label="option.label"
                    :color="option.value === self.filters[key] ? 'primary' : 'neutral'"
                    :variant="option.value === self.filters[key] ? 'solid' : 'outline'"
                    @click="self.filters[key] = option.value" />
                </UFieldGroup>
              </div>

              <UButton
                v-if="activeBooleanFilterKeys.length > 0"
                color="neutral"
                variant="ghost"
                size="xs"
                :label="t('filters.reset')"
                class="w-full justify-center"
                @click="resetBooleanFilters" />
            </div>
          </template>
        </UPopover>
      </div>

      <div v-if="activeBooleanFilterKeys.length > 0" class="flex flex-wrap items-center gap-2">
        <UBadge
          v-for="key in activeBooleanFilterKeys"
          :key="key"
          color="neutral"
          variant="subtle"
          class="cursor-pointer gap-1"
          @click="self.filters[key] = ANY">
          {{ t(`filters.labels.${key}`) }}: {{ 'true' === self.filters[key] ? t('filters.yes') : t('filters.no') }}
          <Icon name="mdi:close" class="size-3" />
        </UBadge>
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
          <td class="align-top font-mono text-xs font-medium">{{ item.name }}</td>
          <td class="text-center align-top">
            <Icon v-if="item.displayed?.enabled" name="mdi:check" class="text-green-600" />
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
          <td class="text-center align-top">
            <Icon v-if="item.searchable?.enabled" name="mdi:check" class="text-green-600" />
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
          <td class="text-center align-top">
            <Icon v-if="item.sortable?.enabled" name="mdi:check" class="text-green-600" />
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
          <td class="text-center align-top">
            <Icon v-if="item.distinct?.enabled" name="mdi:check" class="text-green-600" />
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
          <td class="align-top">
            <span v-if="item.rankingRule?.enabled" class="inline-flex items-center gap-1.5">
              <Icon name="mdi:check" class="shrink-0 text-green-600" />
              <span v-if="item.rankingRule.order" class="text-xs text-gray-500">{{ item.rankingRule.order }}</span>
            </span>
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
          <td class="align-top">
            <span v-if="item.filterable?.enabled" class="inline-flex items-start gap-1.5">
              <Icon name="mdi:check" class="mt-0.5 shrink-0 text-green-600" />
              <span class="text-xs text-gray-500">{{ filterableDetails(item.filterable) }}</span>
            </span>
            <Icon v-else name="mdi:minus" class="text-gray-300" />
          </td>
          <td class="align-top">
            <span v-if="item.localized?.locales?.length" class="text-xs text-gray-500">
              {{ item.localized.locales.join(', ') }}
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
import type { FieldsFilter, FieldsResults, IndexField } from 'meilisearch'
import { usePagination } from '~/composables'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Alert from '~/components/layout/Alert.vue'
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

const activeBooleanFilterKeys = computed(() => booleanFilterKeys.filter((key) => ANY !== self.filters[key]))
const resetBooleanFilters = () => {
  for (const key of booleanFilterKeys) self.filters[key] = ANY
}

const filterableDetails = (filterable: NonNullable<IndexField['filterable']>) =>
  [
    filterable.sortBy ? t('badges.sortBy', { value: filterable.sortBy }) : null,
    filterable.facetSearch ? t('badges.facetSearch') : null,
    filterable.equality ? t('badges.equality') : null,
    filterable.comparison ? t('badges.comparison') : null,
  ]
    .filter(Boolean)
    .join(' · ')

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
    patternPlaceholder: "e.g. genre or price.*"
    button: Filters
    reset: Reset filters
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
