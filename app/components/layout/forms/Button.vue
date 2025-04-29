<template>
  <Component
    :is="as"
    :type
    :disabled="disabled || loading"
    class="flex items-center justify-center gap-2"
    :class="themeClasses">
    <template v-if="!iconOnRight">
      <Icon v-if="loading" name="fluent:spinner-ios-16-filled" class="animate-spin" />
      <Icon v-else-if="icon" :name="icon" />
    </template>

    <span v-if="loading">{{ loadingText ?? t('loadingText') }}</span>
    <slot v-else>{{ text }}</slot>

    <template v-if="iconOnRight">
      <Icon v-if="loading" name="fluent:spinner-ios-16-filled" class="animate-spin" />
      <Icon v-else-if="icon" :name="icon" />
    </template>
  </Component>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import match from 'match-operator'

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
const themeClasses = computed(() => {
  const classes = []

  props.noBorder || classes.push('border')
  props.noPadding || classes.push(...('small' === props.size ? ['py-1', 'px-2'] : ['py-1.5', 'px-4']))
  props.noRounded || classes.push('rounded-lg')
  'small' === props.size && classes.push('text-sm')

  if ('submit' === props.type || 'primary' === props.theme) {
    classes.push(
      'text-white',
      'bg-primary-600',
      'focus-visible:outline',
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2',
      'focus-visible:outline-primary-600',
      'hover:bg-primary-700',
      'disabled:opacity-80',
      'disabled:cursor-not-allowed',
      'disabled:hover:bg-primary-600',
    )
  }
  if ('reset' === props.type || 'secondary' === props.theme) {
    classes.push(
      'text-white',
      'bg-gray-700',
      'focus-visible:outline',
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2',
      'focus-visible:outline-gray-600',
      'enabled:hover:bg-gray-600',
      'disabled:opacity-80',
      'disabled:cursor-not-allowed',
    )
  }

  return classes
})

const text = computed(() =>
  match(props.type, [
    ['submit', 'Submit'],
    ['reset', 'Reset'],
    [match.default, ''],
  ]),
)
</script>

<i18n>
en:
  loadingText: Please wait...
</i18n>
