<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3
      class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('title') }}
      <DocumentationLink
        href="https://www.meilisearch.com/docs/reference/api/settings#searchable-attributes" />
    </h3>

    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      {{ error }}
    </Alert>

    <Alert theme="warning" :title="t('notice.title')">
      {{ t('notice.text') }}
    </Alert>

    <UniqueId as="div" v-slot="{ id }" class="space-y-1 *:block">
      <Label :for="id">{{ t('labels.searchableAttributes') }}</Label>
      <Textarea class="h-72 w-full" v-model="editableSearchableAttributes" />
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
const client = useMeiliClient()
const index = client.index(props.indexUid)
const {
  value: searchableAttributes,
  reset,
  modified,
} = resettableRef(await index.getSearchableAttributes())
const { loading, error, handle } = useFormSubmit({
  confirm: { text: t('confirmations.submit') },
})
const processTask = useTask()
const { createToast } = useToasts()
const self = reactive({ searchableAttributes })
const editableSearchableAttributes = computed({
  get: () => self.searchableAttributes.join('\n'),
  set: (value) =>
    (self.searchableAttributes = value
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
      () => index.updateSearchableAttributes(self.searchableAttributes),
      {
        onSuccess: async () => {
          toast.update({ ...TOAST_SUCCESS(t) })
          reset(self.searchableAttributes)
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
  title: Searchable attributes
  labels:
    searchableAttributes: Searchable attributes, separated by new lines
  toasts:
    success:
      title: Updating searchable attributes
      pendingText: Please wait...
      doneText: Done.
    error:
      title: Error while updating searchable attributes
      canceledText: Task was canceled.
      failedText: Task failed.
  confirmations:
    submit: Do you want to update your settings?
  notice:
    title: Caution
    text: Updating searchable attributes will re-index all documents in the index, which can take some time.
          We recommend updating your index settings first and then adding documents as this reduces RAM consumption.
</i18n>
