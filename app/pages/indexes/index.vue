<template>
  <Layout :title="t('title')">
    <template #actions>
      <Button v-if="indexes.length > 0" :as="NuxtLink" to="/indexes/create" theme="primary" icon="pajamas:doc-new">
        {{ t('actions.create') }}
      </Button>
    </template>
    <template v-if="indexes.length > 0">
      <Table
        :items="indexes"
        :keys="[
          'uid',
          'primaryKey',
          'updatedAt',
          'numberOfDocuments',
          'fieldsCount',
          'numberOfEmbeddings',
          'indexSize',
        ]">
        <template #columns>
          <th scope="col" class="relative isolate">
            {{ t('columns.index') }}
            <div class="absolute inset-y-0 right-full -z-10 w-screen border-b border-b-gray-200" />
            <div class="absolute inset-y-0 left-0 -z-10 w-screen border-b border-b-gray-200" />
          </th>
          <th scope="col">
            {{ t('columns.primaryKey') }}
          </th>
          <th scope="col">{{ t('columns.updatedAt') }}</th>
          <th scope="col">
            <div class="text-right">
              {{ t('columns.numberOfDocuments') }}
            </div>
          </th>
          <th scope="col">
            <div class="text-right">
              {{ t('columns.fieldsCount') }}
            </div>
          </th>
          <th scope="col">
            <div class="text-right">
              {{ t('columns.numberOfEmbeddings') }}
            </div>
          </th>
          <th scope="col">
            <div class="text-right">
              {{ t('columns.indexSize') }}
            </div>
          </th>
          <th />
        </template>
        <template #default="{ item }">
          <td class="font-medium whitespace-nowrap">
            <span class="inline-flex items-center gap-2">
              <NuxtLink
                :to="`/indexes/${item.uid}/documents`"
                class="font-semibold hover:text-primary-700 hover:underline">
                {{ item.uid }}
              </NuxtLink>
              <Badge v-if="item.isIndexing" class="text-xs uppercase">
                {{ t('labels.isIndexing') }}
              </Badge>
            </span>
            <div class="absolute right-full bottom-0 h-px w-screen bg-gray-100" />
            <div class="absolute bottom-0 left-0 h-px w-screen bg-gray-100" />
          </td>
          <td>
            <Badge theme="neutral">{{ item.primaryKey }}</Badge>
          </td>
          <td>{{ formatDate(item.updatedAt) }}</td>
          <td class="text-right">
            {{ item.numberOfDocuments }}
          </td>
          <td class="text-right">
            {{ Object.keys(item.fieldDistribution ?? {}).length }}
          </td>
          <td class="text-right">
            <template v-if="item.numberOfEmbeddings > 0">
              <span v-tippy="embeddingsTooltip(item)">{{ item.numberOfEmbeddings }}</span>
            </template>
            <span v-else class="text-gray-300">—</span>
          </td>
          <td class="text-right" v-tippy="sizeTooltip(item)">
            <template v-if="item.indexSize != null">
              <div class="font-medium">{{ filesize(item.indexSize).human() }}</div>
              <div class="text-xs text-gray-400">
                {{ t('labels.used', { size: filesize(item.usedIndexSize ?? 0).human() }) }}
              </div>
            </template>
            <div v-else class="font-medium">{{ filesize(item.rawDocumentDbSize ?? 0).human() }}</div>
          </td>
          <td class="text-right">
            <UDropdownMenu :items="indexMenuItems(item)" :content="{ align: 'end' }" :ui="{ content: 'w-48' }">
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-hidden">
                <span class="sr-only">{{ t('actions.openMenu') }}</span>
                <Icon name="heroicons-solid:dots-vertical" aria-hidden="true" />
              </button>
            </UDropdownMenu>
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

      <ServerStats class="mt-6" />
    </template>

    <div v-else class="flex flex-col items-center justify-center gap-6 py-20">
      <p class="text-5xl font-light text-gray-700">🫠</p>
      <p class="text-2xl font-light text-gray-700">{{ t('emptyState') }}</p>
      <Button :as="NuxtLink" :to="`/indexes/create`" theme="primary" icon="pajamas:doc-new">
        {{ t('actions.createExpanded') }}
      </Button>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { tryOrThrow } from '~/utils'
import { EXPORT_MIN_VERSION, useDateFormatter, useIndexOperations, useMeiliClient, usePagination } from '~/composables'
import { DismissedDialog, useVersion } from '~/stores'
import { NuxtLink } from '#components'
import ServerStats from '~/components/settings/ServerStats.vue'
import Table from '~/components/layout/tables/Table.vue'
import Badge from '~/components/layout/Badge.vue'
import Button from '~/components/layout/forms/Button.vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import { Index } from 'meilisearch'
import { promiseTimeout, whenever } from '@vueuse/core'
import { navigateTo } from '#imports'
import PageSize from '~/components/layout/pagination/PageSize.vue'
import filesize from 'file-size'

const { t } = useI18n()
useHead({
  title: t('title'),
})

const meili = useMeiliClient()
const { formatDate } = useDateFormatter()
const itemsPerPage = ref(20)
const { offset, totalItems, currentPage, previousPage, nextPage, lastPage } = usePagination(itemsPerPage)
const self = reactive({
  indexes: [] as Index[],
  totalItems,
  currentPage,
  previousPage,
  nextPage,
  lastPage,
  itemsPerPage,
  offset,
})

