<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3
      class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('title') }}
      <DocumentationLink
        href="https://www.meilisearch.com/docs/reference/api/settings#displayed-attributes" />
    </h3>

    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      {{ error }}
    </Alert>

    <UniqueId as="div" v-slot="{ id }" class="space-y-1 *:block">
      <Label :for="id">{{ t('labels.displayedAttributes') }}</Label>
      <Textarea class="h-72 w-full" v-model="editableDisplayedAttributes" />
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
import { useFormSubmit, useTask } from '~/composables'
import { TOAST_FAILURE, TOAST_SUCCESS, useToasts } from '~/stores/toasts'
import Alert from '~/components/layout/Alert.vue'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()

const { t } = useI18n()
const meili = useMeiliClient()
const index = meili.index(props.indexUid)
const {
  value: displayedAttributes,
  reset,
  modified,
} = resettableRef(await index.getDisplayedAttributes())
const { loading, error, handle } = useFormSubmit({
  confirm: { text: t('confirmations.submit') },
})
const processTask = useTask()
const { createToast } = useToasts()
const self = reactive({ displayedAttributes })
const editableDisplayedAttributes = computed({
  get: () => self.displayedAttributes.join('\n'),
  set: (value) =>
    (self.displayedAttributes = value
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
    await processTask(
      () => index.updateDisplayedAttributes(self.displayedAttributes),
      {
        onSuccess: async () => {
          toast.update({ ...TOAST_SUCCESS(t) })
          reset(self.displayedAttributes)
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

useHead({
  title: `${t('title')} - ${index.uid}`,
})
</script>

<i18n>
en:
  title: Displayed attributes
  labels:
    displayedAttributes: Displayed attributes, separated by new lines
  toasts:
    success:
      title: Updating displayed attributes
      pendingText: Please wait...
      doneText: Done.
    error:
      title: Error while updating displayed attributes
      canceledText: Task was canceled.
      failedText: Task failed.
  confirmations:
    submit: Do you want to update your settings?
</i18n>
