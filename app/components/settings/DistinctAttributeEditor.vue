<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-2">
      <Label :for="id" class="flex items-center gap-2">
        <span>{{ t('labels.distinctAttribute') }}</span>
        <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings#distinct-attribute" />
      </Label>
      <input v-model="self.distinctAttribute" autofocus autocomplete="off" type="text" class="form-input" />
    </UniqueId>

    <footer class="flex flex-col items-center justify-between sm:flex-row">
      <Button size="small" type="button" :disabled="loading" @click="resetToInitialValue()">
        {{ t('buttons.reset') }}
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
}
const props = defineProps<Props>()
const { t } = useI18n()
const processTask = useTask()
const { createToast } = useToasts()
const initialDistinctAttribute = await props.index.getDistinctAttribute()
const { value: distinctAttribute, reset, modified } = resettableRef(initialDistinctAttribute as string)
const { loading, handle } = useFormSubmit({
  confirm: { text: t('confirmations.distinctAttribute.text') },
})

const self = reactive({
  distinctAttribute,
})

const submit = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.distinctAttribute.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => props.index.updateDistinctAttribute(self.distinctAttribute), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.distinctAttribute)
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

const resetToInitialValue = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.distinctAttribute.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => props.index.resetDistinctAttribute(), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.distinctAttribute)
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
</i18n>
