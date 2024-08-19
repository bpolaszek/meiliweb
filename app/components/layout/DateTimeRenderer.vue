<template>
  <span v-tippy="value">
    {{ formatDate(displayed, { displayTimeZone: true }) }}
  </span>
</template>

<script setup lang="ts">
import match from 'match-operator'

type Props = {
  indexUid: string
  value: string | number
}

const props = defineProps<Props>()
const { formatDate } = useDateFormatter()
const displayed = computed(() =>
  match(typeof props.value, [
    ['number', new Date((props.value as number) * 1000)],
    ['string', new Date(props.value)],
  ]),
)
</script>
