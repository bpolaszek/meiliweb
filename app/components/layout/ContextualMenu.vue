<template>
  <div class="relative flex items-center justify-end">
    <UDropdownMenu :items="items" :content="{ align: 'end' }" :ui="{ content: 'w-48' }">
      <slot name="button">
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-hidden">
          <span class="sr-only">{{ t('open') }}</span>
          <Icon name="heroicons-solid:dots-vertical" aria-hidden="true" />
        </button>
      </slot>
    </UDropdownMenu>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

type Props = {
  items: DropdownMenuItem[] | DropdownMenuItem[][]
}
defineProps<Props>()

const { t } = useI18n()
</script>

<i18n>
en:
  open: Open menu
</i18n>
