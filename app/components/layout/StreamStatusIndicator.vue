<template>
  <div v-if="dot" class="mb-3 flex items-center gap-2 text-xs" :class="textClass">
    <span class="size-2 rounded-full" :class="[dotClass, 'reconnecting' !== status && 'animate-pulse']" />
    {{ label }}
    <Button v-if="'disconnected' === status" theme="primary" size="small" icon="mdi:refresh" @click="emit('reconnect')">
      {{ t('buttons.reconnect') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import match from 'match-operator'
import type { StreamStatus } from '~/composables'
import Button from '~/components/layout/forms/Button.vue'

type Props = {
  status: StreamStatus
}
const props = defineProps<Props>()
const emit = defineEmits(['reconnect'])
const { t } = useI18n()

// Nothing shown while still connecting for the first time, or when the instance/feature simply
// doesn't support streaming — that case is a silent, permanent fallback to polling.
const dot = computed(() => !['connecting', 'unsupported'].includes(props.status))

const label = computed(() =>
  match(props.status, [
    ['streaming', t('labels.live')],
    ['reconnecting', t('labels.reconnecting')],
    ['disconnected', t('labels.disconnected')],
    [match.default, ''],
  ]),
)

const textClass = computed(() => ('disconnected' === props.status ? 'text-red-600' : 'text-gray-500'))
const dotClass = computed(() =>
  match(props.status, [
    ['streaming', 'bg-primary-600'],
    ['reconnecting', 'bg-amber-500'],
    ['disconnected', 'bg-red-500'],
    [match.default, 'bg-gray-400'],
  ]),
)
</script>

<i18n>
en:
  labels:
    live: Live
    reconnecting: Reconnecting…
    disconnected: Disconnected — live updates paused
  buttons:
    reconnect: Reconnect
</i18n>
