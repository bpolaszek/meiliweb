<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3 class="inline-flex w-full items-start justify-between">
      <span class="inline-flex flex-col gap-1">
        <span class="text-xl font-semibold">{{ t('title') }}</span>
        <span class="text-sm italic text-gray-600">
          {{ t('description') }}
        </span>
      </span>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings#stop-words" />
    </h3>

    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      {{ error }}
    </Alert>

    <Alert theme="warning" :title="t('notice.title')">
      {{ t('notice.text') }}
    </Alert>

    <UniqueId as="div" v-slot="{ id }" class="space-y-1 *:block">
      <Label :for="id">{{ t('labels.stopWords') }}</Label>
      <Textarea class="h-72 w-full" v-model="editableStopWords" />
    </UniqueId>
    <footer class="flex flex-col items-center justify-between sm:flex-row">
      <Button type="button" :disabled="loading" @click="clearStopWords()">
        {{ t('buttons.reset') }}
      </Button>
      <Buttons>
        <Button type="reset" :disabled="!modified || loading" />
        <Button type="submit" :disabled="!modified || loading" :loading="loading" />
      </Buttons>
    </footer>
  </form>
</template>

<script setup lang="ts">
import Label from '~/components/layout/forms/Label.vue'
import Textarea from '~/components/layout/forms/Textarea.vue'
import UniqueId from '~/components/UniqueId.vue'
import Button from '~/components/layout/forms/Button.vue'
import { resettableRef } from '~/utils'
import Buttons from '~/components/layout/forms/Buttons.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import { TOAST_FAILURE, TOAST_SUCCESS, useToasts } from '~/stores/toasts'
import { useFormSubmit, useTask } from '~/composables'
import Alert from '~/components/layout/Alert.vue'

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
const { value: stopWords, reset, modified } = resettableRef(await index.getStopWords())
const self = reactive({ stopWords })
const editableStopWords = computed({
  get: () => self.stopWords.join('\n'),
  set: (value) =>
    (self.stopWords = value
      .split('\n')
      .map((value: string) => value.trim())
      .filter((value: string) => value.length > 0)),
})

const submit = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.success.title'),
    text: t('toasts.success.pendingText'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => index.updateStopWords(self.stopWords), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.stopWords)
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

const clearStopWords = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.success.title'),
    text: t('toasts.success.pendingText'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => index.resetStopWords(), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset([])
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
  title: Stop Words
  description: Words added to the Stop Words list are ignored in future search queries.
  labels:
    stopWords: Stop Words, separated by new lines
  toasts:
    success:
      title: Updating Stop Words
      pendingText: Please wait...
      doneText: Done.
    error:
      title: Error while updating Stop Words
      canceledText: Task was canceled.
      failedText: Task failed.
  confirmations:
    submit: Do you want to update your Stop Words?
  notice:
    title: Caution
    text: Updating stop words will re-index all documents in the index, which can take some time. We recommend updating your index settings first and then adding documents as this reduces RAM consumption.
</i18n>
