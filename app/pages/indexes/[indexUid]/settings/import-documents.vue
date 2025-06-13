<template>
  <form class="space-y-4" @submit.prevent="submit()">
    <h3 class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('title') }}
    </h3>

    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      {{ error }}
    </Alert>

    <UniqueId as="section" v-slot="{ id }" class="space-y-1 *:block">
      <Label required :for="id">{{ t('labels.pickAFile') }}</Label>
      <input type="file" required class="form-input w-full" @change="file = $event.target?.files?.[0]" />
    </UniqueId>

    <UniqueId as="section" v-slot="{ id }" class="space-y-1 *:block">
      <Label required :for="id">{{ t('labels.contentType') }}</Label>
      <Select :id="id" v-model="contentType" class="w-full">
        <option value="application/json">application/json</option>
        <option value="application/x-ndjson">application/x-ndjson</option>
        <option value="text/csv">text/csv</option>
      </Select>
    </UniqueId>

    <UniqueId as="section" v-slot="{ id }" class="space-y-1 *:block">
      <Label required :for="id">{{ t('labels.updateMode') }}</Label>
      <Select :id="id" v-model="updateMode" class="w-full">
        <option value="replace">{{ t('updateModes.replace') }}</option>
        <option value="update">{{ t('updateModes.update') }}</option>
      </Select>
    </UniqueId>

    <footer class="flex flex-col items-center justify-end sm:flex-row">
      <Buttons>
        <Button type="submit" :disabled="!file" :loading icon="tabler:database-import">
          {{ t('actions.import') }}
        </Button>
      </Buttons>
    </footer>
  </form>
</template>

<script setup lang="ts">
import Label from '~/components/layout/forms/Label.vue'
import Select from '~/components/layout/forms/Select.vue'
import { useFormSubmit, useMeiliClient } from '~/composables'
import { ref, type Ref } from 'vue'
import { type ContentType, EnqueuedTask } from 'meilisearch'
import match from 'match-operator'
import { readFileAsText } from '~/utils/read-file-as-text'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import { useToasts } from '~/stores/toasts'
import Alert from '~/components/layout/Alert.vue'
import { promiseTimeout } from '@vueuse/core'
import { useConfirmationDialog } from '~/stores'
import { TaskStatus } from '~/types'

type Props = {
  indexUid: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const client = useMeiliClient()
const { updateMode } = useIndexLocalSettings(props.indexUid)
const { loading, error, handle } = useFormSubmit()
const { createToast } = useToasts()
const { confirm } = useConfirmationDialog()

const self = reactive({
  file: ref(),
  error,
  updateMode,
  contentType: ref('application/json') as Ref<ContentType>,
})

const submit = async () => {
  if (!(await confirm({ text: t('confirmations.import') }))) {
    return
  }
  const toast = createToast({
    title: t('toasts.success.title'),
    text: t('toasts.success.pendingText'),
    ttl: 0,
    icon: 'fluent:spinner-ios-16-filled',
    iconClasses: 'animate-spin',
  })
  await handle(async () => {
    const documents = await readFileAsText(self.file)
    toast.update({ text: t('toasts.success.uploadText') })
    let enqueuedTask: EnqueuedTask
    try {
      enqueuedTask = await match(self.updateMode, [
        ['replace', client.index(props.indexUid).addDocumentsFromString(documents, self.contentType)],
        ['update', client.index(props.indexUid).updateDocumentsFromString(documents, self.contentType)],
      ])
    } catch (e) {
      toast.destroy()
      throw e
    }

    const task = await client.waitForTask(enqueuedTask.taskUid, {
      timeOutMs: 3600 * 1000,
    })
    toast.update({
      ttl: 5000,
      text: match(task.status, [
        [TaskStatus.TASK_SUCCEEDED, t('toasts.success.doneText')],
        [TaskStatus.TASK_CANCELED, t('toasts.error.canceledText')],
        [match.default, t('toasts.error.failedText')],
      ]),
      icon: match(task.status, [
        [TaskStatus.TASK_SUCCEEDED, 'lets-icons:check-fill'],
        [match.default, 'clarity:error-solid'],
      ]),
      iconClasses: match(task.status, [
        [TaskStatus.TASK_SUCCEEDED, 'text-green-600'],
        [match.default, 'text-red-600'],
      ]),
    })

    if (TaskStatus.TASK_SUCCEEDED === task.status) {
      await promiseTimeout(1000)
      navigateTo(`/indexes/${props.indexUid}/documents`)
    }

    if (task.error?.message) {
      self.error = new Error(task.error.message)
    }
  })
}

const { contentType, file } = toRefs(self)
useHead({
  title: `${t('title')} - ${props.indexUid}`,
})
</script>

<i18n>
en:
  title: Import documents
  labels:
    pickAFile: File to import
    contentType: Content type
    updateMode: Import mode
  updateModes:
    replace: Replace (drops document if exists, replaces by the new one)
    update: Update (adds document if not exists, only updates properties otherwise)
  actions:
    import: Import
  toasts:
    success:
      title: Importing documents
      pendingText: Reading your file...
      uploadText: Uploading documents...
      doneText: Done.
    error:
      title: Error while importing documents
      canceledText: Task was canceled.
      failedText: Task failed.
  confirmations:
    import: Do you want to import these documents?
</i18n>
