<template>
  <Layout :title="t('title')">
    <template #actions>
      <Button v-if="indexes.length > 0" :as="NuxtLink" to="/indexes/create" theme="primary" icon="pajamas:doc-new">
        {{ t('actions.create') }}
      </Button>
    </template>
    <template v-if="indexes.length > 0">
      <Table :items="indexes" :keys="['uid', 'numberOfDocuments', 'primaryKey', 'createdAt', 'updatedAt']">
        <template #columns>
          <th scope="col" class="relative isolate">
            {{ t('columns.index') }}
            <div class="absolute inset-y-0 right-full -z-10 w-screen border-b border-b-gray-200" />
            <div class="absolute inset-y-0 left-0 -z-10 w-screen border-b border-b-gray-200" />
          </th>
          <th scope="col">
            {{ t('columns.primaryKey') }}
          </th>
          <th scope="col">{{ t('columns.createdAt') }}</th>
          <th scope="col">{{ t('columns.updatedAt') }}</th>
          <th scope="col">
            <div class="text-right">
              {{ t('columns.numberOfDocuments') }}
            </div>
          </th>
          <th />
        </template>
        <template #default="{ item }">
          <td class="font-medium whitespace-nowrap">
            <span class="inline-flex items-center gap-2">
              <NuxtLink
                :to="`/indexes/${item.uid}/documents`"
                class="hover:text-primary-700 font-semibold hover:underline">
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
          <td>{{ formatDate(item.createdAt) }}</td>
          <td>{{ formatDate(item.updatedAt) }}</td>
          <td class="text-right">
            {{ item.numberOfDocuments }}
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
import { useDateFormatter, useIndexOperations, useMeiliClient, usePagination } from '~/composables'
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
    for (const index of indexes) {
      let indexInfo = await meili.getIndex(index.uid)
      Object.assign(index, await indexInfo.getStats())
    }
  },
  { immediate: true },
)

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
    createdAt: Created At
    updatedAt: Updated At
  labels:
    isIndexing: Indexing
  actions:
    create: Create
    createExpanded: Create an index
    settings: Settings
    duplicate: Duplicate
    rename: Rename
    openMenu: Open menu
</i18n>
