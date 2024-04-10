<template>
  <Layout :title="t('title')">
    <Table
      :items="tasks.results"
      :columns="[
        t('columns.type'),
        t('columns.status'),
        t('columns.indexUid'),
        t('columns.details'),
        t('columns.date'),
        t('columns.duration'),
      ]">
      <template #default="{ index }">
        <td class="whitespace-nowrap">
          {{ stringifyTaskType(tasks.results[index].type) }}
        </td>
        <td>
          <Badge
            :theme="
              'succeeded' === tasks.results[index].status ? 'success' : 'danger'
            ">
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
          <span v-if="'documentAdditionOrUpdate' === tasks.results[index].type">
            {{ t('labels.documentIndexRatio', tasks.results[index].details) }}
          </span>
          <span v-else>{{ tasks.results[index].details }}</span>
        </td>
        <td class="whitespace-nowrap">
          {{
            formatDate(
              tasks.results[index].finishedAt ??
                tasks.results[index].startedAt ??
                tasks.results[index].enqueuedAt,
            )
          }}
        </td>
        <td class="text-right">
          {{ formatDuration(tasks.results[index].duration) }}
        </td>
      </template>
    </Table>
  </Layout>
</template>

<script setup lang="ts">
import { useMeiliClient, useDateFormatter } from '#imports'
import { tryOrThrow } from '~/utils'
import match from 'match-operator'
import { NuxtLink } from '#components'
import Table from '~/components/layout/tables/Table.vue'
import Badge from '~/components/layout/Badge.vue'

const { t } = useI18n()
useHead({
  title: t('title'),
})

const meili = useMeiliClient()
const tasks = await tryOrThrow(() => meili.getTasks())
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
</i18n>
