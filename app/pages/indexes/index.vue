<template>
  <Layout :title="t('title')">
    <template #actions>
      <Button
        v-if="indexes.length > 0"
        :as="NuxtLink"
        to="/indexes/create"
        theme="primary"
        icon="pajamas:doc-new">
        {{ t('actions.create') }}
      </Button>
    </template>
    <template v-if="indexes.length > 0">
      <Table
        :items="indexes"
        :keys="[
          'uid',
          'numberOfDocuments',
          'primaryKey',
          'createdAt',
          'updatedAt',
        ]">
        <template #columns>
          <th scope="col" class="relative isolate">
            {{ t('columns.index') }}
            <div
              class="absolute inset-y-0 right-full -z-10 w-screen border-b border-b-gray-200" />
            <div
              class="absolute inset-y-0 left-0 -z-10 w-screen border-b border-b-gray-200" />
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
          <td class="whitespace-nowrap font-medium">
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
            <div
              class="absolute bottom-0 right-full h-px w-screen bg-gray-100" />
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
            <ContextualMenu>
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  :to="`/indexes/${item.uid}/settings`"
                  class="flex w-full items-center justify-start gap-2 p-2"
                  :class="{ 'bg-gray-50': active }">
                  <Icon
                    name="heroicons-outline:cog"
                    class="size-5 opacity-70" />
                  <span>{{ t('actions.settings') }}</span>
                </NuxtLink>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <button
                  type="button"
                  class="flex w-full items-center justify-start gap-2 p-2"
                  :class="{ 'bg-gray-50': active }"
                  @click="duplicateIndex(item.uid)">
                  <Icon
                    name="heroicons:document-duplicate"
                    class="size-5 opacity-70" />
                  <span>{{ t('actions.duplicate') }}</span>
                </button>
              </MenuItem>
            </ContextualMenu>
          </td>
        </template>
      </Table>

      <ServerStats class="mt-6" />
    </template>

    <div v-else class="flex flex-col items-center justify-center gap-6 py-20">
      <p class="text-5xl font-light text-gray-700">🫠</p>
      <p class="text-2xl font-light text-gray-700">{{ t('emptyState') }}</p>
      <Button
        :as="NuxtLink"
        :to="`/indexes/create`"
        theme="primary"
        icon="pajamas:doc-new">
        {{ t('actions.createExpanded') }}
      </Button>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { tryOrThrow } from '~/utils'
import {
  useDateFormatter,
  useIndexOperations,
  useMeiliClient,
} from '~/composables'
import { NuxtLink } from '#components'
import ServerStats from '~/components/settings/ServerStats.vue'
import Table from '~/components/layout/tables/Table.vue'
import Badge from '~/components/layout/Badge.vue'
import Button from '~/components/layout/forms/Button.vue'
import ContextualMenu from '~/components/layout/ContextualMenu.vue'
import { MenuItem } from '@headlessui/vue'
import { usePromisifiedDialogs } from '~/stores'
import { Index } from 'meilisearch'
import { promiseTimeout, whenever } from '@vueuse/core'
import { navigateTo } from '#imports'

const { t } = useI18n()
useHead({
  title: t('title'),
})

const meili = useMeiliClient()
const { formatDate } = useDateFormatter()
const { openDialog } = usePromisifiedDialogs()
const self = reactive({
  indexes: [] as Index[],
})

const fetchIndexes = async () =>
  tryOrThrow(async () =>
    Promise.all(
      (await meili.getIndexes()).results.map((index) =>
        meili.getIndex(index.uid),
      ),
    ),
  )

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
const { indexes } = toRefs(self)
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
</i18n>
