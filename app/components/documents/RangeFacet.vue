<template>
  <div class="pb-4">
    <h3 class="text-md bg-gray-100 p-4 capitalize">
      {{ humanizeString(facet) }}
    </h3>
    <div class="mt-14 px-12">
      <RangeSlider v-model="value" class="w-full" :min :max :format />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppliedFilters } from '~/utils'
import RangeSlider from '~/components/layout/RangeSlider.vue'
import { useDateFormatter, useIndexLocalSettings } from '~/composables'
import humanizeString from 'humanize-string'

type Props = {
  indexUid: string
  facet: string
  min: number
  max: number
  appliedFilters: AppliedFilters
}

const props = defineProps<Props>()
const { attributesAsDateTime } = useIndexLocalSettings(props.indexUid)
const { formatDate } = useDateFormatter()
const value = ref([props.min, props.max])
const self: any = reactive({
  attributesAsDateTime,
  format: computed(() =>
    self.attributesAsDateTime.includes(props.facet)
      ? (value: number) =>
          formatDate(new Date(value * 1000), {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
          })
      : undefined,
  ),
})
const { format } = toRefs(self)
watch(value, ([min, max]) => props.appliedFilters.applyRangeFilter(props.facet, [min as number, max as number]))
</script>
