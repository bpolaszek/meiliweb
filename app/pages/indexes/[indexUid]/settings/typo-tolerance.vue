<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3 class="inline-flex w-full items-start justify-between">
      <span class="inline-flex flex-col gap-1">
        <span class="text-xl font-semibold">{{ t('title') }}</span>
        <span class="text-sm italic text-gray-600">
          {{ t('description') }}
        </span>
      </span>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings#typo-tolerance" />
    </h3>

    <UniqueId as="section" v-slot="{ id }" class="flex items-center justify-between gap-2">
      <Label :for="id" class="flex items-center gap-2">
        <span>{{ t('labels.enabled') }}</span>
      </Label>
      <input v-model="typoTolerance!.enabled" autocomplete="off" type="checkbox" />
    </UniqueId>

    <UniqueId as="section" v-slot="{ id }" class="flex items-center justify-between gap-2">
      <Label :for="id" class="flex items-center gap-2">
        <span>{{ t('labels.minWordSizeForOneTypo') }}</span>
      </Label>
      <input
        :disabled="!typoTolerance!.enabled"
        v-model="typoTolerance!.minWordSizeForTypos!.oneTypo"
        autocomplete="off"
        type="number"
        class="form-input"
        min="0" />
    </UniqueId>

    <UniqueId as="section" v-slot="{ id }" class="flex items-center justify-between gap-2">
      <Label :for="id" class="flex items-center gap-2">
        <span>{{ t('labels.minWordSizeForTwoTypos') }}</span>
      </Label>
      <input
        :disabled="!typoTolerance!.enabled"
        v-model="typoTolerance!.minWordSizeForTypos!.twoTypos"
        autocomplete="off"
        type="number"
        class="form-input"
        min="0" />
    </UniqueId>

    <UniqueId v-slot="{ id }" as="div" class="col-span-8">
      <Label :for="id">{{ t('labels.disableOnWords') }}</Label>
      <SplitLinesTextarea v-model="typoTolerance!.disableOnWords!" class="h-20 w-full text-sm" />
    </UniqueId>

    <UniqueId v-slot="{ id }" as="div" class="col-span-8">
      <Label :for="id">{{ t('labels.disableOnAttributes') }}</Label>
      <SplitLinesTextarea v-model="typoTolerance!.disableOnAttributes!" class="h-20 w-full text-sm" />
    </UniqueId>

    <footer class="flex flex-col items-center justify-between sm:flex-row">
      <Button type="button" theme="primary" icon="mdi:bin" :disabled="loading" @click="resetToInitialValue()">
        {{ t('actions.resetTypoTolerance') }}
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
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import type { Task } from 'meilisearch'
import { useConfirmationDialog } from '#imports'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Label from '~/components/layout/forms/Label.vue'
import SplitLinesTextarea from '~/components/layout/forms/SplitLinesTextarea.vue'

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
const { value: typoTolerance, reset, modified } = resettableRef(await index.getTypoTolerance())
const self = reactive({ typoTolerance })

const submit = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.updateTypoTolerance.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => index.updateTypoTolerance(self.typoTolerance), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.typoTolerance)
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
    reset(self.typoTolerance)
  })
}
const resetToInitialValue = async () => {
  if (!(await confirm({ text: t('confirmations.reset') }))) {
    return
  }
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.clearTypoTolerance.title'),
  })
  toast.spawn()
  await processTask(() => index.resetTypoTolerance(), {
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
}
</script>

<i18n>
en:
  title: Typo Tolerance
  description: Typo tolerance helps users find relevant results even when their search queries contain spelling mistakes or typos. This setting allows you to configure the minimum word size for typos and disable typo tolerance for specific words or attributes.
  actions:
    resetTypoTolerance: Reset settings
  labels:
    enabled: Enable Typo Tolerance
    minWordSizeForOneTypo: Minimum word size for one typo
    minWordSizeForTwoTypos: Minimum word size for two typos
    disableOnWords: Disable on words
    disableOnAttributes: Disable on attributes
  toasts:
    updateTypoTolerance:
      title: Updating Typo Tolerance settings...
    clearTypoTolerance:
      title: Resetting Typo Tolerance settings...
  confirmations:
    submit: Submit changes?
    reset: Reset Typo Tolerance settings?
</i18n>
