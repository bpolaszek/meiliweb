<template>
  <UPopover>
    <button v-tippy="t('actions.toggle')" type="button">
      <Icon
        name="ph:bug-fill"
        :class="[
          'size-6',
          enabled ? 'text-primary-600 hover:text-primary-800' : 'text-gray-600 hover:text-gray-800',
        ]" />
    </button>

    <template #content>
      <div class="w-72 space-y-4 p-4">
        <USwitch v-model="showRankingScore" :label="t('labels.showRankingScore')" />
        <USwitch v-model="showRankingScoreDetails" :label="t('labels.showRankingScoreDetails')" />
        <USwitch
          v-if="satisfiesVersion('>=1.35.0')"
          v-model="showPerformanceDetails"
          :label="t('labels.showPerformanceDetails')" />
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { useVersion } from '~/stores'

const showRankingScore = defineModel<boolean>('showRankingScore', { default: false })
const showRankingScoreDetails = defineModel<boolean>('showRankingScoreDetails', { default: false })
const showPerformanceDetails = defineModel<boolean>('showPerformanceDetails', { default: false })

const { t } = useI18n()
const { satisfiesVersion } = useVersion()
const enabled = computed(() => showRankingScore.value || showRankingScoreDetails.value || showPerformanceDetails.value)
</script>

<i18n>
en:
  actions:
    toggle: Debug options
  labels:
    showRankingScore: Show ranking score
    showRankingScoreDetails: Show ranking score details
    showPerformanceDetails: Show performance stats
</i18n>