const fetchIndexes = async (offset = self.offset, limit = self.itemsPerPage) =>
  tryOrThrow(async () => {
    const indexes = await meili.getIndexes({ offset, limit })
    self.totalItems = indexes.total
    return Promise.all(indexes.results.map((index) => meili.getIndex(index.uid)))
  })

whenever(
  toRef(self, 'indexes'),
  async (indexes) => {
    // `indexSize` and `usedIndexSize` are returned by the API but not yet typed by
    // meilisearch@0.60.0's IndexStats — checked against a live 1.53.1 instance.
    await Promise.all(
      indexes.map(async (index) => {
        const indexInfo = await meili.getIndex(index.uid)
        Object.assign(index, await indexInfo.getStats())
      }),
    )
  },
  { immediate: true },
)

const { satisfiesVersion } = useVersion()

const sizeTooltip = (item: Index & { indexSize?: number; rawDocumentDbSize?: number; avgDocumentSize?: number }) =>
  item.indexSize != null
    ? t('labels.sizeTooltip', {
        rawDocumentDbSize: filesize(item.rawDocumentDbSize ?? 0).human(),
        avgDocumentSize: filesize(item.avgDocumentSize ?? 0).human(),
      })
    : t('labels.sizeTooltipFallback', {
        avgDocumentSize: filesize(item.avgDocumentSize ?? 0).human(),
      })

const embeddingsTooltip = (item: Index & { numberOfEmbeddedDocuments?: number }) =>
  t('labels.embeddingsTooltip', { numberOfEmbeddedDocuments: item.numberOfEmbeddedDocuments ?? 0 })

const { duplicateIndex: doDuplicateIndex } = useIndexOperations()
const duplicateIndex = async (indexUid: string) => {
  const newIndexUid = await doDuplicateIndex(indexUid)
  await promiseTimeout(1000)
  await navigateTo(`/indexes/${newIndexUid}/documents`)
}

const { renameIndex: doRenameIndex } = useIndexOperations()
const renameIndex = async (indexUid: string) => {
  const newIndexUid = await doRenameIndex(indexUid)
  await promiseTimeout(1000)
  await navigateTo(`/indexes/${newIndexUid}/documents`)
}

const { swapIndex: doSwapIndex } = useIndexOperations()
const swapIndex = async (indexUid: string) => {
  try {
    await doSwapIndex(indexUid)
    self.indexes = await fetchIndexes()
  } catch (error) {
    if (!(error instanceof DismissedDialog)) throw error
  }
}

const { compactIndex } = useIndexOperations()

const indexMenuItems = (item: Index): DropdownMenuItem[] => [
  {
    label: t('actions.settings'),
    icon: 'heroicons-outline:cog',
    to: `/indexes/${item.uid}/settings`,
  },
  {
    label: t('actions.rename'),
    icon: 'heroicons:pencil',
    onSelect: () => renameIndex(item.uid),
  },
  {
    label: t('actions.duplicate'),
    icon: 'heroicons:document-duplicate',
    onSelect: () => duplicateIndex(item.uid),
  },
  {
    label: t('actions.swap'),
    icon: 'heroicons:arrows-right-left',
    onSelect: () => swapIndex(item.uid),
  },
  ...(satisfiesVersion('>=1.23.0')
    ? [
        {
          label: t('actions.compact'),
          icon: 'heroicons:sparkles',
          onSelect: () => compactIndex(item.uid),
        },
      ]
    : []),
  ...(satisfiesVersion(EXPORT_MIN_VERSION)
    ? [
        {
          label: t('actions.export'),
          icon: 'heroicons:arrow-up-tray',
          to: `/indexes/${item.uid}/settings/export`,
        },
      ]
    : []),
]

const { indexes } = toRefs(self)
watch(offset, async (offset) => {
  self.indexes = []
  self.indexes = await fetchIndexes(offset)
})
watch(itemsPerPage, async (itemsPerPage) => {
  self.indexes = []
  self.indexes = await fetchIndexes(0, itemsPerPage)
})
const handlePageChange = (page: number) => (self.offset = (page - 1) * self.itemsPerPage)
self.indexes = await fetchIndexes()
</script>

<i18n>
en:
  title: Indexes
  emptyState: Your Meilisearch instance has no index yet.
  columns:
    index: Index
    numberOfDocuments: Nb. docs
    primaryKey: Primary Key
    updatedAt: Updated At
    fieldsCount: Fields
    numberOfEmbeddings: Embeddings
    indexSize: Size
  labels:
    isIndexing: Indexing
    embeddingsTooltip: 'Across {numberOfEmbeddedDocuments} embedded documents'
    used: '{size} used'
    sizeTooltip: 'Raw document DB size: {rawDocumentDbSize} · Avg. document size: {avgDocumentSize}'
    sizeTooltipFallback: 'Avg. document size: {avgDocumentSize}'
  actions:
    create: Create
    createExpanded: Create an index
    settings: Settings
    duplicate: Duplicate
    rename: Rename
    swap: Swap with…
    compact: Compact
    export: Export
    openMenu: Open menu
</i18n>
