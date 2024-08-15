<template>
  <Component v-if="as" :is="as">
    <slot :id="id" />
  </Component>
  <slot v-else :id="id" />
</template>

<script setup lang="ts">
import { ulid } from 'ulid'
import type { ComponentPublicInstance } from 'vue'

type Props = {
  as?: string | ComponentPublicInstance | undefined
}
defineProps<Props>()
const id = ulid()
</script>
