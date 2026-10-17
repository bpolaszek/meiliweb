<template>
  <UButton
    :as="as"
    :type="type"
    :disabled="disabled || loading"
    :loading="loading"
    :icon="icon"
    :trailing="iconOnRight"
    :color="color"
    :variant="variant"
    :size="'small' === size ? 'sm' : 'md'"
    :class="themeClasses"
    :ui="{ base: 'justify-center gap-2' }">
    <span v-if="loading">{{ loadingText ?? t('loadingText') }}</span>
    <slot v-else>{{ text }}</slot>
  </UButton>
</template>

<script setup lang="ts">
import match from 'match-operator'
import type { ComponentPublicInstance } from 'vue'

type Props = {
  as?: string | ComponentPublicInstance
  type?: 'submit' | 'reset' | 'button' | undefined
  theme?: 'primary' | 'secondary'
  icon?: string
  iconOnRight?: boolean
  loading?: boolean
  loadingText?: string
  disabled?: boolean
  noBorder?: boolean
  noPadding?: boolean
  noRounded?: boolean
  size?: 'small'
}
const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  disabled: false,
  loading: false,
  iconOnRight: false,
  noBorder: false,
  noPadding: false,
  noRounded: false,
})
const { t } = useI18n()
const type = computed(() => props.type ?? ('button' === props.as ? 'button' : undefined))
const isPrimary = computed(() => 'submit' === props.type || 'primary' === props.theme)
const isSecondary = computed(() => 'reset' === props.type || 'secondary' === props.theme)
const color = computed(() => (isPrimary.value ? 'primary' : 'neutral'))
const variant = computed(() => (isPrimary.value || isSecondary.value ? 'solid' : 'outline'))
const themeClasses = computed(() => {
  const classes = []

  props.noBorder && classes.push('ring-0')
  props.noPadding && classes.push('p-0')
  props.noRounded ? classes.push('rounded-none') : classes.push('rounded-lg')
  isSecondary.value && classes.push('bg-gray-700 enabled:hover:bg-gray-600')

  return classes
})

const text = computed(() =>
  match(props.type, [
    ['submit', t('buttons.submit')],
    ['reset', t('buttons.cancel')],
    [match.default, ''],
  ]),
)
</script>

<i18n>
en:
  loadingText: Please wait...
  buttons:
    submit: Submit
    cancel: Cancel
</i18n>
