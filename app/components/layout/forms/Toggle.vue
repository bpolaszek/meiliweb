<template>
  <USwitch
    :model-value="modelValue"
    :disabled="disabled"
    :label="label"
    size="lg"
    :ui="{ label: 'cursor-pointer font-medium' }"
    @update:model-value="emit('update:modelValue', $event)" />
</template>

<script setup lang="ts">
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
