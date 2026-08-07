<template>
  <template v-if="tasks.results.length > 0">
    <Table :items="tasks.results" :columns="columns">
      <template #default="{ index }">
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
        <td>
          <Badge :theme="statusTheme(tasks.results[index].status)">
            {{ tasks.results[index].status }}
          </Badge>
        </td>
        <td v-if="uidLabel" class="whitespace-nowrap">{{ tasks.results[index].details?.dumpUid }}</td>
        <td class="text-right">
          <template v-if="tasks.results[index].duration">
            {{ formatDuration(tasks.results[index].duration) }}
          </template>
        </td>
      </template>
    </Table>
  </template>

  <div v-else class="flex flex-col items-center justify-center gap-6 py-20">
    <p class="text-5xl font-light text-gray-700">🗄️</p>
    <p class="text-2xl font-light text-gray-700">{{ emptyText }}</p>
  </div>
</template>

<script setup lang="ts">
import { useDateFormatter } from '~/composables'
import Table from '~/components/layout/tables/Table.vue'
import Badge from '~/components/layout/Badge.vue'
import match from 'match-operator'
import type { TasksResults } from 'meilisearch'

type Props = {
  tasks: TasksResults
  /** Column label for the dump/snapshot uid. Omit to hide the column entirely (snapshots don't have one). */
  uidLabel?: string
  emptyText: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const { formatDate, formatDuration } = useDateFormatter()

const columns = computed(() => [
  t('columns.date'),
  t('columns.status'),
  ...(props.uidLabel ? [props.uidLabel] : []),
  t('columns.duration'),
])

const statusTheme = (status: string) =>
  match(status, [
    ['succeeded', 'success'],
    [['failed', 'canceled'], 'danger'],
    [match.default, 'neutral'],
  ]) as 'success' | 'danger' | 'neutral'
</script>

<i18n>
en:
  columns:
    status: Status
    date: Date
    duration: Duration
</i18n>
