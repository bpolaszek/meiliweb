<template>
  <ul v-if="renderAsBadges && value.length > 0" class="flex flex-wrap gap-1">
    <Badge as="li" v-for="_value of displayedValues" class="rounded-lg bg-primary-800 px-1.5 py-0.5 text-xs text-white">
      {{ _value }}
    </Badge>
    <li v-if="isTruncated">
      <button @click="showMore = !showMore" class="font-medium text-gray-500">
        <template v-if="showMore">{{ t('labels.showLess') }}</template>
        <template v-else>
          {{ t('labels.showMore', { count: nbRemainingValues }) }}
        </template>
      </button>
    </li>
  </ul>
  <ul v-else-if="value.length > 0" class="list-inside">
    <li v-for="_value of displayedValues" class="flex items-start justify-start gap-1">
      <span class="shrink">-</span>
      <ValueRenderer class="grow" :index-uid="indexUid" :field="field" :value="_value" :level="level + 1" />
    </li>
    <li v-if="isTruncated">
      <button @click="showMore = !showMore" class="text-xs text-primary-500 hover:text-primary-700 focus:outline-none">
        <template v-if="showMore">{{ t('labels.showLess') }}</template>
        <template v-else>
          {{ t('labels.showMore', { count: nbRemainingValues }) }}
        </template>
      </button>
    </li>
  </ul>
  <span v-else class="italic text-gray-400">[]</span>
</template>

<script setup lang="ts">
import ValueRenderer from './ValueRenderer.vue'
import Badge from '~/components/layout/Badge.vue'

type Props = {
  indexUid: string
  field: string
  value: Array<any>
  level: number
}

const MAX_VALUES_TO_DISPLAY = 10
const props = defineProps<Props>()
const { attributesAsBadges } = useIndexLocalSettings(props.indexUid)
const { t } = useI18n()
const self: any = reactive({
  showMore: false,
  displayedValues: computed(() => (self.showMore ? props.value : props.value.slice(0, MAX_VALUES_TO_DISPLAY))),
  nbRemainingValues: computed(() => props.value.length - MAX_VALUES_TO_DISPLAY),
  isTruncated: computed(() => props.value.length > MAX_VALUES_TO_DISPLAY),
  attributesAsBadges,
  renderAsBadges: computed(() => self.attributesAsBadges.includes(props.field)),
})

const { renderAsBadges, displayedValues, isTruncated, showMore, nbRemainingValues } = toRefs(self)
</script>

<i18n>
en:
  labels:
    showMore: Show {count} more...
    showLess: Show less
</i18n>
