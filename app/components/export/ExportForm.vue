<template>
  <form class="max-w-2xl space-y-6" @submit.prevent="submit()">
    <p class="inline-flex w-full items-center justify-end">
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/export/export-to-a-remote-meilisearch" />
    </p>

    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      {{ error }}
    </Alert>

    <UniqueId as="section" v-slot="{ id }" class="space-y-1">
      <Label :for="id" required>{{ t('labels.url') }}</Label>
      <input
        :id
        v-model="form.url"
        type="url"
        required
        autofocus
        list="export-destinations"
        :placeholder="t('placeholders.url')"
        class="form-input w-full" />
      <datalist id="export-destinations">
        <option v-for="destination of destinations" :key="destination" :value="destination" />
      </datalist>
      <div v-if="destinations.length > 0" class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-light text-gray-500 italic">{{ t('hints.recentDestinations') }}</span>
        <Button
          v-for="destination of destinations"
          :key="destination"
          type="button"
          theme="secondary"
          size="small"
          @click="form.url = destination">
          {{ destination }}
        </Button>
      </div>
    </UniqueId>

    <UniqueId as="section" v-slot="{ id }" class="space-y-1">
      <Label :for="id">{{ t('labels.apiKey') }}</Label>
      <input
        :id
        v-model="form.apiKey"
        type="password"
        autocomplete="off"
        :placeholder="t('placeholders.apiKey')"
        class="form-input w-full" />
      <p class="text-xs font-light text-gray-500 italic">{{ t('hints.apiKeyNotStored') }}</p>
    </UniqueId>

    <UniqueId as="section" v-slot="{ id }" class="space-y-1">
      <Label :for="id">{{ t('labels.payloadSize') }}</Label>
      <input
        :id
        v-model="form.payloadSize"
        type="text"
        :placeholder="t('placeholders.payloadSize')"
        class="form-input w-full" />
    </UniqueId>

    <section v-if="!indexUid" class="space-y-1">
      <Label>{{ t('labels.indexes') }}</Label>
      <UInputMenu
        v-model="form.selectedIndexes"
        multiple
        open-on-click
        open-on-focus
        :items="availableIndexes"
        :placeholder="t('placeholders.indexes')"
        class="block w-full" />
      <p class="text-xs font-light text-gray-500 italic">{{ t('hints.allIndexesByDefault') }}</p>
    </section>

    <UniqueId v-else as="section" v-slot="{ id }" class="space-y-1">
      <Label :for="id">{{ t('labels.filter') }}</Label>
      <input :id v-model="form.filter" type="text" :placeholder="t('placeholders.filter')" class="form-input w-full" />
      <p class="text-xs font-light text-gray-500 italic">{{ t('hints.filter') }}</p>
    </UniqueId>

    <div class="flex items-center justify-between">
      <Label>{{ t('labels.overrideSettings') }}</Label>
      <USwitch v-model="form.overrideSettings" />
    </div>

    <div class="flex items-center justify-between">
      <Label>{{ t('labels.rememberDestination') }}</Label>
      <USwitch v-model="form.rememberDestination" />
    </div>

    <footer class="flex justify-end">
      <Button type="submit" theme="primary" icon="heroicons:arrow-up-tray" :loading>
        {{ t('actions.export') }}
      </Button>
    </footer>
  </form>
</template>

<script setup lang="ts">
import Alert from '~/components/layout/Alert.vue'
import Button from '~/components/layout/forms/Button.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Label from '~/components/layout/forms/Label.vue'
import UniqueId from '~/components/UniqueId.vue'
import {
  useExport,
  useExportDestinations,
  useFormSubmit,
  useMeiliClient,
  useTask,
  type ExportPayload,
} from '~/composables'
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS, useConfirmationDialog, useToasts } from '~/stores'

type Props = {
  /** Scope the export to a single index. When omitted, the user picks indexes (or exports all of them). */
  indexUid?: string
}
const props = defineProps<Props>()

const { t } = useI18n()
const meili = useMeiliClient()
const { exportToRemote } = useExport()
const { destinations, remember } = useExportDestinations()
const { confirm } = useConfirmationDialog()
const { createToast } = useToasts()
const processTask = useTask()
const { loading, error, handle } = useFormSubmit()

const form = reactive({
  url: '',
  apiKey: '',
  payloadSize: '',
  selectedIndexes: [] as string[],
  filter: '',
  overrideSettings: false,
  rememberDestination: false,
})

// Only needed for the global (non index-scoped) form, to let the user pick indexes.
const availableIndexes = ref<string[]>([])
if (!props.indexUid) {
  const { results } = await meili.getIndexes({ limit: 1000 })
  availableIndexes.value = results.map((index) => index.uid)
}

const buildPayload = (): ExportPayload => {
  const payload: ExportPayload = { url: form.url.trim() }
  if (form.apiKey) payload.apiKey = form.apiKey
  if (form.payloadSize.trim()) payload.payloadSize = form.payloadSize.trim()

  const commonOptions = form.overrideSettings ? { overrideSettings: true } : {}
  if (props.indexUid) {
    payload.indexes = {
      [props.indexUid]: { ...commonOptions, ...(form.filter.trim() ? { filter: form.filter.trim() } : {}) },
    }
  } else if (form.selectedIndexes.length > 0) {
    payload.indexes = Object.fromEntries(form.selectedIndexes.map((uid) => [uid, commonOptions]))
  } else {
    payload.indexes = { '*': commonOptions }
  }
  return payload
}

const submit = () =>
  handle(async () => {
    const destination = form.url.trim()
    const confirmed = await confirm({
      title: t('confirmations.export.title'),
      text: t('confirmations.export.text', { url: destination }),
      acceptButtonText: t('confirmations.export.acceptButtonText'),
    })
    if (!confirmed) {
      return
    }

    if (form.rememberDestination) {
      remember(destination)
    }

    const toast = createToast({
      ...TOAST_PLEASEWAIT(t),
      title: t('toasts.exporting', { url: destination }),
    })
    try {
      await processTask(() => exportToRemote(buildPayload()), {
        onSuccess: () => toast.update({ ...TOAST_SUCCESS(t) }),
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
    } catch (e) {
      // A synchronous rejection (e.g. a 400 from `POST /export` on a malformed `payloadSize`) happens
      // before any task exists, so none of the `processTask` callbacks above ever fire. Without this,
      // the "please wait" toast is left stuck forever while the inline error banner (via `handle`) shows
      // the real failure.
      toast.update({ ...TOAST_FAILURE(t), text: t('toasts.texts.failedTask') })
      throw e
    }
  })
</script>

<i18n>
en:
  labels:
    url: Destination URL
    apiKey: Destination API key
    payloadSize: Payload size (optional)
    indexes: Indexes
    filter: Filter (optional)
    overrideSettings: Override settings on destination
    rememberDestination: Remember this destination
  placeholders:
    url: https://ms-1234.example.com
    apiKey: Leave empty if not required
    payloadSize: e.g. 20MiB
    indexes: All indexes
    filter: "genres = adventure AND release_date > 1577836800"
  hints:
    apiKeyNotStored: Only the destination URL may be remembered below. The API key is never stored and must be
                      re-entered every time.
    allIndexesByDefault: Leave empty to export every index.
    filter: Only documents matching this filter expression will be exported.
    recentDestinations: 'Recently used:'
  actions:
    export: Export
  confirmations:
    export:
      title: Export to a remote instance?
      text: "This will export data to {url}. Make sure you trust this destination."
      acceptButtonText: Yes, export
  toasts:
    exporting: 'Exporting to {url}...'
</i18n>
