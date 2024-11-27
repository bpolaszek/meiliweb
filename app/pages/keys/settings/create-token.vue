<template>
  <form class="space-y-4" @submit.prevent>
    <h3
      class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('title') }}
      <DocumentationLink
        href="https://www.meilisearch.com/docs/learn/security/tenant_tokens" />
    </h3>

    <DefineAddRuleMenu v-slot="{ big }">
      <ContextualMenu v-if="availableIndexes.length > 0">
        <template #button>
          <MenuButton>
            <Button
              theme="primary"
              icon="zondicons:add-solid"
              :no-padding="!big"
              :class="big || 'px-2 py-1 text-xs'">
              {{ t('labels.addRule') }}
            </Button>
          </MenuButton>
        </template>
        <div
          class="block w-full cursor-default px-2 py-1.5 text-left text-xs font-light italic text-gray-500">
          {{ t('labels.pickAnIndex') }}
        </div>
        <MenuItem
          v-for="indexUid of availableIndexes"
          :key="indexUid"
          v-slot="{ active }">
          <button
            type="button"
            class="block w-full px-2 py-1.5 text-left text-sm font-light"
            :class="[active ? 'bg-primary-100' : 'bg-transparent']"
            @click="addSearchRule(indexUid)">
            {{ humanizeString(indexUid) }}
          </button>
        </MenuItem>
      </ContextualMenu>
    </DefineAddRuleMenu>

    <div
      v-if="0 === Object.entries(searchRules).length"
      class="flex items-center justify-center py-10">
      <AddRuleMenu :big="true" />
    </div>

    <template v-else>
      <UniqueId as="section" v-slot="{ id }" class="space-y-1">
        <header class="flex items-center justify-between">
          <Label :for="id">{{ t('labels.searchRules') }}</Label>
          <AddRuleMenu />
        </header>
      </UniqueId>

      <UniqueId
        as="section"
        v-for="[indexUid, rules] of searchRulesMap.entries()"
        :key="indexUid"
        v-slot="{ id }"
        class="space-y-1">
        <header class="flex items-center justify-between">
          <Label
            :for="id"
            class="text-sm font-light capitalize text-primary-800">
            {{ indexUid }}
          </Label>
          <button
            v-tippy="t('labels.removeRule')"
            type="button"
            @click="searchRulesMap.delete(indexUid)">
            <Icon name="wpf:full-trash" />
          </button>
        </header>
        <input
          v-focus
          v-model="rules.filter"
          :placeholder="
            placeholders.has(indexUid)
              ? t('placeholders.example', {
                  example: placeholders.get(indexUid),
                })
              : undefined
          "
          type="text"
          class="form-input w-full" />
        <div v-if="filterStats.has(indexUid)" class="text-xs">
          <span class="italic text-green-600">
            {{
              t('hints.matchingDocuments', {
                nbFilteredDocuments: (
                  filterStats.get(indexUid) as FilterStat
                )[0],
                nbTotalDocuments: (filterStats.get(indexUid) as FilterStat)[1],
              })
            }}
          </span>
          <span v-if="jwt">&nbsp;-&nbsp;</span>
          <RouterLink
            v-if="jwt"
            :to="`/indexes/${indexUid}/documents?tenantToken=${jwt}`"
            class="italic text-primary-700 hover:text-primary-800"
            target="_blank">
            {{ t('labels.preview') }}
          </RouterLink>
        </div>
        <span v-else class="text-xs italic text-red-600">
          {{ t('hints.invalidFilterQuery') }}
        </span>
      </UniqueId>

      <UniqueId
        v-if="[...searchRulesMap.entries()].length > 0"
        as="section"
        v-slot="{ id }"
        class="space-y-1 *:block *:w-full">
        <Label required :for="id">{{ t('labels.key') }}</Label>
        <Select required v-model="keyToUse">
          <option />
          <option v-for="key of keys.results" :value="key">
            {{ key.name ?? key.uid }}
          </option>
        </Select>
      </UniqueId>

      <UniqueId v-if="jwt" as="section" v-slot="{ id }" class="space-y-1">
        <header class="flex items-center justify-between">
          <Label :for="id">{{ t('labels.expiresAt') }}</Label>
          <div>
            <label class="inline-flex cursor-pointer items-center gap-2">
              <span class="text-sm font-light italic text-gray-600">
                {{ t('labels.neverExpires') }}
              </span>
              <input
                :disabled="expires"
                type="checkbox"
                v-model="expires"
                class="form-checkbox" />
            </label>
          </div>
        </header>
        <div>
          <input
            type="datetime-local"
            v-model="expiresAt"
            class="form-input w-full" />
        </div>
      </UniqueId>

      <section v-if="jwt" class="rounded-md bg-green-100 p-4 shadow-md">
        <header class="flex items-center justify-between pb-2">
          <h4 class="font-medium">{{ t('labels.jwt') }}</h4>
          <ClipboardButton :source="jwt" class="size-6 shrink-0" />
        </header>
        <p class="break-words font-mono text-sm">
          {{ jwt }}
        </p>
      </section>
    </template>
  </form>
</template>

<script setup lang="ts">
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Label from '~/components/layout/forms/Label.vue'
import Select from '~/components/layout/forms/Select.vue'
import Button from '~/components/layout/forms/Button.vue'
import UniqueId from '~/components/UniqueId.vue'
import ClipboardButton from '~/components/layout/forms/ClipboardButton.vue'
import ContextualMenu from '~/components/layout/ContextualMenu.vue'
import { useMeiliClient } from '~/composables'
import { MenuButton, MenuItem } from '@headlessui/vue'
import type { Key, TokenSearchRules } from 'meilisearch'
import type { ComputedRef } from 'vue'
import { createJwt } from '~/utils/create-jwt'
import { field } from 'meilisearch-filters'
import { createReusableTemplate, watchArray } from '@vueuse/core'
import humanizeString from 'humanize-string'

