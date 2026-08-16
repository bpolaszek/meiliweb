<template>
  <UModal
    v-model:open="open"
    :title="title ? String(title) : undefined"
    :ui="{ body: 'text-sm' }"
    @update:open="(value: boolean) => !value && rejectDialog()">
    <template #body>
      <slot :resolve="resolveDialog" :close="rejectDialog" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { usePromisifiedDialogs } from '~/stores'

type Props = {
  title?: string
}
defineProps<Props>()
const { resolveDialog, rejectDialog } = usePromisifiedDialogs()
const open = ref(false)
onMounted(() => (open.value = true))
</script>
