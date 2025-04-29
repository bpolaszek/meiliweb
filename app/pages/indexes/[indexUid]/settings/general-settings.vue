<template>
  <section class="space-y-4">
    <h3 class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('titles.general') }}
    </h3>

    <Alert v-if="self.error" dismissable theme="danger" @close="self.error = null">
      <div class="flex items-start justify-between">
        <p class="grow">{{ self.error }}</p>
        <DocumentationLink v-if="self.error instanceof TaskError" :href="self.error.link" class="shrink-0 grow-0" />
      </div>
    </Alert>

    <PrimaryKeyEditor :index="index" @error="self.error = $event" />

    <div class="grid gap-4 md:grid-cols-2">
      <DistinctAttributeEditor :index="index" @error="self.error = $event" />

      <ProximityPrecisionEditor :index="index" @error="self.error = $event" />

      <PrefixSearchEditor v-if="satisfiesVersion('^1.12')" :index="index" @error="self.error = $event" />

      <FacetSearchEditor v-if="satisfiesVersion('^1.12')" :index="index" @error="self.error = $event" />
    </div>

    <h3 class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('titles.renameIndex') }}
    </h3>

    <IndexNameEditor :index-uid="indexUid" @error="self.error = $event" />

    <h3 class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('titles.duplicateIndex') }}
    </h3>

    <DuplicateIndexEditor :index-uid="indexUid" @error="self.error = $event" />

    <h3 class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('titles.dangerZone') }}
    </h3>

    <div class="flex items-center gap-2">
      <form @submit.prevent="dropIndex()">
        <Button type="submit" icon-on-right theme="primary" icon="oi:delete">
          {{ t('actions.dropIndex') }}
        </Button>
      </form>
      <form @submit.prevent="deleteAllDocuments()">
        <Button type="submit" icon-on-right theme="primary" icon="oi:delete">
          {{ t('actions.deleteAllDocuments') }}
        </Button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { TaskError, useFormSubmit, useMeiliClient, useTask } from '~/composables'
import { TOAST_FAILURE, TOAST_SUCCESS, useToasts } from '~/stores/toasts'
import Alert from '~/components/layout/Alert.vue'
import Button from '~/components/layout/forms/Button.vue'
import type { Task } from 'meilisearch'
import { promiseTimeout } from '@vueuse/core'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import { navigateTo } from '#imports'
import PrimaryKeyEditor from '~/components/settings/PrimaryKeyEditor.vue'
import DistinctAttributeEditor from '~/components/settings/DistinctAttributeEditor.vue'
import ProximityPrecisionEditor from '~/components/settings/ProximityPrecisionEditor.vue'
import IndexNameEditor from '~/components/settings/IndexNameEditor.vue'
import DuplicateIndexEditor from '~/components/settings/DuplicateIndexEditor.vue'
import PrefixSearchEditor from '~/components/settings/PrefixSearchEditor.vue'
import FacetSearchEditor from '~/components/settings/FacetSearchEditor.vue'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const meili = useMeiliClient()
const index = meili.index(props.indexUid)
const { satisfiesVersion } = useVersion()

const { handle: handleIndexDrop } = useFormSubmit({
  confirm: {
    title: t('confirmations.dropIndex.title', { index: index.uid }),
    text: t('confirmations.dropIndex.text'),
    acceptButtonText: t('confirmations.dropIndex.acceptButtonText'),
  },
})
const { handle: handleDeleteAllDocuments } = useFormSubmit({
  confirm: {
    title: t('confirmations.deleteAllDocuments.title', { index: index.uid }),
    text: t('confirmations.deleteAllDocuments.text'),
    acceptButtonText: t('confirmations.deleteAllDocuments.acceptButtonText'),
  },
})
const processTask = useTask()
const { createToast } = useToasts()
const self = reactive({
  error: null as Error | null,
})

const dropIndex = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.dropIndex.title'),
  })
  await handleIndexDrop(async () => {
    toast.spawn()
    await processTask(() => meili.deleteIndex(index.uid), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        await promiseTimeout(500)
        navigateTo('/indexes', { replace: true })
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
        self.error = task.error as TaskError
      },
    })
  })
}

const deleteAllDocuments = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.deleteAllDocuments.title'),
  })
  await handleDeleteAllDocuments(async () => {
    toast.spawn()
    await processTask(() => meili.index(index.uid).deleteAllDocuments(), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        await promiseTimeout(500)
        navigateTo(`/indexes/${index.uid}/documents`, { replace: true })
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
        self.error = task.error as TaskError
      },
    })
  })
}

useHead({
  title: `${t('titles.general')} - ${props.indexUid}`,
})
</script>

<i18n>
en:
  titles:
    general: General settings
    duplicateIndex: Duplicate index
    renameIndex: Rename index
    dangerZone: Danger Zone
  confirmations:
    dropIndex:
      title: "Drop `{index}`?"
      text: "CAUTION: This action cannot be reversed!"
      acceptButtonText: Yes, delete forever
    deleteAllDocuments:
      title: "Delete all documents from `{index}`?"
      text: "CAUTION: This action cannot be reversed!"
      acceptButtonText: Yes, delete forever
  toasts:
    dropIndex:
      title: Deleting index...
    deleteAllDocuments:
      title: Deleting documents...
  actions:
    dropIndex: Delete index
    deleteAllDocuments: Delete all documents
</i18n>
