<template>
  <a v-tippy="t('label')" href="https://github.com/bpolaszek/meiliweb" target="github">
    <Icon name="bi:github" class="hover:text-primary-800 size-6 text-gray-500" />
  </a>
</template>

<script setup>
const { t } = useI18n()
</script>

<i18n>
en:
  label: Contribute
</i18n>
