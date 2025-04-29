<template>
  <TransitionRoot as="template" :show="state.open">
    <Dialog as="div" class="relative z-10" @close="state.open = false">
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

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div
          class="flex min-h-full justify-center p-4 text-center sm:items-center sm:p-0"
          :class="[centerOnMobile ? 'items-center' : 'items-end']">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <DialogPanel
              class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 dark:bg-primary-700">
              <div class="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:text-gray-200"
                  @click="state.open = false">
                  <span class="sr-only">Close</span>
                  <Icon name="heroicons:x-mark" class="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <DialogTitle
                v-if="title"
                as="h3"
                class="mb-3 text-base font-semibold leading-6 text-gray-900 empty:hidden dark:text-gray-100">
                {{ title }}
              </DialogTitle>
              <p class="text-sm">
                <slot :state="state" />
              </p>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { type MaybeRef, watchDebounced } from '@vueuse/core'
import { reactive, ref, watch } from 'vue'

export type ModalState = {
  open: boolean
}

export type ModalOptions = {
  onDismiss: Function
  debounce: number
}

const DEFAULT_OPTIONS = { onDismiss: () => {}, debounce: 300 }

export function useModalState(open: MaybeRef<boolean> = false, options: ModalOptions = DEFAULT_OPTIONS): ModalState {
  const { onDismiss, debounce } = { ...DEFAULT_OPTIONS, ...options }
  open = ref(open)
  watchDebounced(open, (value: boolean) => !value && onDismiss(), { debounce })
  return reactive({ open })
}
</script>

<script setup lang="ts">
export interface Props {
  title?: String
  state?: ModalState
  centerOnMobile?: boolean
}
const emit = defineEmits(['close'])
const props = withDefaults(defineProps<Props>(), {
  state: () => useModalState(true),
  centerOnMobile: false,
})
watch(
  () => props.state.open,
  (value) => !value && emit('close'),
)
</script>
