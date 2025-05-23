<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-2">
      <Label :for="id" class="flex items-center gap-2">
        <span>{{ t('labels.proximityPrecision') }}</span>
        <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings#proximity-precision" />
      </Label>
      <Select :id v-model="self.proximityPrecision">
        <option value="byAttribute">
          {{ t('labels.proximityPrecisionByAttribute') }}
        </option>
        <option value="byWord">
          {{ t('labels.proximityPrecisionByWord') }}
        </option>
      </Select>
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
import Select from '~/components/layout/forms/Select.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import { TaskError, useFormSubmit, useTask } from '~/composables'
import type { Index, ProximityPrecision, Task } from 'meilisearch'
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

const initialProximityPrecision = await props.index.getProximityPrecision()
const { value: proximityPrecision, reset, modified } = resettableRef(initialProximityPrecision as string)
const { loading, handle } = useFormSubmit({
  confirm: { text: t('confirmations.proximityPrecision.text') },
})

const self = reactive({
  proximityPrecision,
})

const submit = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.proximityPrecision.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(
      () => props.index.updateProximityPrecision(self.proximityPrecision as unknown as ProximityPrecision),
      {
        onSuccess: async () => {
          toast.update({ ...TOAST_SUCCESS(t) })
          reset(self.proximityPrecision)
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
      },
    )
    reset(self.proximityPrecision)
  })
}

const resetToInitialValue = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.proximityPrecision.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => props.index.resetProximityPrecision(), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.proximityPrecision)
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
    reset(self.proximityPrecision)
  })
}
</script>
<i18n>
en:
  confirmations:
    primaryKey:
      text: Do you want to update your settings?
    distinctAttribute:
      text: Do you want to update your settings?
    proximityPrecision:
      text: Do you want to update your settings?
  toasts:
    proximityPrecision:
      title: Updating proximity precision...
  labels:
    proximityPrecision: Proximity Precision
    proximityPrecisionByWord: By Word
    proximityPrecisionByAttribute: By Attribute
</i18n>
