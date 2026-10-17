<template>
  <SettingsSection :title="t('title')" href="https://www.meilisearch.com/docs/reference/api/search#query-locales">
    <UFormField :help="t('help.locales')">
      <UInputMenu
        v-model="locales"
        multiple
        open-on-click
        open-on-focus
        :items="localeItems"
        value-key="value"
        :placeholder="t('placeholders.locales')"
        class="w-full" />
    </UFormField>
  </SettingsSection>
</template>

<script setup lang="ts">
import { MEILISEARCH_LOCALES, humanizeLocale } from '~/utils'
import SettingsSection from './SettingsSection.vue'

const locales = defineModel<Array<string>>({ required: true })

const { t } = useI18n()

const localeItems = computed(() => MEILISEARCH_LOCALES.map((code) => ({ label: humanizeLocale(code), value: code })))
</script>

<i18n>
en:
  title: Locales
  placeholders:
    locales: Auto-detected
  help:
    locales: Leave empty to let Meilisearch auto-detect the query's language.
</i18n>
