<template>
  <UModal v-model:open="state.open" :title="title ? String(title) : undefined" :ui="{ body: 'text-sm' }">
    <template #body>
      <slot :state="state" />
    </template>
  </UModal>
</template>

<script lang="ts">
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
