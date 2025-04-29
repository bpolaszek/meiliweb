<template>
  <form class="space-y-4" @reset.prevent="resetDistinctAttribute()" @submit.prevent="submitDistinctAttribute()">
    <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-2">
      <Label :for="id" class="flex items-center gap-2">
        <span>{{ t('labels.distinctAttribute') }}</span>
        <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings#distinct-attribute" />
      </Label>
      <input v-model="self.distinctAttribute" autofocus autocomplete="off" type="text" class="form-input" />
      <p class="text-xs italic text-gray-600">
        {{ t('notices.distinctAttribute.text') }}
      </p>
    </UniqueId>

    <footer class="flex flex-col items-center justify-end sm:flex-row">
      <Buttons>
        <Button type="reset" :disabled="!isDistinctAttributeModified || isDistinctAttributeLoading" />
        <Button
          type="submit"
          :disabled="!isDistinctAttributeModified || isDistinctAttributeLoading"
          :loading="isDistinctAttributeLoading" />
      </Buttons>
    </footer>
  </form>
</template>

<script setup lang="ts">
import Button from '~/components/layout/forms/Button.vue'
import Label from '~/components/layout/forms/Label.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import { TaskError, useFormSubmit, useTask } from '~/composables'
import type { Index, Task } from 'meilisearch'
import { TOAST_FAILURE, TOAST_SUCCESS, useToasts } from '~/stores'
import { resettableRef } from '~/utils'

const emit = defineEmits<{
  (e: 'error', error: TaskError): void
}>()
type Props = {
  index: Index
  initialDistinctAttribute: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const processTask = useTask()
const { createToast } = useToasts()

const {
  value: distinctAttribute,
  reset: resetDistinctAttribute,
  modified: isDistinctAttributeModified,
} = resettableRef(props.initialDistinctAttribute as string)
const { loading: isDistinctAttributeLoading, handle: handleDistinctAttribute } = useFormSubmit({
  confirm: { text: t('confirmations.distinctAttribute.text') },
})

const self = reactive({
  distinctAttribute,
})

const submitDistinctAttribute = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.distinctAttribute.title'),
    text: t('toasts.distinctAttribute.pendingText'),
  })
  await handleDistinctAttribute(async () => {
    toast.spawn()
    await processTask(() => props.index.updateDistinctAttribute(self.distinctAttribute), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        resetDistinctAttribute(self.distinctAttribute)
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
    distinctAttribute:
      text: Do you want to update your settings?
  toasts:
    distinctAttribute:
      title: Updating distinct attribute...
  labels:
    distinctAttribute: Distinct Attribute
  notices:
    distinctAttribute:
      text: Updating distinct attributes will re-index all documents in the index, which can take some time. We recommend updating your index settings first and then adding documents as this reduces RAM consumption.
</i18n>
