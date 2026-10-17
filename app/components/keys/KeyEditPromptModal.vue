<template>
  <PromisifiedDialog :title v-slot="{ resolve, close }">
    <form class="space-y-4" @submit.prevent="resolve({ name, description })" @reset.prevent="close()">
      <UFormField :label="t('labels.name')">
        <UInput v-model="name" v-focus autocomplete="off" class="w-full" />
      </UFormField>

      <UFormField :label="t('labels.description')">
        <UTextarea v-model="description" class="w-full" />
      </UFormField>

      <Buttons>
        <Button type="reset" />
        <Button type="submit" />
      </Buttons>
    </form>
  </PromisifiedDialog>
</template>

<script setup lang="ts">
import PromisifiedDialog from '~/components/layout/dialogs/PromisifiedDialog.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import Button from '~/components/layout/forms/Button.vue'

type Props = {
  title?: string
  name?: string | null
  description?: string | null
}
const props = defineProps<Props>()
const { t } = useI18n()
const name = ref(props.name ?? '')
const description = ref(props.description ?? '')
</script>

<i18n>
en:
  labels:
    name: Name
    description: Description
</i18n>
