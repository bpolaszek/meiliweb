<template>
  <form @submit.prevent="renameIndex()" class="space-y-4">
    <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
      <Label required :for="id">{{ t('labels.renameIndexUid') }}</Label>
      <input v-model="self.renameIndexUid" required autofocus autocomplete="off" type="text" class="form-input" />
    </UniqueId>

    <div class="flex justify-end">
      <Button type="submit" :loading="self.isRenaming" icon-on-right theme="primary" icon="heroicons:check">
        {{ t('actions.renameIndex') }}
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import Button from '~/components/layout/forms/Button.vue'
import Label from '~/components/layout/forms/Label.vue'
import { promiseTimeout } from '@vueuse/core'
import { navigateTo, TaskError, useIndexOperations } from '#imports'

const emit = defineEmits<{
  (e: 'error', error: TaskError): void
}>()
type Props = {
  indexUid: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const { confirm } = useConfirmationDialog()
const { renameIndex: doRenameIndex } = useIndexOperations()
const self = reactive({
  renameIndexUid: ref(`${props.indexUid}-new`),
  isRenaming: false,
})

const renameIndex = async () => {
  if (!(await confirm({ text: t('confirmations.renameIndex.text') }))) {
    return
  }
  try {
    const newIndexUid = await doRenameIndex(props.indexUid, {
      onStart: () => (self.isRenaming = true),
      newIndexUid: self.renameIndexUid,
    })
    await promiseTimeout(1000)
    await navigateTo(`/indexes/${newIndexUid}/documents`)
  } catch (error) {
    emit('error', error as TaskError)
  } finally {
    self.isRenaming = false
  }
}
</script>

<i18n>
en:
  confirmations:
    renameIndex:
      text: Rename this index?
  labels:
    renameIndexUid: New index name
  actions:
    renameIndex: Rename index
</i18n>
