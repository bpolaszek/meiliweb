<template>
  <Component :is="as" class="rounded-lg px-1.5 py-0.5" :class="classes">
    <slot />
  </Component>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import match from 'match-operator'

type Props = {
  as?: string | ComponentPublicInstance
  theme?: 'primary' | 'success' | 'danger' | 'neutral'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'span',
  theme: 'primary',
})
const classes = computed(() =>
  match(props.theme, [
    ['primary', ['bg-primary-800', 'text-white']],
    ['success', ['bg-green-600', 'text-white']],
    ['danger', ['bg-red-600', 'text-white']],
    ['neutral', ['border border-gray-200']],
  ]),
)
</script>
