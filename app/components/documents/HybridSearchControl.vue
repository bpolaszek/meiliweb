<template>
  <UPopover>
    <button v-tippy="t('actions.toggle')" type="button">
      <Icon
        name="ph:magic-wand-fill"
        :class="[
          'size-6',
          enabled ? 'text-primary-600 hover:text-primary-800' : 'text-gray-600 hover:text-gray-800',
        ]" />
    </button>

    <template #content>
      <div class="w-72 space-y-4 p-4">
        <USwitch v-model="enabled" :label="t('labels.enable')" />

        <div class="flex flex-col gap-1" :class="{ 'opacity-50': !enabled }">
          <Label>{{ t('labels.embedder') }}</Label>
          <Select v-model="embedder" :disabled="!enabled" class="w-full">
            <option v-for="name of embedders" :key="name" :value="name">{{ name }}</option>
          </Select>
        </div>

        <div class="flex flex-col gap-2" :class="{ 'opacity-50': !enabled }">
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>{{ t('labels.keywordSearch') }}</span>
            <span>{{ t('labels.semanticSearch') }}</span>
          </div>
          <RangeSlider
            v-model="semanticRatio"
            :min="0"
            :max="1"
            :step="0.01"
            :disabled="!enabled"
            :format="formatRatio"
            class="w-full" />
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import Label from '~/components/layout/forms/Label.vue'
import Select from '~/components/layout/forms/Select.vue'
import RangeSlider from '~/components/layout/RangeSlider.vue'

type Props = {
  embedders: string[]
}
defineProps<Props>()

const enabled = defineModel<boolean>('enabled', { default: false })
const embedder = defineModel<string | null>('embedder', { default: null })
const semanticRatio = defineModel<number>('semanticRatio', { default: 0.5 })

const { t } = useI18n()
const formatRatio = (value: number) => `${Math.round(value * 100)}%`
</script>

<i18n>
en:
  actions:
    toggle: Hybrid search (semantic + keyword)
  labels:
    enable: Enable hybrid search
    embedder: Embedder
    keywordSearch: Keyword
    semanticSearch: Semantic
</i18n>
