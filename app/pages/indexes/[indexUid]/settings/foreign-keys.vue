<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3 class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('title') }}
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings/get-foreignkeys" />
    </h3>

    <Alert v-if="!featureEnabled" theme="warning" :title="t('disabled.title')">
      {{ t('disabled.text') }}
      <NuxtLink to="/experimental-features" class="font-medium underline">
        {{ t('disabled.link') }}
      </NuxtLink>
    </Alert>

    <Alert v-else-if="endpointUnavailable" theme="danger" :title="t('unavailable.title')">
      {{ t('unavailable.text') }}
    </Alert>

    <template v-else>
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
              <th class="py-2 pl-4 pr-2 text-left font-medium text-gray-700">{{ t('table.fieldName') }}</th>
              <th class="px-2 py-2 text-left font-medium text-gray-700">{{ t('table.foreignIndex') }}</th>
              <th class="py-2 pl-2 pr-4 text-right font-medium text-gray-700"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr v-for="(row, i) in rows" :key="i" class="group">
              <td class="py-1.5 pl-4 pr-2">
                <input
                  v-model="row.fieldName"
                  type="text"
                  class="form-input w-full text-sm"
                  :placeholder="t('placeholders.fieldName')" />
              </td>
              <td class="px-2 py-1.5">
                <select v-model="row.foreignIndexUid" class="form-select w-full text-sm">
                  <option value="" disabled>{{ t('placeholders.foreignIndex') }}</option>
                  <option v-for="uid in indexUidsFor(row)" :key="uid" :value="uid">{{ uid }}</option>
                </select>
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
              <td colspan="3" class="px-4 py-4 text-center text-sm italic text-gray-400">
                {{ t('emptyState') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Button type="button" theme="secondary" icon="mdi:plus" size="small" @click="addRow()">
        {{ t('actions.addForeignKey') }}
      </Button>

      <footer class="flex flex-col items-center justify-end sm:flex-row">
        <Buttons>
          <Button type="reset" :disabled="!modified || loading" />
          <Button type="submit" :disabled="!modified || loading" :loading />
        </Buttons>
      </footer>
    </template>
  </form>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Alert from '~/components/layout/Alert.vue'
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS, useToasts } from '~/stores/toasts'
import { useFormSubmit, useMeiliClient, useTask } from '~/composables'
import type { EnqueuedTask } from 'meilisearch'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()

// The official JS client does not expose foreign keys yet, so we talk to the REST API directly
// through the client's `httpRequest` (same approach as useWebhooks).
// @see https://www.meilisearch.com/docs/reference/api/settings/get-foreignkeys
type ForeignKey = {
  fieldName: string
  foreignIndexUid: string
}

const { t } = useI18n()
const meili = useMeiliClient()
const foreignKeysPath = `indexes/${props.indexUid}/settings/foreign-keys`

// Register lifecycle-bound composables before the first `await` so they keep their component context.
useHead({ title: `${t('title')} - ${props.indexUid}` })

// Foreign keys are gated behind the `foreignKeys` experimental flag (Meilisearch >= 1.42).
let featureEnabled = false
try {
  // Direct call (not tryOrThrow): degrade gracefully rather than route to the global error page,
  // since an older instance may not expose this endpoint at all.
  const features = (await meili.getExperimentalFeatures()) as Record<string, boolean>
  featureEnabled = features.foreignKeys === true
} catch {
  // Older instances return 404 here — treat as "not enabled".
}

// Index uids for the foreign index dropdown.
const indexUids = (await meili.getRawIndexes({ limit: 1000 })).results.map(({ uid }) => uid)

const savedRows = ref<ForeignKey[]>([])
const rows = ref<ForeignKey[]>([])
const endpointUnavailable = ref(false)

// Only probe the endpoint when the flag is on; with the flag off it would return a 400 that we'd
// otherwise misreport as "requires >= 1.42". This keeps the "enable the flag" message accurate.
if (featureEnabled) {
  try {
    const current = await meili.httpRequest.get<ForeignKey[]>({ path: foreignKeysPath })
    savedRows.value = current.map((r) => ({ ...r }))
    rows.value = current.map((r) => ({ ...r }))
  } catch {
    endpointUnavailable.value = true
  }
}

const cleaned = (list: ForeignKey[]) => list.filter((r) => r.fieldName.trim() !== '' && r.foreignIndexUid.trim() !== '')

const encodedKey = (list: ForeignKey[]) => JSON.stringify(cleaned(list))

const modified = computed(() => encodedKey(rows.value) !== encodedKey(savedRows.value))

// Keep a row's current value selectable even if it points to an index that no longer exists.
const indexUidsFor = (row: ForeignKey) =>
  row.foreignIndexUid && !indexUids.includes(row.foreignIndexUid) ? [...indexUids, row.foreignIndexUid] : indexUids

const reset = () => {
  rows.value = savedRows.value.map((r) => ({ ...r }))
}

const addRow = () => {
  rows.value.push({ fieldName: '', foreignIndexUid: '' })
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
    const cleanRows = cleaned(rows.value)
    await processTask(
      () => meili.httpRequest.put({ path: foreignKeysPath, body: cleanRows }) as Promise<EnqueuedTask>,
      {
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
      },
    )
  })
}
</script>

<i18n>
en:
  title: Foreign keys
  table:
    fieldName: Field name
    foreignIndex: Foreign index
  placeholders:
    fieldName: "e.g. actors"
    foreignIndex: Select an index
  actions:
    addForeignKey: Add foreign key
  emptyState: No foreign keys configured
  disabled:
    title: Experimental feature disabled
    text: Foreign keys require the "foreignKeys" experimental feature to be enabled on your instance.
    link: Enable it in experimental features
  unavailable:
    title: Not available
    text: Foreign keys require Meilisearch v1.42 or later.
  notice:
    title: Caution
    text: Updating foreign keys will re-index all documents in the index, which can take some time.
          Each referenced field name must be a filterable attribute. This is an experimental feature.
  toasts:
    success:
      title: Updating foreign keys
      pendingText: Please wait...
    texts:
      canceledTask: Task was canceled.
      failedTask: Task failed.
  confirmations:
    submit: Do you want to update your settings?
</i18n>
