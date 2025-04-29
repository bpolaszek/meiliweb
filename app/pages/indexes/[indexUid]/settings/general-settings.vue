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

    <PrimaryKeyEditor :index="index" :initial-primary-key="initialPrimaryKey!" @error="self.error = $event" />

    <DistinctAttributeEditor
      :index="index"
      :initial-distinct-attribute="initialDistinctAttribute!"
      @error="self.error = $event" />

    <ProximityPrecisionEditor
      :index="index"
      :initial-proximity-precision="initialProximityPrecision!"
      @error="self.error = $event" />

    <h3 class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('titles.renameIndex') }}
    </h3>

    <IndexNameEditor :index-uid="indexUid" @error="self.error = $event" />

    <h3 class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('titles.duplicateIndex') }}
    </h3>

    <form @submit.prevent="duplicateIndex()" class="space-y-4">
      <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.duplicateIndexUid') }}</Label>
        <input v-model="self.duplicateIndexUid" required autofocus autocomplete="off" type="text" class="form-input" />
        <p class="text-xs italic text-gray-600">
          {{ t('notices.duplicateIndex.text') }}
        </p>
      </UniqueId>

      <div class="flex justify-end">
        <Button
          type="submit"
          :loading="self.isDuplicating"
          icon-on-right
          theme="primary"
          icon="heroicons:document-duplicate">
          {{ t('actions.duplicateIndex') }}
        </Button>
      </div>
    </form>

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
import { TaskError, useFormSubmit, useIndexOperations, useMeiliClient, useTask } from '~/composables'
import { TOAST_FAILURE, TOAST_SUCCESS, useToasts } from '~/stores/toasts'
import Alert from '~/components/layout/Alert.vue'
import Button from '~/components/layout/forms/Button.vue'
import type { Task } from 'meilisearch'
import { promiseTimeout } from '@vueuse/core'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Label from '~/components/layout/forms/Label.vue'
import { navigateTo } from '#imports'
import PrimaryKeyEditor from '~/components/settings/PrimaryKeyEditor.vue'
import DistinctAttributeEditor from '~/components/settings/DistinctAttributeEditor.vue'
import ProximityPrecisionEditor from '~/components/settings/ProximityPrecisionEditor.vue'
import IndexNameEditor from '~/components/settings/IndexNameEditor.vue'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const meili = useMeiliClient()
const { confirm } = useConfirmationDialog()
const index = meili.index(props.indexUid)

const [initialPrimaryKey, initialDistinctAttribute, initialProximityPrecision] = await Promise.all([
  index.fetchPrimaryKey(),
  index.getDistinctAttribute(),
  index.getProximityPrecision(),
])

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
  duplicateIndexUid: ref(`${props.indexUid}-copy`),
  renameIndexUid: ref(`${props.indexUid}-new`),
  isDuplicating: false,
  isRenaming: false,
})

const { duplicateIndex: doDuplicateIndex } = useIndexOperations()
const duplicateIndex = async () => {
  if (!(await confirm({ text: t('confirmations.duplicateIndex.text') }))) {
    return
  }
  try {
    const newIndexUid = await doDuplicateIndex(props.indexUid, {
      onStart: () => (self.isDuplicating = true),
      newIndexUid: self.duplicateIndexUid,
    })
    await promiseTimeout(1000)
    await navigateTo(`/indexes/${newIndexUid}/documents`)
  } finally {
    self.isDuplicating = false
  }
}

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
    duplicateIndex:
      text: Duplicate this index?
    renameIndex:
      text: Rename this index?
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
  labels:
    duplicateIndexUid: New index name
    renameIndexUid: New index name
    proximityPrecisionByWord: By Word
    proximityPrecisionByAttribute: By Attribute
  notices:
    duplicateIndex:
      text: Your index will be duplicated by batches of documents. Ensure that your index is not being written to during the duplication process.
  actions:
    duplicateIndex: Duplicate index
    renameIndex: Rename index
    dropIndex: Delete index
    deleteAllDocuments: Delete all documents
</i18n>