type Self = {
  keyToUse: Key | null
  searchRules: TokenSearchRules
  expiresAt: Date | null
  jwt: string | null
}
type NbTotalDocuments = number
type NbFilteredDocuments = number
type FilterRule = { filter: string }
type FilterStat = [NbFilteredDocuments, NbTotalDocuments]

const [DefineAddRuleMenu, AddRuleMenu] = createReusableTemplate()
const { t } = useI18n()
const meili = useMeiliClient()
const searchRulesMap = reactive(new Map<string, FilterRule>())
const placeholders = reactive(new Map<string, string | null>())
const filterStats = reactive(new Map<string, FilterStat>())
const self: Self = reactive({
  expiresAt: null as Date | null,
  keyToUse: ref(null),
  searchRules: computed(() =>
    Object.fromEntries([...searchRulesMap.entries()]),
  ),
  jwt: computed(() =>
    self.keyToUse
      ? createJwt(self.searchRules, self.keyToUse, self.expiresAt ?? undefined)
      : null,
  ),
})
const expires = computed({
  get: () => !self.expiresAt,
  set(value: string | boolean) {
    if ('boolean' === typeof value) {
      self.expiresAt = value
        ? null
        : (new Date(
            new Date().setMonth(new Date().getMonth() + 1),
          ).toISOString() as unknown as Date)
    } else {
      self.expiresAt = value as unknown as Date
    }
  },
}) as ComputedRef<boolean>
const { keyToUse, searchRules, expiresAt, jwt } = toRefs(self)
const [indexes, keys] = await Promise.all([
  meili
    .getIndexes({ limit: 1000 })
    .then(({ results }) => results.map(({ uid }) => uid)),
  meili.getKeys(),
])
const availableIndexes = computed(() =>
  indexes.filter((indexUid) => ![...searchRulesMap.keys()].includes(indexUid)),
)

const addSearchRule = async (indexUid: string) => {
  searchRulesMap.set(indexUid, { filter: '' })
  await Promise.all([
    suggestPlaceholder(indexUid),
    updateFilterStats(indexUid, ''),
  ])
}
const suggestPlaceholder = async (indexUid: string) => {
  if (placeholders.has(indexUid)) {
    return
  }
  const filterableAttributes = await meili
    .index(indexUid)
    .getFilterableAttributes()
  const searchResults = await meili
    .index(indexUid)
    .search(null, { facets: filterableAttributes, limit: 0 })
  let stringFilterCandidate: [string | null, string | number | null, number] = [
    null,
    null,
    0,
  ]
  for (const [facetName, facetValue] of Object.entries(
    searchResults.facetDistribution ?? {},
  )) {
    for (const [value, count] of Object.entries(facetValue)) {
      if (stringFilterCandidate && count > stringFilterCandidate[2]) {
        stringFilterCandidate = [facetName, value, count]
      }
    }
  }
  if (null !== stringFilterCandidate[0]) {
    placeholders.set(
      indexUid,
      `${field(stringFilterCandidate[0]).equals(stringFilterCandidate[1] as string | number)}`,
    )
    return
  }
  for (const [facetName, stats] of Object.entries(
    searchResults.facetStats ?? {},
  )) {
    const edges = [
      Math.floor(Math.random() * (stats.max - stats.min + 1) + stats.min),
      Math.floor(Math.random() * (stats.max - stats.min + 1) + stats.min),
    ]
    placeholders.set(
      indexUid,
      `${field(facetName).isBetween(...(edges.sort() as [number, number]))}`,
    )
    return
  }
}

const updateFilterStats = async (indexUid: string, filter: string) => {
  try {
    const [{ total: nbTotalDocuments }, { total: nbFilteredDocuments }] =
      await Promise.all([
        meili.index(indexUid).getDocuments({ limit: 0 }),
        meili.index(indexUid).getDocuments({ filter, limit: 0 }),
      ])

    filterStats.set(indexUid, [nbFilteredDocuments, nbTotalDocuments])
  } catch (e) {
    filterStats.delete(indexUid)
  }
}

const filterRuleWatchers = new Map()
watchArray(
  () => Object.keys(self.searchRules),
  (_, __, additions, removals) => {
    if (additions.length > 0) {
      additions.forEach((indexUid) => {
        filterRuleWatchers.set(
          indexUid,
          watch(
            () => (searchRulesMap.get(indexUid) as FilterRule).filter,
            (filter) => {
              updateFilterStats(indexUid, filter)
            },
          ),
        )
      })
    }
    if (removals.length > 0) {
      removals.forEach((indexUid) => {
        const stop = filterRuleWatchers.get(indexUid)
        stop()
        filterRuleWatchers.delete(indexUid)
      })
    }
  },
)
</script>

<i18n>
en:
  title: Create tenant token
  labels:
    key: Signing key
    searchRules: Search Rules
    addRule: Add rule
    removeRule: Remove rule
    jwt: "Here is your tenant token:"
    expiresAt: Expires
    neverExpires: Never
    pickAnIndex: Pick an index below...
    preview: Preview
  placeholders:
    example: "Example: {example}"
  hints:
    matchingDocuments: "Matching documents: {nbFilteredDocuments}/{nbTotalDocuments}"
    invalidFilterQuery: Filter query looks invalid
</i18n>
