<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submitPrimaryKey()">
    <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-2">
      <Label required :for="id">{{ t('labels.primaryKey') }}</Label>
      <input v-model="primaryKey" required autofocus autocomplete="off" type="text" class="form-input" />
      <p class="text-xs italic text-gray-600">
        {{ t('notices.primaryKey.text') }}
      </p>
    </UniqueId>

    <footer class="flex flex-col items-center justify-end sm:flex-row">
      <Buttons>
        <Button type="reset" :disabled="!modified || loading" />
        <Button type="submit" :disabled="!modified || loading" :loading="loading" />
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

const emit = defineEmits<{
  (e: 'error', error: TaskError): void
}>()
type Props = {
  index: Index
  initialPrimaryKey: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const processTask = useTask()
const { createToast } = useToasts()

const { value: primaryKey, reset, modified } = resettableRef(props.initialPrimaryKey as string)
const { loading, handle } = useFormSubmit({
  confirm: { text: t('confirmations.primaryKey.text') },
})

const self = reactive({
  primaryKey,
})

const submitPrimaryKey = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.primaryKey.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => props.index.update({ primaryKey: self.primaryKey }), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.primaryKey)
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
    primaryKey:
      text: Do you want to update your settings?
  toasts:
    primaryKey:
      title: Updating primary key...
  labels:
    primaryKey: Primary Key
  notices:
    primaryKey:
      text: You can freely update the primary key of an index as long as it contains no documents. To change the primary key of an index that already contains documents, you must first delete all documents in that index. You may then change the primary key and index your dataset again.
</i18n>
