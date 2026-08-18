<template>
  <SettingsSection :title="t('title')" href="https://www.meilisearch.com/docs/guides/personalization">
    <UFormField :label="t('labels.userContext')" :help="t('help.userContext')">
      <UInput v-model="userContext" :placeholder="t('placeholders.userContext')" class="w-full" />
    </UFormField>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from './SettingsSection.vue'

const userContext = defineModel<string>({ required: true })

const { t } = useI18n()
</script>

<i18n>
en:
  title: Search personalization
  labels:
    userContext: User context
  placeholders:
    userContext: Describe the user (preferences, behavior, ...) to personalize results for them
  help:
    userContext: Leave empty to disable personalization.
</i18n>
