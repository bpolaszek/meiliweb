<template>
  <div class="grid justify-items-stretch gap-6 md:grid-cols-3">
    <DefineCard v-slot="{ $slots, title, icon }">
      <section class="flex gap-6 rounded-xl border border-gray-300 p-4">
        <Icon :name="icon" class="size-14 text-primary-700" />
        <div class="space-y-4">
          <h2 class="block text-lg font-light text-gray-600">{{ title }}</h2>
          <span class="font-bold tracking-wide text-primary-700">
            <Component :is="$slots.default" />
          </span>
        </div>
      </section>
    </DefineCard>

    <Card :title="t('titles.version')" icon="material-symbols:conversion-path">
      {{ version.pkgVersion }}
    </Card>

    <Card :title="t('titles.dbSize')" icon="gravity-ui:database-fill">
      {{ filesize(stats.databaseSize).human() }}
    </Card>

    <Card :title="t('titles.lastUpdatedAt')" icon="bi:clock-fill">
      {{ formatDate(stats.lastUpdate) }}
    </Card>
  </div>
</template>

<script setup>
import { createReusableTemplate } from '@vueuse/core'
import filesize from 'file-size'
import { useDateFormatter, useMeiliClient } from '~/composables'

const [DefineCard, Card] = createReusableTemplate()
const meili = useMeiliClient()
const { t } = useI18n()
const { formatDate } = useDateFormatter()
const [version, stats] = await Promise.all([
  meili.getVersion(),
  meili.getStats(),
])
</script>

<i18n>
en:
  titles:
    dbSize: Database size
    version: Meilisearch Version
    lastUpdatedAt: Last updated
</i18n>
