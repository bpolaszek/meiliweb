<template>
  <Layout :title="t('title')">
    <DefineTreeRendering v-slot="{ value }">
      <div v-if="'object' === typeof value && null !== value" class="table">
        <div v-for="[_key, _value] of Object.entries(value)" class="table-row">
          <dt class="table-cell">{{ _key }}</dt>
          <dd class="table-cell p-1 text-xs">
            <DocumentationLink v-if="'link' === _key" :href="_value as string">
              {{ _value }}
            </DocumentationLink>
            <UseTreeRendering v-else :value="_value" />
          </dd>
        </div>
      </div>
      <span v-else>{{ value }}</span>
    </DefineTreeRendering>
    <Table
      :items="tasks.results"
      :columns="[
        t('columns.type'),
        t('columns.status'),
        t('columns.indexUid'),
        t('columns.details'),
        t('columns.date'),
        t('columns.duration'),
        '',
      ]">
      <template #default="{ index }">
        <td class="whitespace-nowrap">
          {{ stringifyTaskType(tasks.results[index].type) }}
        </td>
        <td>
          <Badge :theme="TaskStatus.TASK_SUCCEEDED === tasks.results[index].status ? 'success' : 'danger'">
            {{ tasks.results[index].status }}
          </Badge>
        </td>
        <td>
          <NuxtLink
            v-if="tasks.results[index].indexUid"
            :to="`/indexes/${tasks.results[index].indexUid}/documents`"
            class="font-semibold text-primary-800 hover:text-primary-700 hover:underline">
            {{ tasks.results[index].indexUid }}
          </NuxtLink>
        </td>
        <td>
          <UseTreeRendering
            v-if="TaskStatus.TASK_FAILED === tasks.results[index].status"
            :value="tasks.results[index].error" />
          <span v-else-if="'documentAdditionOrUpdate' === tasks.results[index].type">
            {{
              t('labels.documentIndexRatio', {
                indexedDocuments: tasks.results[index].details.indexedDocuments ?? 0,
                receivedDocuments: tasks.results[index].details.receivedDocuments,
              })
            }}
          </span>
          <UseTreeRendering v-else :value="tasks.results[index].details" />
        </td>
        <td class="whitespace-nowrap">
          {{
            formatDate(
              match(tasks.results[index].status, [
                [[TaskStatus.TASK_ENQUEUED, TaskStatus.TASK_CANCELED], [tasks.results[index].enqueuedAt]],
                [TaskStatus.TASK_PROCESSING, [tasks.results[index].startedAt]],
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
        <td class="text-right">
          <template v-if="[TaskStatus.TASK_ENQUEUED, TaskStatus.TASK_PROCESSING].includes(tasks.results[index].status)">
            <Button
              theme="primary"
              size="small"
              icon="mdi:close"
              @click="cancelTask(tasks.results[index])"
              class="w-full flex-row-reverse">
              {{ t('buttons.cancel') }}
            </Button>
          </template>
        </td>
      </template>
    </Table>
    <InfiniteLoading @infinite="handleInfiniteLoading()" />
  </Layout>
</template>

<script setup lang="ts">
import { useMeiliClient, useDateFormatter } from '#imports'
import { tryOrThrow } from '~/utils'
import match from 'match-operator'
import { NuxtLink } from '#components'
import Table from '~/components/layout/tables/Table.vue'
import Badge from '~/components/layout/Badge.vue'
import { type Task } from 'meilisearch'
import Button from '~/components/layout/forms/Button.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import { createReusableTemplate, watchImmediate } from '@vueuse/core'
import InfiniteLoading from 'v3-infinite-loading'
import { TaskStatus } from '~/types'

const { t } = useI18n()
useHead({
  title: t('title'),
})

const meili = useMeiliClient()
const { confirm } = useConfirmationDialog()
const { createToast } = useToasts()
const [DefineTreeRendering, UseTreeRendering] = createReusableTemplate()
const self = reactive({
  tasks: await tryOrThrow(() => meili.getTasks()),
  lastTaskUid: null! as number,
  pendingTasks: computed((): Task[] =>
    self.tasks.results.filter((task: Task) =>
      [TaskStatus.TASK_ENQUEUED, TaskStatus.TASK_PROCESSING].includes(task.status),
    ),
  ),
})
const { formatDate, formatDuration } = useDateFormatter()
const stringifyTaskType = (type: string) =>
  match(type, [
    ['indexCreation', t('taskTypes.indexCreation')],
    ['indexUpdate', t('taskTypes.indexUpdate')],
    ['indexDeletion', t('taskTypes.indexDeletion')],
    ['indexSwap', t('taskTypes.indexSwap')],
    ['documentAdditionOrUpdate', t('taskTypes.documentAdditionOrUpdate')],
    ['documentDeletion', t('taskTypes.documentDeletion')],
    ['settingsUpdate', t('taskTypes.settingsUpdate')],
    ['dumpCreation', t('taskTypes.dumpCreation')],
    ['taskCancelation', t('taskTypes.taskCancelation')],
    ['taskDeletion', t('taskTypes.taskDeletion')],
    ['snapshotCreation', t('taskTypes.snapshotCreation')],
    [match.default, type],
  ])

const { tasks, pendingTasks } = toRefs(self)
watchImmediate(tasks, (tasks) => (self.lastTaskUid = tasks.results[tasks.results.length - 1]!.uid), { deep: true })
const handleInfiniteLoading = async () => {
  const nextTasks = await tryOrThrow(() => meili.getTasks({ from: self.lastTaskUid }))
  self.tasks.results.push(...nextTasks.results)
}
const cancelTask = async (task: Task) => {
  if (!(await confirm({ text: t('confirmations.cancelTask') }))) {
    return
  }
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    title: t('toasts.cancelTask'),
  })
  const cancelTask = await meili.cancelTasks({ uids: [task.uid] })
  await meili.waitForTask(cancelTask.taskUid)
  toast.destroy()
  task.status = TaskStatus.TASK_CANCELED
}

const watchers = new WeakMap()
watch(
  pendingTasks,
  (tasks: Task[]) => {
    tasks.forEach(async (task) => {
      if (watchers.has(task)) {
        return
      }
      watchers.set(task, this)
      if (task.status === TaskStatus.TASK_ENQUEUED) {
        const interval = setInterval(async () => {
          let updatedTask = await meili.getTask(task.uid)
          if (updatedTask.status !== TaskStatus.TASK_ENQUEUED) {
            clearInterval(interval)
            watchers.delete(task)
            Object.assign(task, updatedTask)
          }
        }, 50)
      } else {
        const updatedTask = await meili.waitForTask(task.uid, {
          timeOutMs: 1000 * 3600 * 24,
        })
        Object.assign(task, updatedTask)
      }
    })
  },
  { immediate: true, deep: true },
)
</script>

<i18n>
en:
  title: Tasks
  columns:
    indexUid: Index
    status: Status
    type: Type
    details: Details
    date: Date
    duration: Duration
  taskTypes:
    indexCreation: Index creation
    indexUpdate: Index update
    indexDeletion: Index deletion
    indexSwap: Index swap
    documentAdditionOrUpdate: Document addition/update
    documentDeletion: Document deletion
    settingsUpdate: Settings update
    dumpCreation: Dump creation
    taskCancelation: Task cancelation
    taskDeletion: Task deletion
    snapshotCreation: Snapshot creation
  labels:
    documentIndexRatio: Indexed {indexedDocuments}/{receivedDocuments}
  toasts:
    cancelTask: Cancelling task
  confirmations:
    cancelTask: Are you sure you want to cancel this task?
</i18n>
