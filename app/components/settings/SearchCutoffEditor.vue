<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submitSearchCutoffMs()">
    <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-2">
      <Label :for="id" class="flex items-center gap-2">
        <span>{{ t('labels.searchCutoffMs') }}</span>
        <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings#get-search-cutoff" />
      </Label>
      <input v-model="searchCutoffMs" autofocus autocomplete="off" type="number" min="0" class="form-input" />
    </UniqueId>

    <footer class="flex flex-col items-center justify-between sm:flex-row">
      <Button size="small" type="button" :disabled="loading" @click="clearSearchCutoffMs()">
        {{ t('actions.clearSearchCutoffMs') }}
      </Button>
      <Buttons>
        <Button size="small" type="reset" :disabled="!modified || loading" />
        <Button size="small" type="submit" :disabled="!modified || loading" :loading="loading" />
      </Buttons>
    </footer>
  </form>
</template>

<script setup lang="ts">
import Button from '~/components/layout/forms/Button.vue'
import Label from '~/components/layout/forms/Label.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import { resettableRef } from '~/utils'
import { TaskError, useFormSubmit, useTask } from '~/composables'
import { TOAST_FAILURE, TOAST_SUCCESS, useToasts } from '~/stores'
import type { Index, Task } from 'meilisearch'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'

const emit = defineEmits<{
  (e: 'error', error: TaskError): void
}>()
type Props = {
  index: Index
}
const props = defineProps<Props>()
const { t } = useI18n()
const processTask = useTask()
const { createToast } = useToasts()

const initialSearchCutoffMs = await props.index.getSearchCutoffMs()
const { value: searchCutoffMs, reset, modified } = resettableRef(initialSearchCutoffMs as number | null)
const { loading, handle } = useFormSubmit({
  confirm: { text: t('confirmations.searchCutoffMs.text') },
})

const self = reactive({
  searchCutoffMs,
})

const submitSearchCutoffMs = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.searchCutoffMs.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => props.index.updateSearchCutoffMs(self.searchCutoffMs), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.searchCutoffMs)
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
  })
}

const clearSearchCutoffMs = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.searchCutoffMs.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => props.index.resetSearchCutoffMs(), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(null)
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
  })
}
</script>

<i18n>
en:
  confirmations:
    searchCutoffMs:
      text: Do you want to update your settings?
  toasts:
    searchCutoffMs:
      title: Updating Search Cutoff settings...
  labels:
    searchCutoffMs: Search cutoff (ms)
  actions:
    clearSearchCutoffMs: Clear search cutoff
</i18n>
