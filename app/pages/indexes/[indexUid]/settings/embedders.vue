<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3 class="inline-flex w-full items-start justify-between">
      <span class="inline-flex flex-col gap-1">
        <span class="text-xl font-semibold">{{ t('title') }}</span>
        <span class="text-sm italic text-gray-600">
          {{ t('description') }}
        </span>
      </span>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings#embedders" />
    </h3>

    <template v-for="embedder of embedders">
      <EmbedderEntry :embedder="embedder as [string, Embedder]" />
    </template>

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
        :disabled="loading || 0 === embedders.length"
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
import { TaskError, useFormSubmit, useTask } from '~/composables'
import { TOAST_FAILURE, TOAST_SUCCESS, useToasts } from '~/stores'
import { resettableRef } from '~/utils'
import EmbedderEntry from '~/components/settings/EmbedderEntry.vue'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import type { Embedder, Embedders, RestEmbedder, Task } from 'meilisearch'
import { useConfirmationDialog } from '#imports'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'

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
const parseEmbedders = (embedders: Embedders) =>
  Object.entries(embedders ?? {}).map(([name, embedder]) => {
    const request = JSON.stringify((embedder as RestEmbedder).request ?? {}, null, 2)
    const response = JSON.stringify((embedder as RestEmbedder).response ?? {}, null, 2)
    const headers = JSON.stringify((embedder as RestEmbedder).headers ?? {}, null, 2)
    return [
      name,
      {
        ...embedder,
        request,
        response,
        headers,
      },
    ]
  })
const normalizeEmbedders = (embedders: [string, Embedder][]) =>
  Object.fromEntries(
    embedders.map(([name, embedder]) => {
      embedder = structuredClone(embedder)!
      if ('rest' == embedder.source) {
        embedder.request = JSON.parse((embedder as any).request as string)
        embedder.response = JSON.parse((embedder as any).response as string)
        embedder.headers = JSON.parse((embedder as any).headers as string)
      } else {
        // @ts-ignore
        delete embedder['request']
        // @ts-ignore
        delete embedder['response']
        // @ts-ignore
        delete embedder['headers']
      }
      for (const key in embedder) {
        if ((embedder as any)[key] === '') {
          // @ts-ignore
          delete embedder[key]
        }
      }
      return [name, embedder]
    }),
  )
const { value: embedders, reset, modified } = resettableRef(parseEmbedders(await index.getEmbedders()))
const self = reactive({ embedders })
const addEmbedder = () => {
  self.embedders.push([
    'default',
    {
      source: 'rest',
      url: '',
      apiKey: '',
      // @ts-ignore
      model: '',
      documentTemplate: '',
      documentTemplateMaxBytes: undefined,
      dimensions: undefined,
      // @ts-ignore
      request: '{}',
      // @ts-ignore
      response: '{}',
      // @ts-ignore
      headers: '{}',
      binaryQuantized: false,
    },
  ])
}

const submit = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    title: t('toasts.updateEmbedders.title'),
  })
  try {
    const embedderEntries = toRaw(self.embedders)
    const embeddersObject: any = normalizeEmbedders(embedderEntries as [string, Embedder][])
    await handle(async () => {
      await processTask(() => index.updateEmbedders(embeddersObject), {
        onSuccess: async () => {
          toast.update({ ...TOAST_SUCCESS(t) })
          reset(embedderEntries)
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
      reset(embedderEntries)
    })
  } catch (e) {
    toast.update({ ...TOAST_FAILURE(t), text: (e as Error).message })
    return
  }
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
      reset([])
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
  reset([])
}
</script>

<i18n>
en:
  title: Embedders
  description: A embedder in Meilisearch is considered equal to its associated word for the purposes of calculating search results.
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
</i18n>
