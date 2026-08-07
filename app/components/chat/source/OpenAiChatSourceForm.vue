<template>
  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.orgId') }}</Label>
    <input :id v-model="settings!.orgId" autocomplete="off" type="text" class="form-input w-full text-sm" />
  </UniqueId>

  <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
    <Label :for="id">{{ t('labels.projectId') }}</Label>
    <input :id v-model="settings!.projectId" autocomplete="off" type="text" class="form-input w-full text-sm" />
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
    orgId: Organization ID
    projectId: Project ID
</i18n>
