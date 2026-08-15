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

      <ul v-else class="grow space-y-4 overflow-y-auto">
        <li v-for="(turn, index) of turns" :key="index" class="flex flex-col gap-2">
          <div :class="['user' === turn.role ? 'self-end bg-primary-600 text-white' : 'bg-gray-100', BUBBLE_CLASSES]">
            <p class="whitespace-pre-wrap">{{ turn.content }}</p>
            <p v-if="turn.progress" class="flex items-center gap-2 text-xs text-gray-500 italic">
              <span class="size-2 animate-pulse rounded-full bg-primary-600" />
              {{ progressLabel(turn.progress) }}
            </p>
            <span v-else-if="'assistant' === turn.role && streaming && !turn.content" class="text-xs text-gray-500">
              {{ t('thinking') }}
            </span>
          </div>
          <ChatSources v-if="turn.sources.length" :documents="turn.sources" class="max-w-2xl" />
        </li>
      </ul>

      <form class="flex flex-col gap-2 border-t border-gray-200 pt-4" @submit.prevent="submit()">
        <div class="flex items-end gap-2">
          <textarea
            v-model="prompt"
            v-focus
            rows="2"
            :placeholder="t('placeholders.prompt')"
            class="form-input grow resize-none text-sm"
            @keydown.enter.exact.prevent="submit()" />
          <Button v-if="streaming" type="button" theme="danger" icon="mdi:stop" @click="stop()">
            {{ t('actions.stop') }}
          </Button>
          <Button v-else type="submit" theme="primary" icon="heroicons:paper-airplane" :disabled="!prompt.trim()">
            {{ t('actions.send') }}
          </Button>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <label class="flex items-center gap-2 text-xs text-gray-500">
            {{ t('labels.model') }}
            <input v-model="model" class="form-input w-56 text-xs" :placeholder="DEFAULT_MODEL" />
          </label>
          <label v-tippy="t('hints.accessKey')" class="flex items-center gap-2 text-xs text-gray-500">
            {{ t('labels.accessKey') }}
            <input
              v-model="accessKey"
              type="password"
              autocomplete="off"
              class="form-input w-56 text-xs"
              :placeholder="t('placeholders.accessKey')" />
          </label>
        </div>
      </form>
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
import { useChatCompletion, type ChatProgress } from '~/composables'
import { useCredentials, useChatAvailability, type CredentialsRecord } from '~/stores'
import { safeToRefs } from '~/utils'

const BUBBLE_CLASSES = 'flex max-w-2xl flex-col gap-2 rounded-lg px-4 py-3 text-sm'

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
    prompt: Ask a question... (Enter to send, Shift+Enter for a new line)
    accessKey: Defaults to your instance key
  actions:
    backToList: Back to workspaces
    settings: Settings
    send: Send
    stop: Stop
    clear: Clear
</i18n>
