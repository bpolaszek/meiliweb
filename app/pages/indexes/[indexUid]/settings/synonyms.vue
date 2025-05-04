<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3 class="inline-flex w-full items-start justify-between">
      <span class="inline-flex flex-col gap-1">
        <span class="text-xl font-semibold">{{ t('title') }}</span>
        <span class="text-sm italic text-gray-600">
          {{ t('description') }}
        </span>
      </span>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings#synonyms" />
    </h3>

    <template v-for="synonym of synonyms">
      <SynonymEntry :synonym="synonym" />
    </template>

    <div class="flex justify-end">
      <Button size="small" theme="primary" type="button" icon="mdi:plus" @click="addSynonym()">
        {{ t('actions.addSynonym') }}
      </Button>
    </div>

    <footer class="flex flex-col items-center justify-between sm:flex-row">
      <Button
        type="button"
        theme="primary"
        icon="mdi:bin"
        :disabled="loading || 0 === synonyms.length"
        @click="resetToInitialValue()">
        {{ t('actions.clearSynonyms') }}
      </Button>
      <Buttons>
        <Button type="reset" :disabled="!modified || loading" />
        <Button type="submit" :disabled="!modified || loading" :loading="loading" />
      </Buttons>
    </footer>
  </form>
</template>

<script setup lang="ts">
import { TaskError, useFormSubmit, useTask } from '~/composables'
import { TOAST_FAILURE, TOAST_SUCCESS, useToasts } from '~/stores'
import { resettableRef } from '~/utils'
import SynonymEntry from '~/components/settings/SynonymEntry.vue'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import type { Task } from 'meilisearch'
import { useConfirmationDialog } from '#imports'
import { watchImmediate } from '@vueuse/core'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'

const emit = defineEmits<{
  (e: 'error', error: TaskError): void
}>()
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
const { confirm } = useConfirmationDialog()
const { value: synonyms, reset, modified } = resettableRef(Object.entries(await index.getSynonyms()))
const self = reactive({ synonyms })
const addSynonym = () => {
  self.synonyms.push(['', ['']])
}

const submit = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.updateSynonyms.title'),
  })
  await handle(async () => {
    toast.spawn()
    const synonymEntries = toRaw(self.synonyms).filter(
      ([mainWord, [firstSynonym]]) => mainWord.trim().length > 0 && firstSynonym?.trim()?.length > 0,
    )
    const synonymsObject: any = Object.fromEntries(synonymEntries)
    await processTask(() => index.updateSynonyms(synonymsObject), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(synonymEntries)
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
    reset(synonymEntries)
  })
}
const resetToInitialValue = async () => {
  if (!(await confirm({ text: t('confirmations.clear') }))) {
    return
  }
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.clearSynonyms.title'),
  })
  toast.spawn()
  await processTask(() => index.resetSynonyms(), {
    onSuccess: async () => {
      toast.update({ ...TOAST_SUCCESS(t) })
      reset([])
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
  reset([])
}

watchImmediate(synonyms, (synonyms) => {
  if (0 === synonyms.length) {
    addSynonym()
  }
})
</script>

<i18n>
en:
  title: Synonyms
  description: A synonym in Meilisearch is considered equal to its associated word for the purposes of calculating search results.
  actions:
    addSynonym: Add entry
    clearSynonyms: Clear All Synonyms
  toasts:
    updateSynonyms:
      title: Updating Synonyms...
    clearSynonyms:
      title: Resetting Synonyms...
  confirmations:
    submit: Submit changes?
    clear: Clear all synonyms?
</i18n>
