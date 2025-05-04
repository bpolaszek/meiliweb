<template>
  <Textarea v-model="text" />
</template>

<script setup lang="ts">
import Textarea from '~/components/layout/forms/Textarea.vue'

const lines = defineModel<string[]>({ default: [] })
const text = computed({
  get: () => lines.value.join('\n'),
  set: (value) =>
    (lines.value = value
      .split('\n')
      .map((value: string) => value.trim())
      .filter((value: string) => value.length > 0)),
})
</script>
