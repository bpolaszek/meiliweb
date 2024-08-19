<template>
  <div
    class="space-y-1 rounded-md border px-4 py-2 text-sm shadow-md"
    :class="themeClasses">
    <header class="flex items-center justify-between">
      <span class="text-lg font-semibold">{{ title ?? t('errorTitle') }}</span>
      <button
        v-if="dismissable"
        type="button"
        class="h-full shrink-0 grow-0"
        @click="emit('close')">
        <Icon name="mingcute:close-fill" />
      </button>
    </header>
    <slot />
  </div>
</template>

<script setup lang="ts">
import match from 'match-operator'

type Props = {
  title?: string | null
  dismissable?: boolean
  theme?: 'default' | 'warning' | 'danger' | 'success'
}
const emit = defineEmits(['close'])
const props = withDefaults(defineProps<Props>(), {
  title: null,
  dismissable: false,
  theme: 'default',
})
const { t } = useI18n()

const themeClasses = computed(() =>
  match(props.theme, [
    ['warning', 'border-orange-300 bg-orange-200 text-black'],
    ['danger', 'border-red-300 bg-red-200 text-black'],
    ['success', 'border-green-300 bg-green-200 text-black'],
    [match.default, 'border-gray-300 bg-gray-50 text-black'],
  ]),
)
</script>

<i18n>
en:
  errorTitle: An error occured.
</i18n>
