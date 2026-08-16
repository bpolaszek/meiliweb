<template>
  <Layout :title="t('title')" :subtitle="t('subtitle')">
    <template #title-actions>
      <DocumentationLink href="https://www.meilisearch.com/docs/capabilities/search_rules/getting_started" />
    </template>

    <template #actions>
      <div v-if="available" class="flex items-center gap-2">
        <Button theme="primary" icon="pajamas:doc-new" @click="openEditor(null)">
          {{ t('actions.create') }}
        </Button>
        <!-- Only disabled when the instance is provably empty: an empty *filtered* list says nothing. -->
        <Button icon="heroicons:trash" :disabled="!filtered && !rules.length" @click="confirmDeleteAll()">
          {{ t('actions.deleteAll') }}
        </Button>
      </div>
    </template>

    <Alert v-if="!versionSupported" theme="warning" :title="t('unsupported.title')">
      {{ t('unsupported.text', { minVersion: SEARCH_RULES_MIN_VERSION, version: pkgVersion }) }}
    </Alert>

    <Alert v-else-if="!featureEnabled" theme="warning" :title="t('disabled.title')">
      {{ t('disabled.text') }}
      <NuxtLink to="/experimental-features" class="font-medium underline">
        {{ t('disabled.link') }}
      </NuxtLink>
    </Alert>

    <template v-else>
      <section class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <UInput
          v-model="query"
          type="search"
          icon="heroicons:magnifying-glass-20-solid"
          :placeholder="t('placeholders.search')"
          autocapitalize="off"
          autocomplete="off"
          spellcheck="false"
          class="flex-1" />
        <USelect v-model="activeFilter" :items="activeFilterItems" class="sm:w-56" />
      </section>

      <template v-if="rules.length">
        <Table
          :items="rules"
          :columns="[
            t('columns.rule'),
            t('columns.conditions'),
            t('columns.pins'),
            t('columns.precedence'),
            t('columns.active'),
            t('columns.actions'),
          ]">
          <template #default="{ item }">
            <td>
              <div class="flex flex-col">
                <span class="font-mono font-medium">{{ item.uid }}</span>
                <span v-if="item.description" class="text-sm font-light text-gray-500">{{ item.description }}</span>
                <span v-if="item.lastUpdatedAt" class="text-xs font-light text-gray-400">
                  {{ t('updatedAt', { date: formatDate(new Date(item.lastUpdatedAt)) }) }}
                </span>
              </div>
            </td>
            <td>
              <div class="flex flex-wrap gap-1">
                <Badge v-for="(part, i) of conditionsSummary(item)" :key="i" theme="neutral">{{ part }}</Badge>
              </div>
            </td>
            <td>
              <span v-if="item.actions.length" v-tippy="pinsDetail(item)" class="text-sm whitespace-nowrap">
                {{ t('pinCount', item.actions.length) }}
              </span>
              <span v-else class="text-sm font-light text-gray-500 italic">{{ t('placeholders.noPins') }}</span>
            </td>
            <td class="text-sm">
              <span v-if="null !== item.precedence && undefined !== item.precedence">{{ item.precedence }}</span>
              <span v-else class="font-light text-gray-500 italic">{{ t('placeholders.noPrecedence') }}</span>
            </td>
            <td>
              <USwitch
                :model-value="!!item.active"
                :disabled="pending.has(item.uid)"
                @update:model-value="toggleActive(item, $event)" />
            </td>
            <td>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  v-tippy="t('actions.edit')"
                  class="text-gray-500 hover:text-primary-600"
                  @click="openEditor(item)">
                  <Icon name="heroicons:pencil-square" />
                </button>
                <button
                  type="button"
                  v-tippy="t('actions.delete')"
                  class="text-gray-500 hover:text-red-600"
                  @click="confirmDelete(item)">
                  <Icon name="heroicons:trash" />
                </button>
              </div>
            </td>
          </template>
        </Table>

        <div class="mt-4 flex items-center justify-between">
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

      <div v-else class="flex flex-col items-center justify-center gap-6 py-20">
        <p class="text-5xl font-light text-gray-700">📌</p>
        <p class="text-2xl font-light text-gray-700">{{ filtered ? t('noMatch') : t('emptyState') }}</p>
        <Button v-if="!filtered" theme="primary" icon="pajamas:doc-new" @click="openEditor(null)">
          {{ t('actions.create') }}
        </Button>
      </div>

      <SearchRuleEditor v-model:open="editorOpen" :rule="editing" :index-uids="indexUids" @saved="refresh()" />
    </template>
  </Layout>
