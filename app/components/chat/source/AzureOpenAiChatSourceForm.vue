<template>
  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.deploymentId') }}</Label>
    <input :id v-model="settings!.deploymentId" autocomplete="off" type="text" class="form-input w-full text-sm" />
  </UniqueId>

  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.apiVersion') }}</Label>
    <input
      :id
      v-model="settings!.apiVersion"
      autocomplete="off"
      type="text"
      :placeholder="t('placeholders.apiVersion')"
      class="form-input w-full text-sm" />
  </UniqueId>
</template>

<script setup lang="ts">
import Label from '~/components/layout/forms/Label.vue'
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
