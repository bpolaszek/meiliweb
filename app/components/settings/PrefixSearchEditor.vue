<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-2">
      <Label :for="id" class="flex items-center gap-2">
        <span>{{ t('labels.prefixSearch') }}</span>
        <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings#prefix-search" />
      </Label>
      <Select :id v-model="self.prefixSearch">
        <option value="disabled">
          {{ t('labels.disabled') }}
        </option>
        <option value="indexingTime">
          {{ t('labels.indexingTime') }}
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
import type { Index, PrefixSearch, Task } from 'meilisearch'
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

const initialPrefixSearch = await props.index.getPrefixSearch()
const { value: prefixSearch, reset, modified } = resettableRef(initialPrefixSearch)
const { loading, handle } = useFormSubmit({
  confirm: { text: t('confirmations.prefixSearch.text') },
})

const self = reactive({
  prefixSearch,
})

const submit = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.prefixSearch.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => props.index.updatePrefixSearch(self.prefixSearch as unknown as PrefixSearch), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.prefixSearch)
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
    reset(self.prefixSearch)
  })
}

const resetToInitialValue = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.prefixSearch.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => props.index.resetPrefixSearch(), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.prefixSearch)
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
    reset(self.prefixSearch)
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
    prefixSearch:
      text: Do you want to update your settings?
  toasts:
    prefixSearch:
      title: Updating prefix search...
  labels:
    prefixSearch: Prefix Search
    indexingTime: Indexing Time
    disabled: Disabled
</i18n>