</template>

<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import { NuxtLink } from '#components'
import Alert from '~/components/layout/Alert.vue'
import Badge from '~/components/layout/Badge.vue'
import Button from '~/components/layout/forms/Button.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import PageSize from '~/components/layout/pagination/PageSize.vue'
import Table from '~/components/layout/tables/Table.vue'
import SearchRuleEditor from '~/components/search-rules/SearchRuleEditor.vue'
import {
  SEARCH_RULES_FEATURE,
  SEARCH_RULES_MIN_VERSION,
  supportsSearchRules,
  useDateFormatter,
  useMeiliClient,
  usePagination,
  useSearchRules,
  useTask,
  type SearchRule,
} from '~/composables'
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS, useConfirmationDialog, useToasts } from '~/stores'
import { tryOrThrow } from '~/utils'

const { t } = useI18n()
const meili = useMeiliClient()
const { list, save, remove, removeAll } = useSearchRules()
const { confirm } = useConfirmationDialog()
const { createToast } = useToasts()
const { formatDate } = useDateFormatter()
const processTask = useTask()

// Register lifecycle-bound composables before the first `await` so they keep their component context.
useHead({ title: t('title') })
const itemsPerPage = ref(20)
const { offset, totalItems, currentPage, lastPage, getPageOffset } = usePagination(itemsPerPage)

// Dynamic search rules need both a recent enough instance and the experimental flag: the routes
// exist since 1.41 but changed in a breaking way until 1.50, so we only support the stable shape.
const { pkgVersion } = await meili.getVersion()
const versionSupported = supportsSearchRules(pkgVersion)

let featureEnabled = false
if (versionSupported) {
  try {
    // Direct call (not tryOrThrow): degrade to the explanatory alert rather than the global
    // error page, since an older instance may not expose this endpoint at all.
    const features = (await meili.getExperimentalFeatures()) as Record<string, boolean>
    featureEnabled = true === features[SEARCH_RULES_FEATURE]
  } catch {
    // Treat an unreachable endpoint as "not enabled" — the alert points to the right place anyway.
  }
}
const available = versionSupported && featureEnabled

const activeFilterItems = computed(() => [
  { label: t('filters.all'), value: 'all' },
  { label: t('filters.active'), value: 'active' },
  { label: t('filters.inactive'), value: 'inactive' },
])

const self = reactive({
  rules: [] as SearchRule[],
  indexUids: [] as string[],
  query: '',
  activeFilter: 'all' as 'all' | 'active' | 'inactive',
  itemsPerPage,
  offset,
  totalItems,
  currentPage,
  lastPage,
  filtered: computed(() => !!self.query.trim() || 'all' !== self.activeFilter),
})

const refresh = async () => {
  const { results, total } = await list({
    offset: self.offset,
    limit: self.itemsPerPage,
    filter: {
      query: self.query.trim() || null,
      active: 'all' === self.activeFilter ? null : 'active' === self.activeFilter,
    },
  })
  self.rules = results
  self.totalItems = total
}

if (available) {
  await tryOrThrow(() => refresh())
  self.indexUids = (await meili.getRawIndexes({ limit: 1000 })).results.map(({ uid }) => uid)
}

const resetToFirstPage = async () => {
  if (0 === self.offset) {
    // The offset watcher won't fire, so refresh explicitly.
    await refresh()
    return
  }
  self.offset = 0
}

const handlePageChange = (page: number) => {
  self.offset = getPageOffset(page)
}

// Typing in the search box shouldn't fire a request per keystroke; the other inputs are discrete.
watchDebounced(toRef(self, 'query'), () => resetToFirstPage(), { debounce: 300 })
watch([toRef(self, 'activeFilter'), itemsPerPage], () => resetToFirstPage())
watch(toRef(self, 'offset'), () => refresh())

const editorOpen = ref(false)
const editing = ref<SearchRule | null>(null)
const openEditor = (rule: SearchRule | null) => {
  editing.value = rule
  editorOpen.value = true
}

