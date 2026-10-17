<template>
  <UAlert
    :color="color"
    variant="subtle"
    :title="title ?? defaultTitle"
    :close="dismissable"
    :ui="{ title: 'text-lg font-semibold', description: 'text-sm' }"
    @update:open="emit('close')">
    <template #description>
      <slot />
    </template>
  </UAlert>
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

const color = computed(
  () =>
    match(props.theme, [
      ['warning', 'warning'],
      ['danger', 'error'],
      ['success', 'success'],
      [match.default, 'neutral'],
    ]) as 'warning' | 'error' | 'success' | 'neutral',
)

// Only the `danger` theme has a sensible fallback title ("An error occured.").
// Other themes render no title when none is given, rather than misleadingly
// borrowing the error copy.
const defaultTitle = computed(() => ('danger' === props.theme ? t('errorTitle') : undefined))
</script>

<i18n>
en:
  errorTitle: An error occured.
</i18n>
