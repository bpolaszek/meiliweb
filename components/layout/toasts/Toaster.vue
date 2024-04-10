<template>
  <div
    aria-live="assertive"
    class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6">
    <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
      <Toast v-for="toast of toasts" :key="toast.id" :toast="toast" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToasts } from '~/stores/toasts'
import { safeToRefs } from '~/utils'
import Toast from './Toast.vue'

const { toasts } = safeToRefs(useToasts())
</script>
