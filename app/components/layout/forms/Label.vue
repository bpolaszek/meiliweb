<template>
  <label class="font-medium">
    <slot />
    <sup v-if="required" v-tippy="t('hint')" class="mt-4 ml-1 cursor-help text-red-700">*</sup>
  </label>
</template>

<script setup lang="ts">
type Props = {
  required?: boolean
}

withDefaults(defineProps<Props>(), { required: false })
const { t } = useI18n()
</script>

<i18n>
en:
  hint: This field is required.
</i18n>
