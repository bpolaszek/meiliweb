<template>
  <SettingsSection :title="t('title')" href="https://www.meilisearch.com/docs/reference/api/search#hybrid">
    <USwitch v-model="enabled" :label="t('labels.enable')" />

    <div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2" :class="{ 'opacity-50': !enabled }">
      <UFormField :label="t('labels.embedder')">
        <USelect v-model="embedder" :items="embedders" :disabled="!enabled" class="w-full" />
      </UFormField>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span>{{ t('labels.keywordSearch') }}</span>
          <span>{{ t('labels.semanticSearch') }}</span>
        </div>
        <RangeSlider
          v-model="semanticRatio"
          :min="0"
          :max="1"
          :step="0.01"
          :disabled="!enabled"
          :format="formatRatio"
          class="w-full" />
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import RangeSlider from '~/components/layout/RangeSlider.vue'
import SettingsSection from './SettingsSection.vue'

type Props = {
  embedders: Array<string>
}
defineProps<Props>()

const enabled = defineModel<boolean>('enabled', { default: false })
const embedder = defineModel<string | null>('embedder', { default: null })
const semanticRatio = defineModel<number>('semanticRatio', { default: 0.5 })

const { t } = useI18n()
const formatRatio = (value: number) => `${Math.round(value * 100)}%`
</script>

<i18n>
en:
  title: Hybrid search
  labels:
    enable: Enable hybrid search (semantic + keyword)
    embedder: Embedder
    keywordSearch: Keyword
    semanticSearch: Semantic
</i18n>
