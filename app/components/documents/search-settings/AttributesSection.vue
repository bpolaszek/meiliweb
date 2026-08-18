<template>
  <SettingsSection :title="t('title')" href="https://www.meilisearch.com/docs/reference/api/search">
    <div class="max-h-72 overflow-y-auto rounded-md border border-gray-200">
      <div
        class="sticky top-0 grid grid-cols-[1fr_repeat(5,minmax(0,4.5rem))] items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
        <span>{{ t('columns.attribute') }}</span>
        <span class="text-center">{{ t('columns.distinct') }}</span>
        <span class="text-center">{{ t('columns.retrieve') }}</span>
        <span class="text-center">{{ t('columns.crop') }}</span>
        <span class="text-center">{{ t('columns.highlight') }}</span>
        <span class="text-center">{{ t('columns.searchOn') }}</span>
      </div>

      <div
        v-for="attribute in attributes"
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
  primaryKeyLabel: primary key
  hints:
    notFilterable: Only filterable attributes can be used as the distinct attribute.
    notSearchable: This attribute is not part of the searchable attributes.
    primaryKeyAlwaysRetrieved: The primary key is always retrieved.
</i18n>
