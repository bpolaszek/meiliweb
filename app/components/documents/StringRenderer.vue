<template>
  <div :class="self.showExpandButton ? 'flex flex-col items-end gap-1' : ''">
    <HighlightedText ref="textElement" :value :class="{ 'line-clamp-3': self.truncated }" />
    <button
      v-if="self.showExpandButton"
      @click="self.truncated = !self.truncated"
      class="text-xs text-primary-500 hover:text-primary-700 focus:outline-hidden">
      <template v-if="self.truncated">
        {{ t('actions.showMore') }}
      </template>
      <template v-else>
        {{ t('actions.showLess') }}
      </template>
    </button>
  </div>
</template>

<script setup lang="ts">
import { templateRef } from '@vueuse/core'
import type { ComponentPublicInstance } from 'vue'
import HighlightedText from './HighlightedText.vue'

type Props = {
  value: string | number | boolean
}

defineProps<Props>()

const self = reactive({
  truncated: true,
  textElement: templateRef<ComponentPublicInstance>('textElement'),
  showExpandButton: false,
})

const { t } = useI18n()

const checkTextOverflow = () => {
  const element = self.textElement?.$el as HTMLElement | undefined
  if (!element) return

  if (element.scrollHeight > element.clientHeight) {
    self.showExpandButton = true
  }
}

onMounted(checkTextOverflow)
watch(toRef(self, 'truncated'), checkTextOverflow)
</script>

<i18n>
en:
  actions:
    showMore: Show more...
    showLess: Show less
</i18n>
