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
      ]">
      <template #default="{ index: i }">
        <td>
          <div class="flex flex-col">
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              {{ keys.results[i].name }}
              <ClipboardButton
                :source="keys.results[i].key"
                :copy-text="t('hints.copySecretKey')"
                class="shrink-0 grow-0" />
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
              <ClipboardButton :source="keys.results[i].uid" class="shrink-0 grow-0" />
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
          <span v-else class="font-light italic text-gray-500">
            {{ t('placeholders.never') }}
          </span>
        </td>
      </template>
    </Table>
  </Layout>
</template>

<script setup lang="ts">
import { tryOrThrow } from '~/utils'
import { NuxtLink } from '#components'
import Table from '~/components/layout/tables/Table.vue'
import ClipboardButton from '~/components/layout/forms/ClipboardButton.vue'
import Button from '~/components/layout/forms/Button.vue'

const client = useMeiliClient()

const { formatDate } = useDateFormatter()
const { t } = useI18n()
useHead({
  title: t('title'),
})

const keys = await tryOrThrow(() => client.getKeys())
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
  hints:
    copySecretKey: Copy secret key to clipboard
</i18n>
