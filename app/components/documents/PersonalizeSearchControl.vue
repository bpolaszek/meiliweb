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
      <div class="w-80 space-y-4 p-4">
        <USwitch v-model="enabled" :label="t('labels.enable')" />

        <div class="flex flex-col gap-1" :class="{ 'opacity-50': !enabled }">
          <Label>{{ t('labels.userContext') }}</Label>
          <Textarea
            v-model="userContext"
            :disabled="!enabled"
            :placeholder="t('labels.userContextPlaceholder')"
            :rows="4" />
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import Label from '~/components/layout/forms/Label.vue'
import Textarea from '~/components/layout/forms/Textarea.vue'

const enabled = defineModel<boolean>('enabled', { default: false })
const userContext = defineModel<string>('userContext', { default: '' })

const { t } = useI18n()
</script>

<i18n>
en:
  actions:
    toggle: Search personalization
  labels:
    enable: Enable search personalization
    userContext: User context
    userContextPlaceholder: Describe the user (preferences, behavior, ...) to personalize results for them
</i18n>
