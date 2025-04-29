<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-2">
      <Label :for="id" class="flex items-center gap-2">
        <span>{{ t('labels.facetSearch') }}</span>
        <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings#facet-search" />
      </Label>
      <Select :id v-model="self.facetSearch">
        <option :value="false">
          {{ t('labels.disabled') }}
        </option>
        <option :value="true">
          {{ t('labels.enabled') }}
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

const initialFacetSearch = await props.index.getFacetSearch()
const { value: facetSearch, reset, modified } = resettableRef(initialFacetSearch)
const { loading, handle } = useFormSubmit({
  confirm: { text: t('confirmations.facetSearch.text') },
})

const self = reactive({
  facetSearch,
})

const submit = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.facetSearch.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => props.index.updateFacetSearch(self.facetSearch), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.facetSearch)
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
    reset(self.facetSearch)
  })
}

const resetToInitialValue = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.facetSearch.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => props.index.resetFacetSearch(), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.facetSearch)
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
    reset(self.facetSearch)
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
    facetSearch:
      text: Do you want to update your settings?
  toasts:
    facetSearch:
      title: Updating facet search...
  labels:
    facetSearch: Facet Search
    enabled: Enabled
    disabled: Disabled
</i18n>
