<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <UFormField :label="t('labels.nameAttribute')" :help="t('help.nameAttribute')">
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
if (localSettings.nameAttribute && !props.fields.includes(localSettings.nameAttribute)) {
  localSettings.nameAttribute = null
}

const attributeItems = computed(() => [
  { label: t('labels.autoDetect'), value: AUTO_DETECT },
  ...props.fields.map((field) => ({ label: field, value: field })),
])

const { value: nameAttribute, reset, modified } = resettableRef(localSettings.nameAttribute)
const editableAttribute = computed({
  get: () => nameAttribute.value ?? AUTO_DETECT,
  set: (value: string) => (nameAttribute.value = AUTO_DETECT === value ? null : value),
})

const submit = async () => {
  localSettings.nameAttribute = toRaw(nameAttribute.value)
  reset(toRaw(nameAttribute.value))
}
</script>

<i18n>
en:
  labels:
    nameAttribute: Attribute used as the document name
    autoDetect: Auto-detect (default)
  help:
    nameAttribute: By default, the name shown for a document is guessed from a `name`, `title`, `label` or
      `id` attribute, in that order. Pick an attribute here to always use it instead.
</i18n>
