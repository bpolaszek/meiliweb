<template>
  <Layout :title="t('title')" :subtitle="t('subtitle')">
    <template #title-actions>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/chats" />
    </template>
    <template #actions>
      <Button v-if="available" theme="primary" icon="pajamas:doc-new" @click="createWorkspace()">
        {{ t('actions.create') }}
      </Button>
    </template>

    <ChatUnavailableAlert v-if="!available" />

    <Alert v-else-if="!workspaces.length" :title="t('empty.title')">
      {{ t('empty.text') }}
    </Alert>

    <Table v-else :items="workspaces" :columns="[t('columns.uid'), t('columns.actions')]">
      <template #default="{ item }">
        <td class="font-medium">{{ item.uid }}</td>
        <td>
          <div class="flex items-center gap-3">
            <NuxtLink
              v-tippy="t('actions.chat')"
              :to="`/chat/${item.uid}`"
              class="text-gray-500 hover:text-primary-600">
              <Icon name="heroicons:chat-bubble-left-right" />
            </NuxtLink>
            <NuxtLink
              v-tippy="t('actions.settings')"
              :to="`/chat/${item.uid}/settings`"
              class="text-gray-500 hover:text-primary-600">
              <Icon name="heroicons:cog-6-tooth" />
            </NuxtLink>
            <button
              type="button"
              v-tippy="t('actions.delete')"
              class="text-gray-500 hover:text-red-600"
              @click="confirmDelete(item.uid)">
              <Icon name="heroicons:trash" />
            </button>
          </div>
        </td>
      </template>
    </Table>
  </Layout>
</template>

<script setup lang="ts">
import { until } from '@vueuse/core'
import ChatUnavailableAlert from '~/components/chat/ChatUnavailableAlert.vue'
import ChatWorkspaceNamePromptModal from '~/components/chat/ChatWorkspaceNamePromptModal.vue'
import Alert from '~/components/layout/Alert.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Button from '~/components/layout/forms/Button.vue'
import Table from '~/components/layout/tables/Table.vue'
import { useChatWorkspaces } from '~/composables'
import {
  DismissedDialog,
  TOAST_FAILURE,
  TOAST_PLEASEWAIT,
  TOAST_SUCCESS,
  useChatAvailability,
  useConfirmationDialog,
  usePromisifiedDialogs,
  useToasts,
} from '~/stores'
import { safeToRefs, tryOrThrow } from '~/utils'

const { t } = useI18n()
// Register lifecycle-bound composables before the first `await` so they keep their component context.
useHead({ title: t('title') })

const { list, remove } = useChatWorkspaces()
const { confirm } = useConfirmationDialog()
const { openDialog } = usePromisifiedDialogs()
const { createToast } = useToasts()
const { available, loading } = safeToRefs(useChatAvailability())

// Both gates resolve asynchronously; wait for them before deciding whether to call /chats,
// which would answer 404 on an instance where the feature is off.
await until(loading).toBe(false)

const workspaces = ref<Array<{ uid: string }>>(available.value ? (await tryOrThrow(() => list())).results : [])

const refresh = async () => {
  workspaces.value = (await list()).results
}

const createWorkspace = async () => {
  try {
    const uid = await openDialog(ChatWorkspaceNamePromptModal)
    await navigateTo(`/chat/${uid}/settings`)
  } catch (e) {
    if (!(e instanceof DismissedDialog)) {
      throw e
    }
  }
}

const confirmDelete = async (uid: string) => {
  if (!(await confirm({ text: t('confirmations.delete', { uid }) }))) {
    return
  }
  const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.deleting') })
  try {
    await remove(uid)
    toast.update({ ...TOAST_SUCCESS(t) })
    await refresh()
  } catch {
    toast.update({ ...TOAST_FAILURE(t) })
  }
}
</script>

<i18n>
en:
  title: Chat
  subtitle: Conversational search workspaces backed by an LLM provider.
  columns:
    uid: Workspace
    actions: Actions
  empty:
    title: No chat workspace yet
    text: Create one to configure an LLM provider and start chatting with your indexes.
  actions:
    create: Create
    chat: Open chat
    settings: Settings
    delete: Delete
  confirmations:
    delete: 'Do you really want to delete the workspace "{uid}" and its settings?'
  toasts:
    deleting: Deleting workspace...
</i18n>
