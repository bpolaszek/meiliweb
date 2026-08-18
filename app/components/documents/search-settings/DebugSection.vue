<template>
  <SettingsSection :title="t('title')" href="https://www.meilisearch.com/docs/reference/api/search#ranking-score">
    <div class="flex flex-wrap items-center gap-4">
      <USwitch v-model="showRankingScore" :label="t('labels.showRankingScore')" />
      <USwitch v-model="showRankingScoreDetails" :label="t('labels.showRankingScoreDetails')" />
      <USwitch
        v-if="satisfiesVersion('>=1.35.0')"
        v-model="showPerformanceDetails"
        :label="t('labels.showPerformanceDetails')" />
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import { useVersion } from '~/stores'
import SettingsSection from './SettingsSection.vue'

const showRankingScore = defineModel<boolean>('showRankingScore', { required: true })
const showRankingScoreDetails = defineModel<boolean>('showRankingScoreDetails', { required: true })
const showPerformanceDetails = defineModel<boolean>('showPerformanceDetails', { required: true })

const { t } = useI18n()
const { satisfiesVersion } = useVersion()
</script>

<i18n>
en:
  title: Debug options
  labels:
    showRankingScore: Show ranking score
    showRankingScoreDetails: Show ranking score details
    showPerformanceDetails: Show performance stats
</i18n>
