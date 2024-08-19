<template>
  <div class="space-y-4 pb-4">
    <header
      class="flex items-center justify-between gap-4 bg-gray-100 px-4 py-4 sm:px-6">
      <h3 class="text-md">{{ humanizeString(facet) }}</h3>
      <SearchInput
        v-model="facetSearchParams.facetQuery"
        :input-attrs="{ placeholder: t('placeholder') }"
        class="grow" />
      <button
        type="button"
        class="text-sm font-semibold text-gray-400"
        @click="shouldIncludeAll = !shouldIncludeAll">
        <template v-if="shouldIncludeAll">ALL</template>
        <template v-else>ANY</template>
      </button>
    </header>
    <div class="space-y-2 px-4 sm:px-6">
      <ul class="flex flex-wrap gap-2 empty:hidden">
        <li
          v-for="[value, included] of appliedFilters
            .getAppliedFacet(facet)
            .entries()">
          <Badge
            as="button"
            type="button"
            v-tippy="{
              content: included
                ? t('hints.included', { value })
                : t('hints.excluded', { value }),
              hideOnClick: false,
            }"
            :theme="included ? 'success' : 'danger'"
            class="inline-flex items-center gap-2 text-sm"
            @click="appliedFilters.applyStringFilter(facet, value)">
            <span>{{ value }}</span>
            <Icon v-if="included" name="lets-icons:check-fill" />
            <Icon v-else name="lets-icons:close-round-fill" />
          </Badge>
        </li>
      </ul>

      <ul v-if="facetHits.length > 0" class="flex flex-wrap gap-2">
        <template v-for="{ value, count } of facetHits">
          <li v-if="!appliedFilters.isValueApplied(facet, value)">
            <Badge
              as="button"
              type="button"
              theme="neutral"
              class="text-sm"
              @click="appliedFilters.applyStringFilter(facet, value)">
              {{ value }}
              <sup>{{ count }}</sup>
            </Badge>
          </li>
        </template>
      </ul>
      <p v-else class="block text-center text-sm italic text-gray-500">
        {{ t('emptyState') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type FacetHit, Meilisearch } from 'meilisearch'
import type { AppliedFilters } from '~/utils'
import SearchInput from '~/components/layout/forms/SearchInput.vue'
import Badge from '~/components/layout/Badge.vue'
import humanizeString from 'humanize-string'

type Props = {
  client: Meilisearch
  indexUid: string
  facet: string
  appliedFilters: AppliedFilters
}

const props = defineProps<Props>()
const { t } = useI18n()
const self = reactive({
  facetHits: [] as FacetHit[],
})
const facetSearchParams = reactive({
  facetName: props.facet,
  facetQuery: '',
})
const hydrateFacetValues = async () => {
  self.facetHits = (
    await props.client
      .index(props.indexUid)
      .searchForFacetValues(facetSearchParams)
  ).facetHits
}
const { facetHits } = toRefs(self)
const shouldIncludeAll = ref(false)
watch(facetSearchParams, () => hydrateFacetValues())
watch(shouldIncludeAll, (value) =>
  props.appliedFilters.includeAll(props.facet, value),
)
await hydrateFacetValues()
</script>

<i18n>
en:
  emptyState: No facet value found.
  placeholder: Search for facet values...
  hints:
    included: "`{value}` is included - click to exclude"
    excluded: "`{value}` is excluded - click to remove"
</i18n>
