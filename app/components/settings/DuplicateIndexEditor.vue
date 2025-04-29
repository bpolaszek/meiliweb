<template>
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
</template>

<script setup lang="ts">
import Button from '~/components/layout/forms/Button.vue'
import Label from '~/components/layout/forms/Label.vue'
import { TaskError, useIndexOperations } from '~/composables'
import { promiseTimeout } from '@vueuse/core'
import { navigateTo } from '#imports'

const emit = defineEmits<{
  (e: 'error', error: TaskError): void
}>()
type Props = {
  indexUid: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const { confirm } = useConfirmationDialog()
const self = reactive({
  duplicateIndexUid: ref(`${props.indexUid}-copy`),
  isDuplicating: false,
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
  } catch (error) {
    emit('error', error as TaskError)
  } finally {
    self.isDuplicating = false
  }
}
</script>
<i18n>
en:
  confirmations:
    duplicateIndex:
      text: Duplicate this index?
  labels:
    duplicateIndexUid: New index name
  notices:
    duplicateIndex:
      text: Your index will be duplicated by batches of documents. Ensure that your index is not being written to during the duplication process.
  actions:
    duplicateIndex: Duplicate index
</i18n>
