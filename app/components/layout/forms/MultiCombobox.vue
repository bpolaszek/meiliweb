<template>
  <UInputMenu
    v-model="selected"
    multiple
    open-on-click
    open-on-focus
    :items="items"
    :autofocus="autofocus"
    v-bind="restInputAttrs"
    :ui="{ base: inputClass }" />
</template>

<script setup lang="ts">
type Props = {
  items: string[] // Choices of the combobox.
  modelValue?: string[] // Selected choices of the combobox.
  inputAttrs?: Record<string, any> // Attributes to pass to the underlying input (id, placeholder, disabled, class).
  autofocus?: boolean
  autoHide?: boolean // Legacy prop, kept for call-site compatibility (UInputMenu handles closing itself).
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  inputAttrs: () => ({}),
  autofocus: false,
  autoHide: false,
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const selected = computed({
  get: () => props.modelValue,
  set: (value: string[]) => emit('update:modelValue', value),
})
const inputClass = computed(() => props.inputAttrs.class)
const restInputAttrs = computed(() => {
  const { class: _, ...rest } = props.inputAttrs
  return rest
})
</script>
