<template>
  <Layout :title="t('title')">
    <template #title-actions>
      <DocumentationLink
        href="https://www.meilisearch.com/docs/learn/advanced/snapshots_vs_dumps#dumps"
        v-slot="{ icon }">
        <Icon :name="icon" class="size-5" />
      </DocumentationLink>
    </template>

    <template #actions>
      <Button type="button" theme="primary" icon="clarity:backup-solid" :disabled="loading" @click="createDump()">
        {{ t('actions.create') }}
      </Button>
    </template>

    <PageTabs :items="tabs" />

    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      {{ error }}
    </Alert>

    <BackupTasksTable :tasks="tasks" :uid-label="t('columns.dumpUid')" :empty-text="t('emptyState')" />
  </Layout>
</template>

<script setup lang="ts">
import { tryOrThrow, useMeiliClient, useToasts } from '#imports'
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS } from '~/stores/toasts'
import { EXPORT_MIN_VERSION, useFormSubmit, useTask } from '~/composables'
import { useVersion } from '~/stores'
import Alert from '~/components/layout/Alert.vue'
import PageTabs from '~/components/layout/PageTabs.vue'
import BackupTasksTable from '~/components/backup/BackupTasksTable.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Button from '~/components/layout/forms/Button.vue'

const { t } = useI18n()
const meili = useMeiliClient()
const { satisfiesVersion } = useVersion()
const fetchTasks = () => tryOrThrow(() => meili.tasks.getTasks({ types: ['dumpCreation'] }))
const { createToast } = useToasts()
const processTask = useTask()
const { loading, error, handle } = useFormSubmit({
  confirm: {
    title: t('confirmations.create.title'),
    text: t('confirmations.create.text'),
  },
})
const tabs = computed(() => [
  { label: t('tabs.dumps'), to: '/backup/dumps' },
  { label: t('tabs.snapshots'), to: '/backup/snapshots' },
  ...(satisfiesVersion(EXPORT_MIN_VERSION) ? [{ label: t('tabs.export'), to: '/backup/export' }] : []),
])
const self = reactive({
  tasks: await fetchTasks(),
})
const createDump = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    title: t('toasts.create.title'),
    immediate: false,
  })

  await handle(async () => {
    toast.spawn()
    await processTask(() => meili.createDump(), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        self.tasks = await fetchTasks()
      },
      onCanceled: () =>
        toast.update({
          ...TOAST_FAILURE(t),
          text: t('toasts.texts.canceledTask'),
        }),
      onFailure: () =>
        toast.update({
          ...TOAST_FAILURE(t),
          text: t('toasts.texts.failedTask'),
        }),
    })
  })
}

useHead({
  title: t('pageTitle'),
})
const { tasks } = toRefs(self)
</script>

<i18n>
en:
  title: Backup
  pageTitle: Dumps
  tabs:
    dumps: Dumps
    snapshots: Snapshots
    export: Export
  columns:
    dumpUid: Dump Uid
  emptyState: No dumps yet.
  actions:
    create: Create dump
  confirmations:
    create:
      title: Create a dump now?
      text: Dump tasks take priority over all other tasks in the queue.
            This means that a newly created dump task will be processed as soon as the current task is finished.
  toasts:
    create:
      title: Creating dump...
      pendingText: Your dump is being created, please wait...
</i18n>
