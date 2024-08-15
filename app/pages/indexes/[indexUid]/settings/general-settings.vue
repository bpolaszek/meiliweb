<template>
  <section class="space-y-4">
    <h3
      class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('title') }}
    </h3>

    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      <div class="flex items-start justify-between">
        <p class="grow">{{ error }}</p>
        <DocumentationLink
          v-if="error instanceof TaskError"
          :href="error.link"
          class="shrink-0 grow-0" />
      </div>
    </Alert>

    <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
      <Alert theme="warning" :title="t('notice.title')">
        {{ t('notice.text') }}
      </Alert>

      <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.primaryKey') }}</Label>
        <input
          v-model="primaryKey"
          required
          autofocus
          autocomplete="off"
          type="text"
          class="form-input" />
      </UniqueId>

      <footer class="flex flex-col items-center justify-end sm:flex-row">
        <Buttons>
          <Button type="reset" :disabled="!modified || loading" />
          <Button type="submit" :disabled="!modified || loading" :loading />
        </Buttons>
      </footer>
    </form>

    <h3
      class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('dangerZoneTitle') }}
    </h3>

    <form @submit.prevent="dropIndex()">
      <Button type="submit" icon-on-right theme="primary" icon="oi:delete">
        {{ t('actions.dropIndex') }}
      </Button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { resettableRef } from '~/utils'
import {
  TaskError,
  useFormSubmit,
  useMeiliClient,
  useTask,
} from '~/composables'
import { TOAST_FAILURE, TOAST_SUCCESS, useToasts } from '~/stores/toasts'
import Alert from '~/components/layout/Alert.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import Button from '~/components/layout/forms/Button.vue'
import type { Task } from 'meilisearch'
import { promiseTimeout } from '@vueuse/core'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Label from '~/components/layout/forms/Label.vue'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const meili = useMeiliClient()
const index = meili.index(props.indexUid)
const {
  value: primaryKey,
  reset,
  modified,
} = resettableRef((await index.fetchPrimaryKey()) as string)
const { loading, error, handle } = useFormSubmit({
  confirm: { text: t('confirmations.submit') },
})
const { handle: handleIndexDrop } = useFormSubmit({
  confirm: {
    title: t('confirmations.dropIndex.title', { index: index.uid }),
    text: t('confirmations.dropIndex.text'),
    acceptButtonText: t('confirmations.dropIndex.acceptButtonText'),
  },
})
const processTask = useTask()
const { createToast } = useToasts()
const self = reactive({ primaryKey, error })

const submit = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.primaryKey.title'),
    text: t('toasts.primaryKey.pendingText'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => index.update({ primaryKey: self.primaryKey }), {
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
        self.error = task.error as TaskError
      },
    })
    reset(self.primaryKey)
  })
}

const dropIndex = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.dropIndex.title'),
    text: t('toasts.dropIndex.pendingText'),
  })
  await handleIndexDrop(async () => {
    toast.spawn()
    await processTask(() => meili.deleteIndex(index.uid), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.primaryKey)
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

useHead({
  title: `${t('title')} - ${props.indexUid}`,
})
</script>

<i18n>
en:
  title: General settings
  dangerZoneTitle: Danger Zone
  confirmations:
    submit: Do you want to update your settings?
    dropIndex:
      title: "Drop `{index}`?"
      text: "CAUTION: This action cannot be reversed!"
      acceptButtonText: Yes, delete forever
  toasts:
    primaryKey:
      title: Updating primary key...
    dropIndex:
      title: Deleting index...
  labels:
    primaryKey: Primary Key
  notice:
    title: Warning
    text: You can freely update the primary key of an index as long as it contains no documents. To change the primary key of an index that already contains documents, you must first delete all documents in that index. You may then change the primary key and index your dataset again.
  actions:
    dropIndex: Delete index
</i18n>
