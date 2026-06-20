<template>
  <SwitchGroup as="div" class="flex items-center gap-3">
    <Switch
      :model-value="modelValue"
      :disabled="disabled"
      :class="[
        modelValue ? 'bg-primary-600' : 'bg-gray-200',
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      ]"
      @update:model-value="emit('update:modelValue', $event)">
      <span
        aria-hidden="true"
        :class="[
          modelValue ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        ]" />
    </Switch>
    <SwitchLabel v-if="label" class="cursor-pointer text-sm font-medium text-gray-900">
      {{ label }}
    </SwitchLabel>
  </SwitchGroup>
</template>

<script setup lang="ts">
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue'

type Props = {
  modelValue: boolean
  label?: string
  disabled?: boolean
}
withDefaults(defineProps<Props>(), { label: undefined, disabled: false })
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
</script>
