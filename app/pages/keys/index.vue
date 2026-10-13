<template>
  <Layout :title="t('title')">
    <template #title-actions>
      <NuxtLink to="/keys/settings" v-tippy="t('actions.settings')">
        <Icon name="heroicons-outline:cog" />
      </NuxtLink>
    </template>
    <template #actions>
      <Button :as="NuxtLink" to="/keys/settings/create" theme="primary" icon="pajamas:doc-new">
        {{ t('actions.create') }}
      </Button>
    </template>
    <Table
      :items="keys.results"
      :columns="[
        t('columns.name'),
        t('columns.uid'),
        t('columns.actions'),
        t('columns.indexes'),
        t('columns.date'),
        t('columns.expiresAt'),
        '',
      ]">
      <template #default="{ index: i }">
        <td>
          <div class="flex flex-col">
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              {{ keys.results[i].name }}
              <ClipboardButton
                :source="keys.results[i].key"
                :copy-text="t('hints.copySecretKey')"
                class="size-4 shrink-0 grow-0" />
            </span>
            <span v-tippy="keys.results[i].description" class="line-clamp-1 text-sm font-light text-gray-600">
              {{ keys.results[i].description }}
            </span>
          </div>
        </td>
        <td>
          <div class="flex flex-col">
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              {{ keys.results[i].uid }}
              <ClipboardButton :source="keys.results[i].uid" class="size-4 shrink-0 grow-0" />
            </span>
          </div>
        </td>
        <td>
          <ul>
            <li v-for="action of keys.results[i].actions">{{ action }}</li>
          </ul>
        </td>
        <td>
          <ul>
            <li v-for="index of keys.results[i].indexes">{{ index }}</li>
          </ul>
        </td>
        <td class="whitespace-nowrap">
          {{ formatDate(keys.results[i].createdAt) }}
        </td>
        <td class="whitespace-nowrap">
          <span v-if="formatDate(keys.results[i].expiresAt)">
            {{ formatDate(keys.results[i].expiresAt) }}
          </span>
          <span v-else class="font-light text-gray-500 italic">
            {{ t('placeholders.never') }}
          </span>
        </td>
        <td class="text-right">
          <UDropdownMenu :items="keyMenuItems(keys.results[i])" :content="{ align: 'end' }" :ui="{ content: 'w-48' }">
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
  </Layout>
</template>

<script setup lang="ts">
import { safeToRefs, tryOrThrow } from '~/utils'
import {
  DismissedDialog,
  TOAST_FAILURE,
  TOAST_PLEASEWAIT,
  TOAST_SUCCESS,
  useConfirmationDialog,
  useCredentials,
  usePromisifiedDialogs,
  useToasts,
} from '~/stores'
import KeyEditPromptModal from '~/components/keys/KeyEditPromptModal.vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Key, KeysResults } from 'meilisearch'
import PageSize from '~/components/layout/pagination/PageSize.vue'
import { NuxtLink } from '#components'
import Table from '~/components/layout/tables/Table.vue'
import ClipboardButton from '~/components/layout/forms/ClipboardButton.vue'
import Button from '~/components/layout/forms/Button.vue'

const client = useMeiliClient()
const { credentials } = safeToRefs(useCredentials())
const { confirm } = useConfirmationDialog()
const { openDialog } = usePromisifiedDialogs()
const { createToast } = useToasts()

const { formatDate } = useDateFormatter()
const { t } = useI18n()
useHead({
  title: t('title'),
})

// Register lifecycle-bound composables before the first `await` so they keep their component context.
const itemsPerPage = ref(20)
const { offset, totalItems, currentPage, lastPage, getPageOffset } = usePagination(itemsPerPage)

const keys = ref<KeysResults>({ results: [], offset: 0, limit: itemsPerPage.value, total: 0 })
const refresh = async () => {
  keys.value = await client.getKeys({ offset: offset.value, limit: itemsPerPage.value })
  totalItems.value = keys.value.total
}
await tryOrThrow(() => refresh())

const handlePageChange = (page: number) => {
  offset.value = getPageOffset(page)
}

// A page size change resets the offset in `usePagination`; refresh explicitly when it was already 0.
watch(offset, () => refresh())
watch(itemsPerPage, () => {
  if (0 === offset.value) refresh()
})

const editKey = async (key: Key) => {
  let payload: { name: string; description: string }
  try {
    payload = await openDialog(KeyEditPromptModal, {
      title: t('dialogs.editTitle'),
      name: key.name,
      description: key.description,
    })
  } catch (error) {
    if (error instanceof DismissedDialog) return
    throw error
  }
  const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.updating') })
  try {
    await client.updateKey(key.uid, payload)
    toast.update({ ...TOAST_SUCCESS(t) })
    await refresh()
  } catch {
    toast.update({ ...TOAST_FAILURE(t) })
  }
}

const deleteKey = async (key: Key) => {
  const isCurrentKey = credentials.value?.accessKey === key.key
  const text = t(isCurrentKey ? 'confirmations.deleteCurrent' : 'confirmations.delete', {
    name: key.name ?? key.uid,
  })
  if (!(await confirm({ text }))) return
  const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.deleting') })
  try {
    await client.deleteKey(key.uid)
    toast.update({ ...TOAST_SUCCESS(t) })
    // Deleting the last key of the last page would leave it empty: step back one page.
    if (keys.value.results.length === 1 && offset.value > 0) {
      offset.value = getPageOffset(currentPage.value - 1)
    } else {
      await refresh()
    }
  } catch {
    toast.update({ ...TOAST_FAILURE(t) })
  }
}

const keyMenuItems = (key: Key): DropdownMenuItem[] => [
  { label: t('actions.edit'), icon: 'heroicons:pencil', onSelect: () => editKey(key) },
  { label: t('actions.delete'), icon: 'heroicons:trash', color: 'error', onSelect: () => deleteKey(key) },
]
</script>

<i18n>
en:
  title: Access Keys
  columns:
    name: Name
    uid: Uid
    actions: Actions
    indexes: Indexes
    date: Creation Date
    expiresAt: Expires
  placeholders:
    never: Never
  actions:
    create: Create
    settings: Configure keys
    edit: Edit
    delete: Delete
    openMenu: Open menu
  dialogs:
    editTitle: Edit key
  toasts:
    updating: Updating the key...
    deleting: Deleting the key...
  confirmations:
    delete: Do you want to delete the key "{name}"? This cannot be undone.
    deleteCurrent: The key "{name}" is the one you are currently signed in with. Deleting it will cut your access to this instance. Delete it anyway?
  hints:
    copySecretKey: Copy secret key to clipboard
</i18n>
