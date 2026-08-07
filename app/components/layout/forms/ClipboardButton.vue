<template>
  <button
    v-tippy="{
      hideOnClick: false,
      content: copied ? copiedText ?? t('hints.copied') : copyText ?? t('hints.copy'),
    }"
    type="button"
    :class="[copied ? 'scale-125 rotate-12 skew-y-6' : 'text-gray-500 hover:text-gray-700']"
    @click="copy()">
    <Icon name="mingcute:copy-line" class="size-full" />
  </button>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

type Props = {
  source: string
  copyText?: string
  copiedText?: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const { source } = toRefs(props)
const { copied, copy } = useClipboard({ source })
</script>

<i18n>
en:
  hints:
    copy: Copy to clipboard
    copied: Copied!
</i18n>
