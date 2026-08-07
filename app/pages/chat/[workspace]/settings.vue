<template>
  <Layout :title="workspace" :subtitle="t('subtitle')">
    <template #title-actions>
      <NuxtLink v-tippy="t('actions.backToList')" to="/chat">
        <Icon name="gg:list" />
      </NuxtLink>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/chats" />
    </template>
    <template #actions>
      <Button v-if="available" :as="NuxtLink" :to="`/chat/${workspace}`" icon="heroicons:chat-bubble-left-right">
        {{ t('actions.openChat') }}
      </Button>
    </template>

    <ChatUnavailableAlert v-if="!available" />

    <ChatWorkspaceSettingsForm v-else :uid="workspace" :settings="settings" @saved="settings = $event" />
  </Layout>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import { until } from '@vueuse/core'
import ChatUnavailableAlert from '~/components/chat/ChatUnavailableAlert.vue'
import ChatWorkspaceSettingsForm from '~/components/chat/ChatWorkspaceSettingsForm.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Button from '~/components/layout/forms/Button.vue'
import { useChatWorkspaces, type ChatWorkspaceSettings } from '~/composables'
import { useChatAvailability } from '~/stores'
import { safeToRefs, tryOrThrow } from '~/utils'

const { t } = useI18n()
const route = useRoute()
const workspace = route.params.workspace as string

// Register lifecycle-bound composables before the first `await` so they keep their component context.
useHead({ title: `${workspace} - ${t('title')}` })

const { getSettings } = useChatWorkspaces()
const { available, loading } = safeToRefs(useChatAvailability())

// Both gates resolve asynchronously; wait before calling /chats, which answers 404 on an
// instance where the feature is off.
await until(loading).toBe(false)

// A workspace that has never been configured has no settings yet — Meilisearch answers 404
// rather than defaults, which is a normal state right after creation, not an error.
const settings = ref<ChatWorkspaceSettings>(
  available.value
    ? await tryOrThrow(async () => {
        try {
          return await getSettings(workspace)
        } catch {
          return { source: 'openAi' } as ChatWorkspaceSettings
        }
      })
    : ({ source: 'openAi' } as ChatWorkspaceSettings),
)
</script>

<i18n>
en:
  title: Chat settings
  subtitle: LLM provider and prompts for this workspace.
  actions:
    backToList: Back to workspaces
    openChat: Open chat
</i18n>
