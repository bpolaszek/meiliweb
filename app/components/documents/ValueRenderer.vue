<template>
  <Component
    v-if="component"
    :is="component"
    :index-uid="indexUid"
    :field="field"
    :value="value"
    :level="level" />
  <span v-else-if="null == value" class="italic text-gray-400">null</span>
  <a
    v-else-if="'string' == typeof value && value.startsWith('http')"
    :href="value"
    target="_blank"
    class="break-all text-pink-600 underline">
    {{ value }}
  </a>
  <span v-else-if="'object' === typeof value">{{ prettify(value) }}</span>
  <Badge v-else-if="renderAsBadge">{{ value }}</Badge>
  <StringRenderer :value v-else>{{ value }}</StringRenderer>
</template>

<script setup lang="ts">
import { stringify } from 'yaml'
import Badge from '~/components/layout/Badge.vue'
import StringRenderer from '~/components/documents/StringRenderer.vue'

type Props = {
  indexUid: string
  field: string
  value: any
  level: number
}

const props = defineProps<Props>()
const prettify = (object: any) => stringify(object)
const ArrayValueRenderer = defineAsyncComponent(
  () => import('./ArrayValueRenderer.vue'),
)
const ObjectValueRenderer = defineAsyncComponent(
  () => import('./ObjectValueRenderer.vue'),
)
const DateTimeRenderer = defineAsyncComponent(
  () => import('../layout/DateTimeRenderer.vue'),
)

const localSettings = reactive(useIndexLocalSettings(props.indexUid))
const { attributesAsBadges } = toRefs(localSettings)
const component = computed(() => {
  if (localSettings.attributesAsDateTime.includes(props.field)) {
    return DateTimeRenderer
  }
  if (Array.isArray(props.value)) {
    return ArrayValueRenderer
  }
  if (
    null != props.value &&
    'object' === typeof props.value &&
    0 === props.level
  ) {
    return ObjectValueRenderer
  }
})

const self: any = reactive({
  attributesAsBadges,
  renderAsBadge: computed(() => self.attributesAsBadges.includes(props.field)),
})
const { renderAsBadge } = toRefs(self)
</script>
