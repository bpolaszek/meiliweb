<template>
  <SettingsSection :title="t('title')" href="https://www.meilisearch.com/docs/reference/api/search#matching-strategy">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <UFormField :label="t('labels.matchingStrategy')" :help="t(`help.matchingStrategy.${matchingStrategy}`)">
        <USelect v-model="matchingStrategy" :items="matchingStrategyItems" class="w-full" />
      </UFormField>

      <UFormField :label="t('labels.rankingScoreThreshold')" :help="t('help.rankingScoreThreshold')">
        <UInput v-model="rankingScoreThresholdInput" type="number" :min="0" :max="1" :step="0.01" class="w-full" />
      </UFormField>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import type { MatchingStrategies } from 'meilisearch'
import SettingsSection from './SettingsSection.vue'

const matchingStrategy = defineModel<MatchingStrategies>('matchingStrategy', { required: true })
const rankingScoreThreshold = defineModel<number | null>('rankingScoreThreshold', { required: true })

const { t } = useI18n()

const matchingStrategyItems = computed(() => [
  { label: t('labels.strategies.last'), value: 'last' as MatchingStrategies },
  { label: t('labels.strategies.all'), value: 'all' as MatchingStrategies },
  { label: t('labels.strategies.frequency'), value: 'frequency' as MatchingStrategies },
])

// A cleared UInput yields '', not null — normalize both directions so the model stays
// `number | null` as the rest of the app (and buildSearchParams) expects.
const rankingScoreThresholdInput = computed<number | ''>({
  get: () => (null === rankingScoreThreshold.value ? '' : rankingScoreThreshold.value),
  set: (value) => {
    rankingScoreThreshold.value = '' === value ? null : value
  },
})
</script>

<i18n>
en:
  title: Matching & ranking
  labels:
    matchingStrategy: Matching strategy
    rankingScoreThreshold: Ranking score threshold
    strategies:
      last: Last
      all: All
      frequency: Frequency
  help:
    matchingStrategy:
      last: Drops query terms from the end of the query until enough results are found.
      all: Requires every query term to match — fewer, more precise results.
      frequency: Drops the most frequent terms first when results are scarce.
    rankingScoreThreshold: Results scoring below this threshold are excluded. Leave empty to disable.
</i18n>
