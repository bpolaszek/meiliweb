<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <UniqueId as="div" v-slot="{ id }" class="space-y-1 *:block">
      <Label :for="id">{{ t('labels.attributesAsBadges') }}</Label>
      <Textarea class="h-36 w-full" v-model="editableAttributes" />
    </UniqueId>
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
import Label from '~/components/layout/forms/Label.vue'
import Textarea from '~/components/layout/forms/Textarea.vue'
import UniqueId from '~/components/UniqueId.vue'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const localSettings = reactive(useIndexLocalSettings(props.indexUid))
const { value: attributesAsBadges, reset, modified } = resettableRef(localSettings.attributesAsBadges)
const editableAttributes = computed({
  get: () => self.attributesAsBadges.join('\n'),
  set: (value) =>
    (self.attributesAsBadges = value
      .split('\n')
      .map((value: string) => value.trim())
      .filter((value: string) => value.length > 0)),
})

const self: any = reactive({ attributesAsBadges, editableAttributes })
const submit = async () => {
  localSettings.attributesAsBadges = toRaw(self.attributesAsBadges)
  reset(toRaw(self.attributesAsBadges))
}
</script>

<i18n>
en:
  labels:
    attributesAsBadges: Attributes that should be rendered as badges, separated by new lines
</i18n>
