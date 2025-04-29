<template>
  <div v-if="isSupported && memory">
    <template v-if="memory">
      <div>Used</div>
      <div class="text-right">{{ size(memory.usedJSHeapSize) }}</div>

      <div>Allocated</div>
      <div class="text-right">{{ size(memory.totalJSHeapSize) }}</div>

      <div>Limit</div>
      <div class="text-right">{{ size(memory.jsHeapSizeLimit) }}</div>
    </template>
  </div>
  <div v-else class="text-xs italic text-gray-600">Performance memory API not supported</div>
</template>

<script setup>
import { useMemory } from '@vueuse/core'

const size = (v) => {
  const kb = v / 1024 / 1024
  return `${kb.toFixed(2)} MB`
}
const { isSupported, memory } = useMemory()
</script>
