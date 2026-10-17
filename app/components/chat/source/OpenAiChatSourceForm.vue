<template>
  <UFormField :label="t('labels.orgId')">
    <UInput v-model="settings!.orgId" autocomplete="off" class="w-full" />
  </UFormField>

  <UFormField :label="t('labels.projectId')">
    <UInput v-model="settings!.projectId" autocomplete="off" class="w-full" />
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
    orgId: Organization ID
    projectId: Project ID
</i18n>
