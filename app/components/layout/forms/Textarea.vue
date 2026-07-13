<template>
  <UTextarea v-model="value" :disabled="disabled" :ui="{ base: baseClasses }" />
</template>

<script setup lang="ts">
type Props = {
  disabled?: boolean
  noBorder?: boolean
  noPadding?: boolean
  noRounded?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  noBorder: false,
  noPadding: false,
  noRounded: false,
})
const attrs = useAttrs()
// Caller classes (heights, fonts, ...) must reach the inner <textarea>, not only the root wrapper
const baseClasses = computed(() => [
  attrs.class as string,
  ...(props.noBorder ? ['ring-0'] : []),
  ...(props.noPadding ? ['p-0'] : []),
  ...(props.noRounded ? ['rounded-none'] : []),
])
const value = defineModel<string | undefined>()
</script>
