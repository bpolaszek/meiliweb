<template>
  <Layout :title="workspace" :subtitle="t('subtitle')">
    <template #title-actions>
      <NuxtLink v-tippy="t('actions.backToList')" to="/chat">
        <Icon name="gg:list" />
      </NuxtLink>
      <DocumentationLink href="https://www.meilisearch.com/docs/capabilities/conversational_search/overview" />
    </template>
    <template #actions>
      <Button :as="NuxtLink" :to="`/chat/${workspace}/settings`" icon="heroicons:cog-6-tooth">
        {{ t('actions.settings') }}
      </Button>
      <Button v-if="turns.length" icon="heroicons:trash" :disabled="streaming" @click="clear()">
        {{ t('actions.clear') }}
      </Button>
    </template>

    <ChatUnavailableAlert v-if="!available" />

    <div v-else class="flex h-full flex-col gap-4">
      <Alert v-if="error" dismissable theme="danger" @close="error = null">
        {{ error }}
      </Alert>

      <div v-if="!turns.length" class="flex grow flex-col items-center justify-center gap-4 text-gray-500">
        <p class="text-5xl font-light">💬</p>
        <p class="text-lg font-light">{{ t('empty') }}</p>
      </div>

      <UChatMessages
        v-else
        :messages="messages"
        :status="status"
        should-auto-scroll
        class="min-h-0 grow"
        :assistant="{ side: 'left', variant: 'soft' }"
        :user="{ side: 'right', variant: 'solid', color: 'primary' }">
        <template #content="{ message }">
          <p class="whitespace-pre-wrap">{{ contentOf(message) }}</p>
          <p v-if="progressOf(message)" class="flex items-center gap-2 text-xs text-gray-500 italic">
            <span class="size-2 animate-pulse rounded-full bg-primary-600" />
            {{ progressLabel(progressOf(message)!) }}
          </p>
          <span v-else-if="isThinking(message)" class="text-xs text-gray-500">{{ t('thinking') }}</span>
          <ChatSources v-if="sourcesOf(message).length" :documents="sourcesOf(message)" class="mt-2 max-w-2xl" />
        </template>
      </UChatMessages>

      <UChatPrompt v-model="prompt" v-focus :status :maxrows="4" @submit="submit()">
        <UChatPromptSubmit @stop="stop()" />
      </UChatPrompt>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
        <UFormField :label="t('labels.model')">
          <UInput v-model="model" size="xs" class="w-56" :placeholder="DEFAULT_MODEL" />
        </UFormField>
        <UFormField v-tippy="t('hints.accessKey')" :label="t('labels.accessKey')">
          <UInput
            v-model="accessKey"
            type="password"
            autocomplete="off"
            size="xs"
            class="w-56"
            :placeholder="t('placeholders.accessKey')" />
        </UFormField>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import { until, useLocalStorage } from '@vueuse/core'
import ChatSources from '~/components/chat/ChatSources.vue'
import ChatUnavailableAlert from '~/components/chat/ChatUnavailableAlert.vue'
import Alert from '~/components/layout/Alert.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Button from '~/components/layout/forms/Button.vue'
import { useChatCompletion, type ChatProgress, type ChatTurn } from '~/composables'
import { useCredentials, useChatAvailability, type CredentialsRecord } from '~/stores'
import { safeToRefs } from '~/utils'

/** Meilisearch forwards `model` to the provider as-is, so it has to come from the user. */
const DEFAULT_MODEL = 'gpt-4o-mini'

const { t } = useI18n()
const route = useRoute()
const workspace = route.params.workspace as string

// Register lifecycle-bound composables before the first `await` so they keep their component context.
useHead({ title: `${workspace} - ${t('title')}` })

const { available, loading } = safeToRefs(useChatAvailability())

// The model and the access key are per-instance, per-workspace preferences, not workspace
// settings: Meilisearch stores neither, so they live in localStorage next to the credentials.
const { credentials } = useCredentials()
const preference = `${(credentials as CredentialsRecord).baseUri}-chat-${workspace}`
const model = useLocalStorage(`${preference}-model`, DEFAULT_MODEL)
const accessKey = useLocalStorage(`${preference}-access-key`, '')

const { turns, streaming, error, send, stop, clear } = useChatCompletion(workspace, accessKey)
const prompt = ref('')

// `UChatMessages`/`UChatPrompt` speak the AI SDK message shape; the index doubles as the id
// since turns are never reordered, only appended to or replaced wholesale by `clear()`.
const messages = computed(() =>
  turns.value.map((turn, index) => ({
    id: String(index),
    role: turn.role,
    parts: [{ type: 'text' as const, text: turn.content }],
  })),
)
const status = computed(() => (streaming.value ? 'streaming' : 'ready'))

const turnOf = (message: { id: string }): ChatTurn => turns.value[Number(message.id)]
const contentOf = (message: { id: string }) => turnOf(message).content
const sourcesOf = (message: { id: string }) => turnOf(message).sources
const progressOf = (message: { id: string }) => turnOf(message).progress
const isThinking = (message: { id: string }) =>
  streaming.value && 'assistant' === message.role && !turnOf(message).content && !turnOf(message).progress

const submit = async () => {
  const value = prompt.value
  prompt.value = ''
  await send(value, model.value || DEFAULT_MODEL)
}

const progressLabel = ({ indexUid: index, query, filter }: ChatProgress) => {
  if (query && filter) {
    return t('progress.queryAndFilter', { index, query, filter })
  }
  if (query) {
    return t('progress.query', { index, query })
  }
  if (filter) {
    return t('progress.filter', { index, filter })
  }
  return t('progress.index', { index })
}

await until(loading).toBe(false)
</script>

<i18n>
en:
  title: Chat
  subtitle: Ask questions about your indexes.
  empty: Ask anything about the indexes this workspace can search.
  thinking: Thinking...
  progress:
    index: 'Searching {index}...'
    query: 'Searching {index} for "{query}"...'
    filter: 'Searching {index} with filter {filter}...'
    queryAndFilter: 'Searching {index} for "{query}" with filter {filter}...'
  labels:
    model: Model
    accessKey: API key
  hints:
    accessKey: Meilisearch key the conversation runs under. A scoped key or a tenant token restricts the indexes and documents the LLM can search.
  placeholders:
    accessKey: Defaults to your instance key
  actions:
    backToList: Back to workspaces
    settings: Settings
    send: Send
    stop: Stop
    clear: Clear
</i18n>
