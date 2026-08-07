<template>
  <div>
    <DefineTreeRendering v-slot="{ value }">
      <div v-if="'object' === typeof value && null !== value" class="table">
        <div v-for="[_key, _value] of Object.entries(value)" class="table-row">
          <dt class="table-cell">{{ _key }}</dt>
          <dd class="table-cell p-1 text-xs">
            <UseTreeRendering :value="_value" />
          </dd>
        </div>
      </div>
      <span v-else>{{ value }}</span>
    </DefineTreeRendering>
    <Table
      :items="batches.results"
      :columns="[
        t('columns.uid'),
        t('columns.types'),
        t('columns.status'),
        t('columns.indexUid'),
        t('columns.details'),
        t('columns.date'),
        t('columns.duration'),
        '',
      ]">
      <template #default="{ item }">
        <td class="font-medium whitespace-nowrap">#{{ item.uid }}</td>
        <td>
          <div class="flex flex-col gap-0.5">
            <span v-for="(count, type) of item.stats.types" :key="type" class="whitespace-nowrap">
              {{ stringifyTaskType(type) }}
              <template v-if="count > 1">({{ count }})</template>
            </span>
          </div>
        </td>
        <td>
          <div class="flex flex-wrap gap-1">
            <Badge v-for="(count, status) of item.stats.status" :key="status" :theme="statusTheme(status)">
              {{ count }} {{ status }}
            </Badge>
          </div>
        </td>
        <td>
          <div class="flex flex-col gap-0.5">
            <NuxtLink
              v-for="(_count, indexUid) of item.stats.indexUids"
              :key="indexUid"
              :to="`/indexes/${indexUid}/documents`"
              class="font-semibold whitespace-nowrap text-primary-800 hover:text-primary-700 hover:underline">
              {{ indexUid }}
            </NuxtLink>
          </div>
        </td>
        <td>
          <div v-if="item.progress" class="mb-1 flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <div class="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                <div class="h-full rounded-full bg-primary-600" :style="{ width: `${item.progress.percentage}%` }" />
              </div>
              <span class="text-xs text-gray-500">{{ Math.round(item.progress.percentage) }}%</span>
            </div>
            <span v-if="item.progress.steps.length" class="text-xs text-gray-500">
              {{ formatProgressStep(item.progress) }}
            </span>
          </div>
          <UseTreeRendering :value="item.details" />
          <span v-if="item.batchStrategy" class="mt-1 block text-xs text-gray-400">{{ item.batchStrategy }}</span>
        </td>
        <td class="whitespace-nowrap">
          {{ formatDate(item.finishedAt ?? item.startedAt) }}
        </td>
        <td class="text-right">
          <template v-if="item.duration">
            {{ formatDuration(item.duration) }}
          </template>
        </td>
        <td class="text-right">
          <Button
            theme="primary"
            size="small"
            icon="mdi:format-list-bulleted"
            :to="`/tasks?batchUids=${item.uid}`"
            class="w-full flex-row-reverse">
            {{ t('buttons.viewTasks', { count: item.stats.totalNbTasks }) }}
          </Button>
        </td>
      </template>
    </Table>
    <InfiniteLoading @infinite="handleInfiniteLoading" />
  </div>
</template>

<script setup lang="ts">
import { useDateFormatter, useMeiliClient } from '#imports'
import { NuxtLink } from '#components'
import match from 'match-operator'
import type { BatchProgress, TaskStatus } from 'meilisearch'
import InfiniteLoading from 'v3-infinite-loading'
import { createReusableTemplate } from '@vueuse/core'
import Badge from '~/components/layout/Badge.vue'
import Button from '~/components/layout/forms/Button.vue'
import Table from '~/components/layout/tables/Table.vue'
import { tryOrThrow } from '~/utils'

const { t } = useI18n()
useHead({
  title: t('title'),
})

const meili = useMeiliClient()
const [DefineTreeRendering, UseTreeRendering] = createReusableTemplate()
const self = reactive({
  batches: await tryOrThrow(() => meili.batches.getBatches()),
})
const { formatDate, formatDuration } = useDateFormatter()

const statusTheme = (status: TaskStatus) =>
  match(status, [
    ['succeeded', 'success'],
    ['failed', 'danger'],
    ['processing', 'primary'],
    [match.default, 'neutral'],
  ]) as 'primary' | 'success' | 'danger' | 'neutral'

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

// `steps` is a stack going from the coarsest phase to the finest; the last one is the most
// informative for a human watching a batch being processed.
const formatProgressStep = (progress: BatchProgress) => {
  const step = progress.steps[progress.steps.length - 1]
  if (!step) {
    return ''
  }
  return t('labels.progressStep', { step: step.currentStep, finished: step.finished, total: step.total })
}

const { batches } = toRefs(self)

// `v3-infinite-loading` does not re-export its `StateHandler` type from the package root.
type InfiniteLoadingState = { loaded: () => void; complete: () => void; error: () => void }

// `getBatches` returns the cursor of the next page in `next` (null once exhausted), so we
// use it instead of deriving it from the last uid.
const handleInfiniteLoading = async ($state: InfiniteLoadingState) => {
  if (null === self.batches.next) {
    $state.complete()
    return
  }
  const nextBatches = await tryOrThrow(() => meili.batches.getBatches({ from: self.batches.next }))
  self.batches.results.push(...nextBatches.results)
  self.batches.next = nextBatches.next
  $state.loaded()
  if (null === nextBatches.next) {
    $state.complete()
  }
}
</script>

<i18n>
en:
  title: Batches
  columns:
    uid: Batch
    types: Types
    status: Status
    indexUid: Index
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
    progressStep: '{step} — {finished}/{total}'
  buttons:
    viewTasks: '{count} tasks'
</i18n>
