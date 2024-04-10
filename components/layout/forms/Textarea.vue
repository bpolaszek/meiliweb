<template>
  <textarea
    :disabled
    :class="classes"
    v-if="undefined !== value"
    v-model="value"></textarea>
  <component :disabled :class="classes" v-else is="textarea">
    <slot />
  </component>
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
const classes = computed(() => {
  const classes = [
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-primary-600',
  ]

  props.noBorder || classes.push('border')
  props.noPadding || classes.push('py-1.5', 'px-4')
  props.noRounded || classes.push('rounded-md')

  return classes
})
const value = defineModel()
</script>
