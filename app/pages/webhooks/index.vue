<template>
  <Layout :title="t('title')">
    <template #title-actions>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/webhooks" />
    </template>
    <template #actions>
      <Button
        theme="primary"
        icon="pajamas:doc-new"
        :disabled="limitReached"
        v-tippy="limitReached ? t('hints.limitReached', { max: WEBHOOK_MAX_EDITABLE }) : undefined"
        @click="openEditor(null)">
        {{ t('actions.create') }}
      </Button>
    </template>

    <Table
      :items="webhooks"
      :columns="[t('columns.url'), t('columns.uuid'), t('columns.headers'), t('columns.actions')]">
      <template #default="{ index: i }">
        <td>
          <span class="inline-flex items-center gap-2">
            <span class="line-clamp-1 max-w-md break-all">{{ webhooks[i].url }}</span>
            <Badge v-if="!webhooks[i].isEditable" theme="neutral">{{ t('badges.readOnly') }}</Badge>
          </span>
        </td>
        <td>
          <span class="inline-flex items-center gap-1 whitespace-nowrap font-mono text-sm">
            {{ webhooks[i].uuid }}
            <ClipboardButton :source="webhooks[i].uuid" class="shrink-0 grow-0" />
          </span>
        </td>
        <td>
          <span v-if="headerCount(webhooks[i])" class="text-sm">
            {{ t('headerCount', headerCount(webhooks[i])) }}
          </span>
          <span v-else class="text-sm font-light italic text-gray-500">{{ t('placeholders.noHeaders') }}</span>
        </td>
        <td>
          <div v-if="webhooks[i].isEditable" class="flex items-center gap-2">
            <button
              type="button"
              v-tippy="t('actions.edit')"
              class="text-gray-500 hover:text-primary-600"
              @click="openEditor(webhooks[i])">
              <Icon name="heroicons:pencil-square" />
            </button>
            <button
              type="button"
              v-tippy="t('actions.delete')"
              class="text-gray-500 hover:text-red-600"
              @click="confirmDelete(webhooks[i])">
              <Icon name="heroicons:trash" />
            </button>
          </div>
          <span v-else class="text-sm font-light italic text-gray-500">{{ t('placeholders.cliManaged') }}</span>
        </td>
      </template>
    </Table>

    <WebhookEditor v-model:open="editorOpen" :webhook="editing" @saved="refresh()" />
  </Layout>
</template>

<script setup lang="ts">
import Table from '~/components/layout/tables/Table.vue'
import Button from '~/components/layout/forms/Button.vue'
import Badge from '~/components/layout/Badge.vue'
import ClipboardButton from '~/components/layout/forms/ClipboardButton.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import WebhookEditor from '~/components/webhooks/WebhookEditor.vue'
import { useWebhooks, WEBHOOK_MAX_EDITABLE, type Webhook } from '~/composables'
import { useConfirmationDialog, TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS, useToasts } from '~/stores'
import { tryOrThrow } from '~/utils'

const { t } = useI18n()
useHead({ title: t('title') })

const { list, remove } = useWebhooks()
const { confirm } = useConfirmationDialog()
const { createToast } = useToasts()

const webhooks = ref<Webhook[]>((await tryOrThrow(() => list())).results)
const refresh = async () => {
  webhooks.value = (await list()).results
}

const limitReached = computed(() => webhooks.value.filter((w) => w.isEditable).length >= WEBHOOK_MAX_EDITABLE)
const headerCount = (webhook: Webhook) => Object.keys(webhook.headers ?? {}).length

const editorOpen = ref(false)
const editing = ref<Webhook | null>(null)
const openEditor = (webhook: Webhook | null) => {
  editing.value = webhook
  editorOpen.value = true
}

const confirmDelete = async (webhook: Webhook) => {
  if (!(await confirm({ text: t('confirmations.delete') }))) {
    return
  }
  const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.deleting') })
  try {
    await remove(webhook.uuid)
    toast.update({ ...TOAST_SUCCESS(t) })
    await refresh()
  } catch (e) {
    toast.update({ ...TOAST_FAILURE(t) })
  }
}
</script>

<i18n>
en:
  title: Webhooks
  columns:
    url: URL
    uuid: UUID
    headers: Headers
    actions: Actions
  badges:
    readOnly: Read-only
  headerCount: '{count} header | {count} headers'
  placeholders:
    noHeaders: None
    cliManaged: Defined via CLI
  actions:
    create: Create
    edit: Edit
    delete: Delete
  hints:
    limitReached: 'Meilisearch allows at most {max} editable webhooks.'
  confirmations:
    delete: Do you really want to delete this webhook?
  toasts:
    deleting: Deleting webhook...
</i18n>
