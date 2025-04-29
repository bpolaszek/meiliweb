<template>
  <PromisifiedDialog :title v-slot="{ resolve, close }">
    <form class="space-y-4" @submit.prevent="resolve(newindexUid)" @reset.prevent="close()">
      <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.indexUid') }}</Label>
        <input v-model="newindexUid" required v-focus autocomplete="off" type="text" class="form-input" />
      </UniqueId>

      <Buttons>
        <Button type="submit" />
      </Buttons>
    </form>
  </PromisifiedDialog>
</template>

<script setup lang="ts">
import PromisifiedDialog from '~/components/layout/dialogs/PromisifiedDialog.vue'
import Label from '~/components/layout/forms/Label.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import Button from '~/components/layout/forms/Button.vue'

type Props = {
  title?: string
  indexUid?: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const newindexUid = ref(props.indexUid ?? '')
</script>

<i18n>
en:
  labels:
    indexUid: Index name
</i18n>
