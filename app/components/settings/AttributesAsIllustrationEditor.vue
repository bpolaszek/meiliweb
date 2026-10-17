<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <UFormField :label="t('labels.illustrationAttribute')" :help="t('help.illustrationAttribute')">
      <USelect v-model="editableAttribute" :items="attributeItems" class="w-full sm:w-80" />
    </UFormField>
    <footer class="flex flex-col items-center justify-end sm:flex-row">
      <Buttons>
        <Button type="reset" :disabled="!modified" />
        <Button type="submit" :disabled="!modified" />
      </Buttons>
    </footer>
  </form>
</template>

<script setup lang="ts">
import { useIndexLocalSettings } from '~/composables'
import { resettableRef } from '~/utils'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'

type Props = {
  indexUid: string
  fields: Array<string>
}
const props = defineProps<Props>()
const { t } = useI18n()
const localSettings = reactive(useIndexLocalSettings(props.indexUid))

// `USelect` reserves the empty string for "no selection", so auto-detect needs its own sentinel.
const AUTO_DETECT = '__auto__'

// A previously chosen attribute may no longer exist on this index's documents (removed, renamed) —
// silently fall back to auto-detect rather than keep pointing at a field that isn't there anymore.
if (localSettings.illustrationAttribute && !props.fields.includes(localSettings.illustrationAttribute)) {
  localSettings.illustrationAttribute = null
}

const attributeItems = computed(() => [
  { label: t('labels.autoDetect'), value: AUTO_DETECT },
  ...props.fields.map((field) => ({ label: field, value: field })),
])

const { value: illustrationAttribute, reset, modified } = resettableRef(localSettings.illustrationAttribute)
const editableAttribute = computed({
  get: () => illustrationAttribute.value ?? AUTO_DETECT,
  set: (value: string) => (illustrationAttribute.value = AUTO_DETECT === value ? null : value),
})

const submit = async () => {
  localSettings.illustrationAttribute = toRaw(illustrationAttribute.value)
  reset(toRaw(illustrationAttribute.value))
}
</script>

<i18n>
en:
  labels:
    illustrationAttribute: Attribute used as the document illustration
    autoDetect: Auto-detect (default)
  help:
    illustrationAttribute: By default, the illustration shown on document cards is guessed from the first
      attribute that looks like an image URL. Pick an attribute here to always use it instead.
</i18n>
