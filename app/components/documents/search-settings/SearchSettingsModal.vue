<template>
  <PromisifiedDialog :title="t('title')" :ui="{ content: 'max-w-3xl', body: 'text-sm max-h-[70vh] overflow-y-auto' }">
    <template #default="{ resolve }">
      <form :id="formId" class="space-y-4" @submit.prevent="resolve(cloneSearchSettings(draft))">
        <HybridSearchSection
          v-if="embedders.length > 0"
          v-model:enabled="draft.hybridEnabled"
          v-model:embedder="draft.hybridEmbedder"
          v-model:semantic-ratio="draft.hybridSemanticRatio"
          :embedders />

        <AttributesSection
          v-model:distinct="draft.distinct"
          v-model:attributes-to-retrieve="draft.attributesToRetrieve"
          v-model:attributes-to-crop="draft.attributesToCrop"
          v-model:attributes-to-highlight="draft.attributesToHighlight"
          v-model:attributes-to-search-on="draft.attributesToSearchOn"
          :attributes
          :primary-key
          :filterable-attributes
          :searchable-attributes />

        <HighlightCropSection
          v-model:highlight-pre-tag="draft.highlightPreTag"
          v-model:highlight-post-tag="draft.highlightPostTag"
          v-model:crop-length="draft.cropLength"
          v-model:crop-marker="draft.cropMarker" />

        <MatchingSection
          v-model:matching-strategy="draft.matchingStrategy"
          v-model:ranking-score-threshold="draft.rankingScoreThreshold" />

        <LocalesSection v-model="draft.locales" />

        <PersonalizationSection v-if="personalizeAvailable" v-model="draft.personalizeUserContext" />

        <DebugSection
          v-model:show-ranking-score="draft.showRankingScore"
          v-model:show-ranking-score-details="draft.showRankingScoreDetails"
          v-model:show-performance-details="draft.showPerformanceDetails" />
      </form>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <Button size="small" type="button" :disabled="isPristine" @click="resetToDefaults()">
          {{ t('buttons.reset') }}
        </Button>
        <Button size="small" type="submit" :form="formId">{{ t('buttons.submit') }}</Button>
      </div>
    </template>
  </PromisifiedDialog>
</template>

<script setup lang="ts">
import PromisifiedDialog from '~/components/layout/dialogs/PromisifiedDialog.vue'
import Button from '~/components/layout/forms/Button.vue'
import { cloneSearchSettings, DEFAULT_SEARCH_SETTINGS, type SearchSettings } from '~/utils'
import AttributesSection from './AttributesSection.vue'
import DebugSection from './DebugSection.vue'
import HighlightCropSection from './HighlightCropSection.vue'
import HybridSearchSection from './HybridSearchSection.vue'
import LocalesSection from './LocalesSection.vue'
import MatchingSection from './MatchingSection.vue'
import PersonalizationSection from './PersonalizationSection.vue'

type Props = {
  settings: SearchSettings
  /** Every attribute the index holds, in display order. */
  attributes: Array<string>
  primaryKey: string
  filterableAttributes: Array<string>
  /** `['*']` where the index searches everything, which is Meilisearch's default. */
  searchableAttributes: Array<string>
  embedders: Array<string>
  personalizeAvailable: boolean
}
const props = defineProps<Props>()

const { t } = useI18n()
// Editing never touches the applied settings: the draft is only handed back on submit, so
// closing the modal any other way (escape, overlay, close button) leaves the search untouched.
const draft = reactive<SearchSettings>(cloneSearchSettings(props.settings))
// Cancelling is what the close button is for — "Reset" is the more useful of the two here, and
// puts every knob back to what Meilisearch does out of the box.
const resetToDefaults = () => Object.assign(draft, cloneSearchSettings(DEFAULT_SEARCH_SETTINGS))
const isPristine = computed(() =>
  (Object.keys(DEFAULT_SEARCH_SETTINGS) as Array<keyof SearchSettings>).every(
    (key) => JSON.stringify(draft[key]) === JSON.stringify(DEFAULT_SEARCH_SETTINGS[key]),
  ),
)
const formId = useId()
</script>

<i18n>
en:
  title: Search settings
  buttons:
    reset: Reset to defaults
    submit: Apply
</i18n>
