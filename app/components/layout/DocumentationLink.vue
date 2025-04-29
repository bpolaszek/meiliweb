<template>
  <a v-tippy="t('hint')" target="meilidocs" :href class="text-gray-600 hover:text-gray-700">
    <slot :icon="icon">
      <Icon :name="icon" />
    </slot>
  </a>
</template>

<script setup lang="ts">
type Props = {
  href: string
}
defineProps<Props>()
const { t } = useI18n()
const icon = 'material-symbols:help'
</script>

<i18n>
en:
  hint: Jump to Meilisearch documentation
</i18n>
