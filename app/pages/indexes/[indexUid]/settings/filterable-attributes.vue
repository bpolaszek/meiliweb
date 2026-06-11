<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3 class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('title') }}
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings#filterable-attributes" />
    </h3>

    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      {{ error }}
    </Alert>

    <Alert theme="warning" :title="t('notice.title')">
      {{ t('notice.text') }}
    </Alert>

    <div class="overflow-hidden rounded-lg border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="py-2 pl-4 pr-2 text-left font-medium text-gray-700">{{ t('table.pattern') }}</th>
            <th class="px-2 py-2 text-center font-medium text-gray-700">{{ t('table.facetSearch') }}</th>
            <th class="px-2 py-2 text-center font-medium text-gray-700">{{ t('table.equality') }}</th>
            <th class="px-2 py-2 text-center font-medium text-gray-700">{{ t('table.comparison') }}</th>
            <th class="py-2 pl-2 pr-4 text-right font-medium text-gray-700"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 bg-white">
          <tr v-for="(row, i) in rows" :key="i" class="group">
            <td class="py-1.5 pl-4 pr-2">
              <input
                v-model="row.pattern"
                type="text"
                class="form-input w-full text-sm"
                :placeholder="t('placeholders.pattern')" />
            </td>
            <td class="px-2 py-1.5 text-center">
              <input v-model="row.facetSearch" type="checkbox" class="form-checkbox" />
            </td>
            <td class="px-2 py-1.5 text-center">
              <input v-model="row.equalityFilter" type="checkbox" class="form-checkbox" />
            </td>
            <td class="px-2 py-1.5 text-center">
              <input v-model="row.comparisonFilter" type="checkbox" class="form-checkbox" />
            </td>
            <td class="py-1.5 pl-2 pr-4 text-right">
              <button
                type="button"
                class="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                @click="removeRow(i)">
                <Icon name="mdi:close" />
              </button>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="5" class="px-4 py-4 text-center text-sm italic text-gray-400">
              {{ t('emptyState') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Button type="button" theme="secondary" icon="mdi:plus" size="small" @click="addRow()">
      {{ t('actions.addPattern') }}
    </Button>

    <footer class="flex flex-col items-center justify-end sm:flex-row">
      <Buttons>
        <Button type="reset" :disabled="!modified || loading" />
        <Button type="submit" :disabled="!modified || loading" :loading />
      </Buttons>
    </footer>
  </form>
</template>

<script setup lang="ts">
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Alert from '~/components/layout/Alert.vue'
import { decodeFilterableAttributes, encodeFilterableAttributes, type FilterableAttributeRow } from '~/utils'
import { TOAST_FAILURE, TOAST_SUCCESS, useToasts } from '~/stores/toasts'
import { useFormSubmit, useTask } from '~/composables'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()

const { t } = useI18n()
const meili = useMeiliClient()
const index = meili.index(props.indexUid)

const rawFilterableAttributes = await index.getFilterableAttributes()

const savedRows = ref<FilterableAttributeRow[]>(decodeFilterableAttributes(rawFilterableAttributes))
const rows = ref<FilterableAttributeRow[]>(decodeFilterableAttributes(rawFilterableAttributes))

const encodedKey = (r: FilterableAttributeRow[]) =>
  JSON.stringify(encodeFilterableAttributes(r.filter((row) => row.pattern.trim() !== '')))

const modified = computed(() => encodedKey(rows.value) !== encodedKey(savedRows.value))

const reset = () => {
  rows.value = savedRows.value.map((r) => ({ ...r }))
}

const addRow = () => {
  rows.value.push({ pattern: '', facetSearch: true, equalityFilter: true, comparisonFilter: true })
}

const removeRow = (index: number) => {
  rows.value.splice(index, 1)
}

const { loading, error, handle } = useFormSubmit({
  confirm: { text: t('confirmations.submit') },
})
const processTask = useTask()
const { createToast } = useToasts()

const submit = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.success.title'),
    text: t('toasts.success.pendingText'),
  })
  await handle(async () => {
    toast.spawn()
    const cleanRows = rows.value.filter((r) => r.pattern.trim() !== '')
    const encoded = encodeFilterableAttributes(cleanRows)
    await processTask(() => index.updateFilterableAttributes(encoded), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        savedRows.value = cleanRows.map((r) => ({ ...r }))
        rows.value = cleanRows.map((r) => ({ ...r }))
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
  title: `${t('title')} - ${index.uid}`,
})
</script>

<i18n>
en:
  title: Filterable attributes
  table:
    pattern: Attribute / Pattern
    facetSearch: Facet search
    equality: Equality filter
    comparison: Comparison filter
  placeholders:
    pattern: "e.g. genre or price.*"
  actions:
    addPattern: Add pattern
  emptyState: No filterable attributes configured
  toasts:
    success:
      title: Updating filterable attributes
      pendingText: Please wait...
      doneText: Done.
    error:
      title: Error while updating filterable attributes
      canceledText: Task was canceled.
      failedText: Task failed.
  confirmations:
    submit: Do you want to update your settings?
  notice:
    title: Caution
    text: Updating filterable attributes will re-index all documents in the index, which can take some time.
          We recommend updating your index settings first and then adding documents as this reduces RAM consumption.
</i18n>
