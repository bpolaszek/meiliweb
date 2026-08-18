<template>
  <UPopover>
    <button v-tippy="t('actions.toggle')" type="button">
      <Icon
        name="ph:identification-badge-fill"
        :class="[
          'size-6',
          enabled ? 'text-primary-600 hover:text-primary-800' : 'text-gray-600 hover:text-gray-800',
        ]" />
    </button>

    <template #content>
      <form class="w-80 space-y-4 p-4" @reset.prevent="cancelDraft()" @submit.prevent="submitDraft()">
        <USwitch v-model="enabled" :label="t('labels.enable')" />

        <div class="flex flex-col gap-1" :class="{ 'opacity-50': !enabled }">
          <Label>{{ t('labels.userContext') }}</Label>
          <Textarea
            v-model="userContextDraft"
            :disabled="!enabled"
            :placeholder="t('labels.userContextPlaceholder')"
            :rows="4" />
        </div>

        <Buttons class="justify-end">
          <Button size="small" type="reset" :disabled="!modified">{{ t('buttons.reset') }}</Button>
          <Button size="small" type="submit" :disabled="!modified">{{ t('buttons.ok') }}</Button>
        </Buttons>
      </form>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import Label from '~/components/layout/forms/Label.vue'
import Textarea from '~/components/layout/forms/Textarea.vue'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import { resettableRef } from '~/utils'

const enabled = defineModel<boolean>('enabled', { default: false })
const userContext = defineModel<string>('userContext', { default: '' })

const { t } = useI18n()

// Edit a local draft and only commit it to the actual model on submit, so the persisted
// user context (read by the explicit "rerank" action in DocumentsFooter) doesn't churn on
// every keystroke.
const { value: userContextDraft, reset: resetDraft, modified } = resettableRef(userContext.value)
watch(userContext, (value) => resetDraft(value))

const submitDraft = () => {
  userContext.value = userContextDraft.value
}
const cancelDraft = () => resetDraft()
</script>

<i18n>
en:
  actions:
    toggle: Search personalization
  labels:
    enable: Enable search personalization
    userContext: User context
    userContextPlaceholder: Describe the user (preferences, behavior, ...) to personalize results for them
  buttons:
    reset: Reset
    ok: OK
</i18n>
