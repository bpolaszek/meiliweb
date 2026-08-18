<template>
  <SettingsSection :title="t('title')" href="https://www.meilisearch.com/docs/reference/api/search#highlight-tags">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <UFormField :label="t('labels.highlightPreTag')" :help="t('help.tags')">
        <UInput v-model="highlightPreTag" class="w-full" />
      </UFormField>

      <UFormField :label="t('labels.highlightPostTag')" :help="t('help.tags')">
        <UInput v-model="highlightPostTag" class="w-full" />
      </UFormField>

      <UFormField :label="t('labels.cropLength')">
        <UInput v-model="cropLength" type="number" :min="1" class="w-full" />
      </UFormField>

      <UFormField :label="t('labels.cropMarker')">
        <UInput v-model="cropMarker" class="w-full" />
      </UFormField>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from './SettingsSection.vue'

const highlightPreTag = defineModel<string>('highlightPreTag', { required: true })
const highlightPostTag = defineModel<string>('highlightPostTag', { required: true })
const cropLength = defineModel<number>('cropLength', { required: true })
const cropMarker = defineModel<string>('cropMarker', { required: true })

const { t } = useI18n()
</script>

<i18n>
en:
  title: Highlight & crop
  labels:
    highlightPreTag: Highlight pre-tag
    highlightPostTag: Highlight post-tag
    cropLength: Crop length
    cropMarker: Crop marker
  help:
    tags: Not rendered as HTML — it's a delimiter the app parses back out to paint matches.
</i18n>
