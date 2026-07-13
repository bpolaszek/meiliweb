<template>
  <UBadge :as="as" :color="color" :variant="variant" class="rounded-lg">
    <slot />
  </UBadge>
</template>

<script setup lang="ts">
import match from 'match-operator'
import type { ComponentPublicInstance } from 'vue'

type Props = {
  as?: string | ComponentPublicInstance
  theme?: 'primary' | 'success' | 'danger' | 'neutral'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'span',
  theme: 'primary',
})
const color = computed(
  () =>
    match(props.theme, [
      ['primary', 'primary'],
      ['success', 'success'],
      ['danger', 'error'],
      ['neutral', 'neutral'],
    ]) as 'primary' | 'success' | 'error' | 'neutral',
)
const variant = computed(() => ('neutral' === props.theme ? 'outline' : 'solid'))
</script>
