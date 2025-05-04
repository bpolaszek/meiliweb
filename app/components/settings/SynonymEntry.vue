<template>
  <div class="grid grid-cols-12 space-x-4">
    <UniqueId v-slot="{ id }" as="div" class="col-span-4 space-y-2">
      <div class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.mainWord') }}</Label>
        <input v-model="synonym[0]" required autocomplete="off" type="text" class="form-input w-full text-sm" />
      </div>
      <Button
        type="button"
        size="small"
        theme="primary"
        icon="mdi:bin"
        @click="$emit('remove', synonym[0])"
        class="w-auto">
        {{ t('actions.remove') }}
      </Button>
    </UniqueId>
    <UniqueId v-slot="{ id }" as="div" class="col-span-8">
      <Label required :for="id">{{ t('labels.synonyms') }}</Label>
      <SplitLinesTextarea v-model="synonym[1]" class="h-20 w-full text-sm" />
    </UniqueId>
  </div>
</template>

<script setup lang="ts">
import Label from '~/components/layout/forms/Label.vue'
import SplitLinesTextarea from '~/components/layout/forms/SplitLinesTextarea.vue'
import Button from '~/components/layout/forms/Button.vue'

type Props = {
  synonym: [string, string[]]
}
defineProps<Props>()

const { t } = useI18n()
</script>

<i18n>
en:
  labels:
    mainWord: Main word
    synonyms: Synonyms, separated by new lines
  actions:
    remove: Remove
</i18n>
