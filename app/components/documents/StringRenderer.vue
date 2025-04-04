<template>
  <div :class="self.showExpandButton ? 'flex flex-col items-end gap-1' : ''">
    <span :class="{ 'line-clamp-3': self.truncated }" ref="textElement">
      {{ value }}
    </span>
    <button
      v-if="self.showExpandButton"
      @click="self.truncated = !self.truncated"
      class="text-xs text-primary-500 hover:text-primary-700 focus:outline-none">
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

type Props = {
  value: string | number | boolean
}

defineProps<Props>()

const self = reactive({
  truncated: true,
  textElement: templateRef('textElement'),
  showExpandButton: false,
})

const { t } = useI18n()

const checkTextOverflow = () => {
  if (!self.textElement) return

  const element = self.textElement
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