/** Human-readable recap of a rule's conditions, rendered as badges. */
const conditionsSummary = (rule: SearchRule) => {
  const parts: string[] = []
  const { query, time, filter } = rule.conditions ?? {}

  if (true === query?.isEmpty) {
    parts.push(t('conditions.emptyQuery'))
  } else if (false === query?.isEmpty) {
    parts.push(t('conditions.nonEmptyQuery'))
  }
  if (query?.words) {
    parts.push(t('conditions.words', { words: query.words }))
  }
  if (time?.start && time?.end) {
    parts.push(
      t('conditions.between', { start: formatDate(new Date(time.start)), end: formatDate(new Date(time.end)) }),
    )
  } else if (time?.start) {
    parts.push(t('conditions.from', { start: formatDate(new Date(time.start)) }))
  } else if (time?.end) {
    parts.push(t('conditions.until', { end: formatDate(new Date(time.end)) }))
  }
  if (filter) {
    parts.push(t('conditions.filter'))
  }

  return parts.length ? parts : [t('conditions.always')]
}

/** Tooltip listing every pin as `index#documentId → position`. */
const pinsDetail = (rule: SearchRule) =>
  rule.actions
    .map(({ selector, action }) => `${selector.indexUid ?? '*'}#${selector.id} → ${action.position}`)
    .join('\n')

const pending = reactive(new Set<string>())

const toggleActive = async (rule: SearchRule, active: boolean) => {
  pending.add(rule.uid)
  const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.toggling', { uid: rule.uid }) })
  try {
    // PATCH merges top-level keys, so sending `active` alone leaves conditions and actions intact.
    await processTask(() => save(rule.uid, { active }))
    toast.update({ ...TOAST_SUCCESS(t) })
    await refresh()
  } catch {
    toast.update({ ...TOAST_FAILURE(t) })
  } finally {
    pending.delete(rule.uid)
  }
}

const confirmDelete = async (rule: SearchRule) => {
  if (!(await confirm({ text: t('confirmations.delete', { uid: rule.uid }) }))) {
    return
  }
  const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.deleting') })
  try {
    await processTask(() => remove(rule.uid))
    toast.update({ ...TOAST_SUCCESS(t) })
    await refresh()
  } catch {
    toast.update({ ...TOAST_FAILURE(t) })
  }
}

const confirmDeleteAll = async () => {
  if (!(await confirm({ text: t('confirmations.deleteAll') }))) {
    return
  }
  const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.deletingAll') })
  try {
    await processTask(() => removeAll())
    toast.update({ ...TOAST_SUCCESS(t) })
    await resetToFirstPage()
  } catch {
    toast.update({ ...TOAST_FAILURE(t) })
  }
}

const { rules, indexUids, query, activeFilter, filtered } = toRefs(self)
</script>

<i18n>
en:
  title: Search rules
  subtitle: Pin documents at fixed positions when a search matches your conditions.
  unsupported:
    title: Meilisearch {minVersion} or later required
    text: Dynamic search rules changed in a breaking way until Meilisearch {minVersion}.
          This instance runs {version}.
  disabled:
    title: Dynamic search rules are disabled
    text: This feature is experimental and must be enabled on your instance first.
    link: Go to experimental features
  columns:
    rule: Rule
    conditions: Conditions
    pins: Pinned documents
    precedence: Precedence
    active: Active
    actions: Actions
  filters:
    all: All rules
    active: Active only
    inactive: Paused only
  placeholders:
    search: Search rules by ID or description...
    noPins: None
    noPrecedence: None
  conditions:
    always: Always
    emptyQuery: Empty queries
    nonEmptyQuery: Non-empty queries
    words: 'Query contains "{words}"'
    between: 'From {start} to {end}'
    from: 'From {start}'
    until: 'Until {end}'
    filter: Filter conditions
  updatedAt: 'Updated {date}'
  pinCount: '{count} document | {count} documents'
  emptyState: No search rule yet.
  noMatch: No rule matches these filters.
  actions:
    create: Create
    deleteAll: Delete all
    edit: Edit
    delete: Delete
  confirmations:
    delete: 'Do you really want to delete the rule "{uid}"?'
    deleteAll: Do you really want to delete every search rule of this instance?
  toasts:
    toggling: 'Updating {uid}...'
    deleting: Deleting search rule...
    deletingAll: Deleting all search rules...
</i18n>
