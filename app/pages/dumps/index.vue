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

    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      {{ error }}
    </Alert>

    <Table
      :items="tasks.results"
      :columns="[t('columns.dumpUid'), t('columns.status'), t('columns.date'), t('columns.duration')]">
      <template #default="{ index }">
        <td>{{ tasks.results[index].details.dumpUid }}</td>
        <td>
          <Badge :theme="'succeeded' === tasks.results[index].status ? 'success' : 'danger'">
            {{ tasks.results[index].status }}
          </Badge>
        </td>
        <td class="whitespace-nowrap">
          {{
            formatDate(
              match(tasks.results[index].status, [
                [['enqueued', 'canceled'], [tasks.results[index].enqueuedAt]],
                ['processing', [tasks.results[index].startedAt]],
                [match.default, [tasks.results[index].finishedAt]],
              ]),
            )
          }}
        </td>
        <td class="text-right">
          <template v-if="tasks.results[index].duration">
            {{ formatDuration(tasks.results[index].duration) }}
          </template>
        </td>
      </template>
    </Table>
  </Layout>
</template>

<script setup lang="ts">
import { tryOrThrow, useDateFormatter, useMeiliClient, useToasts } from "#imports"
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS } from "~/stores/toasts"
import { useFormSubmit, useTask } from "~/composables"
import Alert from "~/components/layout/Alert.vue"
import Table from "~/components/layout/tables/Table.vue"
import Badge from "~/components/layout/Badge.vue"
import DocumentationLink from "~/components/layout/DocumentationLink.vue"
import Button from "~/components/layout/forms/Button.vue"
import match from "match-operator"

const { t } = useI18n()
const meili = useMeiliClient()
const fetchTasks = () => tryOrThrow(() => meili.tasks.getTasks({ types: ['dumpCreation'] }))
const { formatDate, formatDuration } = useDateFormatter()
const { createToast } = useToasts()
const processTask = useTask()
const { loading, error, handle } = useFormSubmit({
  confirm: {
    title: t('confirmations.create.title'),
    text: t('confirmations.create.text'),
  },
})
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
  title: t('title'),
})
const { tasks } = toRefs(self)
</script>

<i18n>
en:
  title: Dumps
  columns:
    dumpUid: Dump Uid
    status: Status
    type: Type
    date: Date
    duration: Duration
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
