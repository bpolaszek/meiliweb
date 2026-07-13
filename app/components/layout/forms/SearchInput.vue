<template>
  <UInput
    v-model="value"
    type="search"
    name="search"
    autocomplete="off"
    icon="heroicons:magnifying-glass-20-solid"
    :placeholder="t('placeholder')"
    :ui="{ base: 'rounded-lg' }"
    v-bind="inputAttrs" />
</template>

<script setup lang="ts">
type Props = {
  inputAttrs?: any
}
defineProps<Props>()
const value = defineModel()
const { t } = useI18n()
</script>

<i18n>
en:
  placeholder: Search...
</i18n>
