<template>
  <button
    type="button"
    v-tippy="t('label')"
    class="relative ml-5 flex-shrink-0 rounded-full bg-white p-1 text-gray-800 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    @click="confirmLogout()">
    <span class="absolute -inset-1.5" />
    <span class="sr-only">{{ t('label') }}</span>
    <Icon
      name="ant-design:logout-outlined"
      class="size-6 -rotate-90 hover:text-primary-800"
      aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { useConfirmationDialog } from '~/stores'

const { confirm } = useConfirmationDialog()
const { t } = useI18n()
const confirmLogout = async () => {
  if (await confirm({ text: t('confirmation') })) {
    navigateTo('/logout')
  }
}
</script>

<i18n>
en:
  label: Sign out
  confirmation: Do you really want to log out?
</i18n>
