<template>
  <Alert theme="warning" :title="t('title')">
    <p v-if="!versionSupported">{{ t('reasons.version', { version: CHAT_MIN_VERSION }) }}</p>
    <p v-else>
      {{ t('reasons.experimental') }}
      <NuxtLink to="/experimental-features" class="font-medium underline">
        {{ t('actions.enable') }}
      </NuxtLink>
    </p>
  </Alert>
</template>

<script setup lang="ts">
import Alert from '~/components/layout/Alert.vue'
import { CHAT_MIN_VERSION, useChatAvailability } from '~/stores'
import { safeToRefs } from '~/utils'

const { t } = useI18n()
const { versionSupported } = safeToRefs(useChatAvailability())
</script>

<i18n>
en:
  title: Conversational search is not available
  reasons:
    version: 'Chat workspaces require Meilisearch {version}. This instance runs an older version.'
    experimental: The chatCompletions experimental feature is disabled on this instance.
  actions:
    enable: Enable it in experimental features.
</i18n>
