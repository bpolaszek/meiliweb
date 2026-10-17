<template>
  <span ref="textElement">{{ self.text }}</span>
</template>

<script setup lang="ts">
import { templateRef } from '@vueuse/core'
import { parseHighlightMarkers, useHighlightTags, useTextHighlight } from '~/composables'

type Props = {
  value: string | number | boolean
}

const props = defineProps<Props>()

// Only the documents page provides tags, and only for the attributes it asked Meilisearch to
// highlight — everywhere else this renders the value untouched.
const highlightTags = useHighlightTags()
const highlighted = computed(() =>
  'string' === typeof props.value && highlightTags.value
    ? parseHighlightMarkers(props.value, highlightTags.value)
    : { text: props.value, matches: [] },
)
const self = reactive({
  textElement: templateRef<HTMLElement>('textElement'),
  text: computed(() => highlighted.value.text),
})

useTextHighlight(
  () => self.textElement,
  () => highlighted.value.matches,
)
</script>
