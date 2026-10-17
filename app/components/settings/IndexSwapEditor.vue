<template>
  <form @submit.prevent="swapIndex()" class="space-y-4">
    <p class="text-xs text-gray-600 italic">
      {{ t('notices.swapIndex.text') }}
    </p>

    <div class="flex justify-end">
      <Button type="submit" :loading="self.isSwapping" icon-on-right theme="primary" icon="heroicons:arrows-right-left">
        {{ t('actions.swapIndex') }}
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import Button from '~/components/layout/forms/Button.vue'
import { TaskError, useIndexOperations } from '~/composables'
import { DismissedDialog } from '~/stores'
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
const self = reactive({
  isSwapping: false,
})

const { swapIndex: doSwapIndex } = useIndexOperations()
const swapIndex = async () => {
  try {
    await doSwapIndex(props.indexUid, {
      onStart: () => (self.isSwapping = true),
    })
    await promiseTimeout(1000)
    // A swap keeps both names, so the user stays on the index they started from -- with the
    // other index's content in it now.
    await navigateTo(`/indexes/${props.indexUid}/documents`)
  } catch (error) {
    if (error instanceof DismissedDialog) return
    emit('error', error as TaskError)
  } finally {
    self.isSwapping = false
  }
}
</script>
<i18n>
en:
  notices:
    swapIndex:
      text: >-
        Exchange this index's documents, settings and primary key with another index. Both indexes keep their
        current name. This runs immediately.
  actions:
    swapIndex: Swap with another index
</i18n>
