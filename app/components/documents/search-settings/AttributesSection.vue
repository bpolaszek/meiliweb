<template>
  <SettingsSection :title="t('title')" href="https://www.meilisearch.com/docs/reference/api/search">
    <div class="max-h-72 overflow-y-auto rounded-md border border-gray-200">
      <div
        class="sticky top-0 z-10 grid grid-cols-[1fr_repeat(5,minmax(0,4.5rem))] items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
        <UInput
          v-model="attributeFilter"
          type="search"
          size="xs"
          icon="heroicons:magnifying-glass-20-solid"
          :placeholder="t('columns.attribute')"
          class="w-full" />
        <span class="text-center">{{ t('columns.distinct') }}</span>
        <div class="flex flex-col items-center gap-1">
          <span>{{ t('columns.retrieve') }}</span>
          <UCheckbox
            v-tippy="t('hints.toggleColumn')"
            :model-value="retrieveColumnState"
            @update:model-value="setRetrieveColumn($event === true)" />
        </div>
        <div class="flex flex-col items-center gap-1">
          <span>{{ t('columns.crop') }}</span>
          <UCheckbox
            v-tippy="t('hints.toggleColumn')"
            :model-value="cropColumnState"
            @update:model-value="setCropColumn($event === true)" />
        </div>
        <div class="flex flex-col items-center gap-1">
          <span>{{ t('columns.highlight') }}</span>
          <UCheckbox
            v-tippy="t('hints.toggleColumn')"
            :model-value="highlightColumnState"
            @update:model-value="setHighlightColumn($event === true)" />
        </div>
        <div class="flex flex-col items-center gap-1">
          <span>{{ t('columns.searchOn') }}</span>
          <UCheckbox
            v-tippy="t('hints.toggleColumn')"
            :model-value="searchOnColumnState"
            @update:model-value="setSearchOnColumn($event === true)" />
        </div>
      </div>

      <p v-if="0 === visibleAttributes.length" class="px-3 py-4 text-center text-sm text-gray-500">
        {{ t('noAttributeMatch') }}
      </p>

      <div
        v-for="attribute in visibleAttributes"
        :key="attribute"
        class="grid grid-cols-[1fr_repeat(5,minmax(0,4.5rem))] items-center gap-2 border-b border-gray-100 px-3 py-2 last:border-b-0">
        <div class="flex min-w-0 items-center gap-2">
          <span class="truncate text-sm text-gray-900">{{ attribute }}</span>
          <span v-if="attribute === primaryKey" class="shrink-0 text-xs text-gray-400">{{ t('primaryKeyLabel') }}</span>
        </div>

        <div class="flex justify-center">
          <span v-if="!isFilterable(attribute)" v-tippy="t('hints.notFilterable')">
            <UCheckbox :model-value="false" disabled />
          </span>
          <UCheckbox v-else :model-value="distinct === attribute" @update:model-value="toggleDistinct(attribute)" />
        </div>

        <div class="flex justify-center">
          <span v-if="attribute === primaryKey" v-tippy="t('hints.primaryKeyAlwaysRetrieved')">
            <UCheckbox :model-value="true" disabled />
          </span>
          <UCheckbox v-else :model-value="isRetrieved(attribute)" @update:model-value="toggleRetrieve(attribute)" />
        </div>

        <div class="flex justify-center">
          <UCheckbox :model-value="attributesToCrop.includes(attribute)" @update:model-value="toggleCrop(attribute)" />
        </div>

        <div class="flex justify-center">
          <UCheckbox
            :model-value="attributesToHighlight.includes(attribute)"
            @update:model-value="toggleHighlight(attribute)" />
        </div>

        <div class="flex justify-center">
          <span v-if="!isSearchable(attribute)" v-tippy="t('hints.notSearchable')">
            <UCheckbox :model-value="false" disabled />
          </span>
          <UCheckbox
            v-else
            :model-value="attributesToSearchOn.includes(attribute)"
            @update:model-value="toggleSearchOn(attribute)" />
        </div>
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import SettingsSection from './SettingsSection.vue'

type Props = {
  /** Every attribute the index holds, in display order. */
  attributes: Array<string>
  primaryKey: string
  filterableAttributes: Array<string>
  /** `['*']` where the index searches everything, which is Meilisearch's default. */
  searchableAttributes: Array<string>
}
const props = defineProps<Props>()

const distinct = defineModel<string | null>('distinct', { default: null })
const attributesToRetrieve = defineModel<Array<string>>('attributesToRetrieve', { default: () => [] })
const attributesToCrop = defineModel<Array<string>>('attributesToCrop', { default: () => [] })
const attributesToHighlight = defineModel<Array<string>>('attributesToHighlight', { default: () => [] })
const attributesToSearchOn = defineModel<Array<string>>('attributesToSearchOn', { default: () => [] })

const { t } = useI18n()

// Local UI state only — never part of `SearchSettings`, so it can't leak into what the modal
// hands back to the caller.
const attributeFilter = ref('')
const visibleAttributes = computed(() => {
  const query = attributeFilter.value.trim().toLowerCase()
  return 0 === query.length ? props.attributes : props.attributes.filter((a) => a.toLowerCase().includes(query))
})

const isFilterable = (attribute: string) => props.filterableAttributes.includes(attribute)
const isSearchable = (attribute: string) =>
  props.searchableAttributes.includes('*') || props.searchableAttributes.includes(attribute)

const toggleDistinct = (attribute: string) => {
  distinct.value = attribute === distinct.value ? null : attribute
}

