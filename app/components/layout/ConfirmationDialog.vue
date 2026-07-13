<template>
  <UModal v-model:open="self.open" @update:open="(value: boolean) => !value && settle(false)">
    <template #content>
      <form class="p-4 sm:p-6" @submit.prevent="settle(true)" @reset.prevent="settle(false)">
        <div class="sm:flex sm:items-start">
          <div
            class="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <ExclamationTriangleIcon class="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 class="text-base leading-6 font-semibold text-gray-900">
              {{ title ?? t('title') }}
            </h3>
            <p class="mt-2 block text-sm text-gray-500 empty:hidden">
              {{ text }}
            </p>
          </div>
        </div>
        <div class="mt-5 flex-row-reverse justify-end gap-2 sm:mt-4 sm:flex sm:flex-row">
          <Button type="reset">
            {{ denyButtonText ?? t('buttons.deny') }}
          </Button>
          <Button v-focus type="submit">
            {{ acceptButtonText ?? t('buttons.accept') }}
          </Button>
        </div>
      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { promiseTimeout } from '@vueuse/core'
import Button from '~/components/layout/forms/Button.vue'
import { type ConfirmationDialog, useConfirmationDialog } from '~/stores'

const self = reactive({ open: false, settled: false })
const props = defineProps<ConfirmationDialog>()
const { t } = useI18n()
const { clear } = useConfirmationDialog()
const settle = async (accepted: boolean) => {
  if (self.settled) {
    return
  }
  self.settled = true
  props.resolve(accepted)
  self.open = false
  await promiseTimeout(300)
  clear()
}
onMounted(() => (self.open = true))
</script>

<i18n>
en:
  title: Please confirm
  buttons:
    accept: Confirm
    deny: Cancel
</i18n>
