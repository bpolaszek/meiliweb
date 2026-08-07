<template>
  <PromisifiedDialog :title="t('title')" v-slot="{ resolve, close }">
    <form class="space-y-4" @submit.prevent="resolve(uid)" @reset.prevent="close()">
      <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.uid') }}</Label>
        <input v-model="uid" required v-focus autocomplete="off" type="text" class="form-input" />
        <p class="text-sm font-light text-gray-500">{{ t('hints.uid') }}</p>
      </UniqueId>

      <Buttons>
        <Button type="submit" />
      </Buttons>
    </form>
  </PromisifiedDialog>
</template>

<script setup lang="ts">
import PromisifiedDialog from '~/components/layout/dialogs/PromisifiedDialog.vue'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import Label from '~/components/layout/forms/Label.vue'

const { t } = useI18n()
const uid = ref('')
</script>

<i18n>
en:
  title: New chat workspace
  labels:
    uid: Workspace name
  hints:
    uid: The workspace is created once you save its settings.
</i18n>
