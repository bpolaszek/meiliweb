<template>
  <UFormField :label="t('labels.deploymentId')">
    <UInput v-model="settings!.deploymentId" autocomplete="off" class="w-full" />
  </UFormField>

  <UFormField :label="t('labels.apiVersion')">
    <UInput
      v-model="settings!.apiVersion"
      autocomplete="off"
      :placeholder="t('placeholders.apiVersion')"
      class="w-full" />
  </UFormField>
</template>

<script setup lang="ts">
import type { ChatWorkspaceSettings } from '~/composables'

const settings = defineModel<ChatWorkspaceSettings>()
const { t } = useI18n()
</script>

<i18n>
en:
  labels:
    deploymentId: Deployment ID
    apiVersion: API version
  placeholders:
    apiVersion: 2024-06-01
</i18n>
