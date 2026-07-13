<template>
  <USlideover
    v-model:open="open"
    :title="title"
    side="right"
    :overlay="false"
    :ui="{
      content: 'max-w-lg',
      title: 'text-2xl font-semibold',
      body: noPadding ? 'p-0 sm:p-0' : undefined,
    }">
    <template #body>
      <slot />
    </template>
  </USlideover>
</template>

<script setup lang="ts">
type Props = {
  title?: string
  noPadding?: boolean
}
withDefaults(defineProps<Props>(), { noPadding: false })
const open = defineModel<boolean>('open', { default: false })
</script>
