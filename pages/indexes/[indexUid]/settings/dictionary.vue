<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3
      class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('title') }}
      <DocumentationLink
        href="https://www.meilisearch.com/docs/reference/api/settings#dictionary" />
    </h3>

    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      {{ error }}
    </Alert>

    <UniqueId as="div" v-slot="{ id }" class="space-y-1 *:block">
      <Label :for="id">{{ t('labels.dictionaryWords') }}</Label>
      <Textarea class="h-72 w-full" v-model="editableDictionary" />
    </UniqueId>
    <footer class="flex flex-col items-center justify-end sm:flex-row">
      <Buttons>
        <Button type="reset" :disabled="!modified || loading" />
        <Button type="submit" :disabled="!modified || loading" :loading />
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
const {
  value: dictionary,
  reset,
  modified,
} = resettableRef(await index.getDictionary())
const self = reactive({ dictionary })
const editableDictionary = computed({
  get: () => self.dictionary.join('\n'),
  set: (value) =>
    (self.dictionary = value
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
    await processTask(() => index.updateDictionary(self.dictionary), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.dictionary)
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
  title: Dictionary
  labels:
    dictionaryWords: Dictionary words, separated by new lines
  toasts:
    success:
      title: Updating dictionary
      pendingText: Please wait...
      doneText: Done.
    error:
      title: Error while updating dictionary
      canceledText: Task was canceled.
      failedText: Task failed.
  confirmations:
    submit: Do you want to update your dictionary?
</i18n>