const toggleCrop = (attribute: string) => {
  attributesToCrop.value = attributesToCrop.value.includes(attribute)
    ? attributesToCrop.value.filter((a) => a !== attribute)
    : [...attributesToCrop.value, attribute]
}

const toggleHighlight = (attribute: string) => {
  attributesToHighlight.value = attributesToHighlight.value.includes(attribute)
    ? attributesToHighlight.value.filter((a) => a !== attribute)
    : [...attributesToHighlight.value, attribute]
}

const toggleSearchOn = (attribute: string) => {
  attributesToSearchOn.value = attributesToSearchOn.value.includes(attribute)
    ? attributesToSearchOn.value.filter((a) => a !== attribute)
    : [...attributesToSearchOn.value, attribute]
}

// `attributesToRetrieve` empty means "everything", so a row reads as checked either when the
// list is empty or when it explicitly names the attribute.
const isRetrieved = (attribute: string) =>
  0 === attributesToRetrieve.value.length || attributesToRetrieve.value.includes(attribute)

const toggleRetrieve = (attribute: string) => {
  if (0 === attributesToRetrieve.value.length) {
    // Unchecking from the implicit "all" state: materialize the full list minus this attribute,
    // so every other row stays checked instead of silently flipping too.
    attributesToRetrieve.value = props.attributes.filter((a) => a !== attribute)
    return
  }
  if (attributesToRetrieve.value.includes(attribute)) {
    attributesToRetrieve.value = attributesToRetrieve.value.filter((a) => a !== attribute)
    return
  }
  const next = [...attributesToRetrieve.value, attribute]
  // Re-checking the last missing attribute brings the list back to "all" — collapse it to `[]`
  // so the parameter is dropped from the request instead of sent in full.
  attributesToRetrieve.value = next.length === props.attributes.length ? [] : next
}

// State of a column's all/none header checkbox: checked once every togglable attribute in it is
// checked, unchecked once none are, indeterminate in between.
const columnState = (targets: Array<string>, isChecked: (attribute: string) => boolean): boolean | 'indeterminate' => {
  if (0 === targets.length) return false
  const checkedCount = targets.filter(isChecked).length
  if (0 === checkedCount) return false
  return checkedCount === targets.length ? true : 'indeterminate'
}

// Bulk column toggles only touch the currently visible (filtered) rows, so filtering the list and
// then hitting a column checkbox never affects attributes the user can't currently see.
//
// Each one writes its model exactly once. Looping over the per-row `toggle*` helpers would not
// work: when the parent binds with `v-model`, `defineModel` deliberately skips its local update
// and waits for the prop to come back on the parent's next render (see `useModel`'s `hasVModel`
// branch in @vue/runtime-core), so every read inside a synchronous loop still sees the old array
// and each write overwrites the previous one.
const setColumn = (model: Ref<Array<string>>, targets: Array<string>, checked: boolean) => {
  model.value = checked
    ? [...model.value, ...targets.filter((attribute) => !model.value.includes(attribute))]
    : model.value.filter((attribute) => !targets.includes(attribute))
}

// Retrieve is locked on the primary key, so it never enters the bulk toggle.
const retrieveTargets = computed(() => visibleAttributes.value.filter((a) => a !== props.primaryKey))
const cropTargets = computed(() => visibleAttributes.value)
const highlightTargets = computed(() => visibleAttributes.value)
const searchOnTargets = computed(() => visibleAttributes.value.filter(isSearchable))

const retrieveColumnState = computed(() => columnState(retrieveTargets.value, isRetrieved))
const cropColumnState = computed(() => columnState(cropTargets.value, (a) => attributesToCrop.value.includes(a)))
const highlightColumnState = computed(() =>
  columnState(highlightTargets.value, (a) => attributesToHighlight.value.includes(a)),
)
const searchOnColumnState = computed(() =>
  columnState(searchOnTargets.value, (a) => attributesToSearchOn.value.includes(a)),
)

const setRetrieveColumn = (checked: boolean) => {
  const targets = retrieveTargets.value
  // Materialize the implicit "all" first — there is nothing to remove from an empty list.
  const current = 0 === attributesToRetrieve.value.length ? props.attributes : attributesToRetrieve.value
  const next = checked
    ? [...current, ...targets.filter((attribute) => !current.includes(attribute))]
    : current.filter((attribute) => !targets.includes(attribute))
  // The primary key is always retrieved, and an empty list would read as "all" again — so
  // unchecking everything leaves it behind, while checking everything collapses back to `[]` and
  // drops the parameter from the request.
  const withPrimaryKey = next.includes(props.primaryKey) ? next : [props.primaryKey, ...next]
  attributesToRetrieve.value = withPrimaryKey.length === props.attributes.length ? [] : withPrimaryKey
}
const setCropColumn = (checked: boolean) => setColumn(attributesToCrop, cropTargets.value, checked)
const setHighlightColumn = (checked: boolean) => setColumn(attributesToHighlight, highlightTargets.value, checked)
const setSearchOnColumn = (checked: boolean) => setColumn(attributesToSearchOn, searchOnTargets.value, checked)
</script>

<i18n>
en:
  title: Attributes
  columns:
    attribute: Attribute
    distinct: Distinct
    retrieve: Retrieve
    crop: Crop
    highlight: Highlight
    searchOn: Search on
  noAttributeMatch: No attribute matches your search.
  primaryKeyLabel: primary key
  hints:
    notFilterable: Only filterable attributes can be used as the distinct attribute.
    notSearchable: This attribute is not part of the searchable attributes.
    primaryKeyAlwaysRetrieved: The primary key is always retrieved.
    toggleColumn: Check or uncheck this column for all visible attributes.
</i18n>
