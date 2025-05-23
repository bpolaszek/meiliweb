<template>
  <TransitionRoot as="template" :show="open">
    <Dialog as="div" class="relative z-10" @close="settle(false)">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <form
          class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
          @submit.prevent="settle(true)"
          @reset.prevent="settle(false)">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <DialogPanel
              class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div class="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  @click="open = false">
                  <span class="sr-only">Close</span>
                  <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div class="sm:flex sm:items-start">
                <div
                  class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon class="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <DialogTitle as="h3" class="text-base font-semibold leading-6 text-gray-900">
                    {{ title ?? t('title') }}
                  </DialogTitle>
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
            </DialogPanel>
          </TransitionChild>
        </form>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { type ConfirmationDialog, useConfirmationDialog } from '~/stores'
import { promiseTimeout } from '@vueuse/core'
import Button from '~/components/layout/forms/Button.vue'

const open = ref(false)
const self = reactive({ open })
const props = defineProps<ConfirmationDialog>()
const { t } = useI18n()
const { clear } = useConfirmationDialog()
const settle = async (accepted: boolean) => {
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
