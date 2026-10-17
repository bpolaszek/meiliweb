<template>
  <PromisifiedDialog :title="t('title')" v-slot="{ resolve, close }">
    <form class="space-y-4" @submit.prevent="resolve(uid)" @reset.prevent="close()">
      <UFormField :label="t('labels.uid')" :help="t('hints.uid')" required>
        <UInput v-model="uid" required v-focus autocomplete="off" class="w-full" />
      </UFormField>

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
