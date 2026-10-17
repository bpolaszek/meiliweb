<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3 class="inline-flex w-full items-start justify-between">
      <span class="inline-flex flex-col gap-1">
        <span class="text-xl font-semibold">{{ t('title') }}</span>
        <span class="text-sm text-gray-600 italic">
          {{ t('description') }}
        </span>
      </span>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings/update-embedders" />
    </h3>

    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      <span class="whitespace-pre-line">{{ errorMessage }}</span>
    </Alert>

    <EmbedderEntry
      v-for="(entry, position) of embedders"
      :key="position"
      v-model="embedders[position]"
      :initial="savedSettings.get(entry.name)"
      :features
      @remove="removeEmbedder(position)" />

    <div class="flex" :class="embedders.length > 0 ? 'justify-end' : 'justify-center py-16'">
      <Button size="small" theme="primary" type="button" icon="mdi:plus" @click="addEmbedder()">
        {{ t('actions.addEmbedder') }}
      </Button>
    </div>

    <footer class="flex flex-col items-center justify-between sm:flex-row">
      <Button
        type="button"
        theme="primary"
        icon="mdi:bin"
        :disabled="loading || 0 === saved.length"
        @click="resetToInitialValue()">
        {{ t('actions.clearEmbedders') }}
      </Button>
      <Buttons>
        <Button type="reset" :disabled="!modified || loading" />
        <Button type="submit" :disabled="!modified || loading" :loading="loading" />
      </Buttons>
    </footer>
  </form>
</template>

<script setup lang="ts">
import type { Task } from 'meilisearch'
import { TaskError, useFormSubmit, useMeiliClient, useTask } from '~/composables'
import Alert from '~/components/layout/Alert.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import EmbedderEntry from '~/components/settings/EmbedderEntry.vue'
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS, useConfirmationDialog, useToasts } from '~/stores'
import {
  buildEmbeddersPayload,
  createEmbedderFormSettings,
  DuplicateEmbedderNameError,
  InvalidEmbedderJsonError,
  parseEmbedders,
  resettableRef,
  type EmbedderFormEntry,
} from '~/utils'

const emit = defineEmits<{
  (e: 'error', error: TaskError): void
}>()
type Props = {
  indexUid: string
}
const props = defineProps<Props>()

const { t } = useI18n()
const meili = useMeiliClient()
const index = meili.index(props.indexUid)
const { loading, error, handle } = useFormSubmit({
  confirm: { text: t('confirmations.submit') },
})
const processTask = useTask()
const { createToast } = useToasts()
const { confirm } = useConfirmationDialog()

// Unknown when the key can't read experimental features: let Meilisearch be the judge then.
const enabledFeatures = (await meili.getExperimentalFeatures().catch(() => null)) as Record<string, boolean> | null
const features = {
  multimodal: enabledFeatures?.multimodal ?? true,
  compositeEmbedders: enabledFeatures?.compositeEmbedders ?? true,
}

const fetchEmbedders = async () => parseEmbedders(await index.getEmbedders())
// Embedders as saved on the instance: the payload only carries what differs from them.
const saved = shallowRef<EmbedderFormEntry[]>(await fetchEmbedders())
const savedSettings = computed(() => new Map(saved.value.map(({ name, settings }) => [name, settings])))
const { value: embedders, reset, modified } = resettableRef<EmbedderFormEntry[]>(saved.value)

const errorMessage = computed(() => {
  if (error.value instanceof InvalidEmbedderJsonError) {
    return t('errors.invalidJson', { embedder: error.value.embedder, field: error.value.field })
  }
  if (error.value instanceof DuplicateEmbedderNameError) {
    return t('errors.duplicateName', { embedder: error.value.embedder })
  }
  return error.value instanceof Error ? error.value.message : error.value
})

const addEmbedder = () => {
  const names = new Set(embedders.value.map(({ name }) => name))
  let name = 'default'
  for (let i = 2; names.has(name); i++) {
    name = `default-${i}`
  }
  embedders.value.push({ name, persisted: false, settings: createEmbedderFormSettings() })
}

const removeEmbedder = (position: number) => {
  embedders.value.splice(position, 1)
}

const reload = async () => {
  saved.value = await fetchEmbedders()
  reset(saved.value)
}

const submit = async () => {
  let payload: ReturnType<typeof buildEmbeddersPayload>
  try {
    // Validated before asking for confirmation
    payload = buildEmbeddersPayload(toRaw(embedders.value), saved.value)
  } catch (e) {
    error.value = e as Error
    return
  }
  await handle(async () => {
    const toast = createToast({
      ...TOAST_PLEASEWAIT(t),
      title: t('toasts.updateEmbedders.title'),
    })
    const task = await processTask(() => index.updateEmbedders(payload), {
      onSuccess: () => toast.update({ ...TOAST_SUCCESS(t) }),
      onCanceled: () => toast.update({ ...TOAST_FAILURE(t), text: t('toasts.texts.canceledTask') }),
      onFailure: (task: Task) => {
        toast.update({ ...TOAST_FAILURE(t), text: t('toasts.texts.failedTask') })
        emit('error', task.error as TaskError)
      },
    }).catch((e: Error) => {
      // The settings were rejected before any task got enqueued
      toast.update({ ...TOAST_FAILURE(t), text: e.message })
      throw e
    })
    if ('failed' === task.status) {
      throw (task as Task).error
    }
    await reload()
  })
}

const resetToInitialValue = async () => {
  if (!(await confirm({ text: t('confirmations.clear') }))) {
    return
  }
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.clearEmbedders.title'),
  })
  toast.spawn()
  await processTask(() => index.resetEmbedders(), {
    onSuccess: async () => {
      toast.update({ ...TOAST_SUCCESS(t) })
    },
    onCanceled: () =>
      toast.update({
        ...TOAST_FAILURE(t),
        text: t('toasts.texts.canceledTask'),
      }),
    onFailure: (task: Task) => {
      toast.update({
        ...TOAST_FAILURE(t),
        text: t('toasts.texts.failedTask'),
      })
      emit('error', task.error as TaskError)
    },
  })
  await reload()
}
</script>

<i18n>
en:
  title: Embedders
  description: Embedders turn documents and queries into vectors, enabling semantic and hybrid search.
  actions:
    addEmbedder: Add embedder
    clearEmbedders: Clear All Embedders
  toasts:
    updateEmbedders:
      title: Updating Embedders...
    clearEmbedders:
      title: Resetting Embedders...
  confirmations:
    submit: Submit changes?
    clear: Clear all embedders?
  errors:
    invalidJson: "The {field} of embedder {embedder} is not valid JSON."
    duplicateName: "Several embedders are named {embedder}."
</i18n>
