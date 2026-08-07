import { useMeiliClient } from './useMeiliClient'

/**
 * Chat workspaces (conversational search). Most routes are covered by the official client
 * (`meili.chat(uid)`), but two things are not, so those go through `meili.httpRequest`:
 *
 * - deleting a workspace: `DELETE /chats/{uid}` has no client method;
 * - chat completions: `streamCompletion()` accepts neither an `AbortSignal` nor the `tools`
 *   field, and without declaring the tools Meilisearch never streams back its sources.
 *
 * @see https://www.meilisearch.com/docs/reference/api/chats
 */

export const CHAT_SOURCES = ['openAi', 'azureOpenAi', 'mistral', 'gemini', 'vLlm'] as const
export type ChatSource = (typeof CHAT_SOURCES)[number]

/**
 * Meilisearch 1.15+ accepts more prompt overrides than `ChatWorkspaceSettings` declares in
 * meilisearch@0.59.0, so the shape is spelled out here rather than imported.
 * On PATCH, an omitted field is left untouched while an explicit `null` resets it.
 */
export type ChatWorkspacePrompts = {
  system?: string | null
  searchDescription?: string | null
  searchQParam?: string | null
  searchFilterParam?: string | null
  searchIndexUidParam?: string | null
}

export type ChatWorkspaceSettings = {
  source: ChatSource
  orgId?: string | null
  projectId?: string | null
  apiVersion?: string | null
  deploymentId?: string | null
  baseUrl?: string | null
  /** Always redacted by Meilisearch when read back — never display or log it. */
  apiKey?: string | null
  prompts?: ChatWorkspacePrompts | null
}

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type ChatCompletionBody = {
  model: string
  messages: ChatMessage[]
  stream: true
  tools?: Array<{ type: 'function'; function: { name: string; description?: string } }>
}

/**
 * Tools Meilisearch injects into the completion when the client declares them: one reports
 * search progress, the other streams back the documents used to ground the answer.
 */
export const CHAT_TOOLS: NonNullable<ChatCompletionBody['tools']> = [
  {
    type: 'function',
    function: {
      name: '_meiliSearchProgress',
      description: 'Reports real-time search progress to the user',
    },
  },
  {
    type: 'function',
    function: {
      name: '_meiliSearchSources',
      description: 'Provides sources and references for the information',
    },
  },
]

export const useChatWorkspaces = () => {
  const meili = useMeiliClient()

  const list = () => meili.getChatWorkspaces()

  const getSettings = (uid: string) => meili.chat(uid).get() as Promise<ChatWorkspaceSettings>

  const updateSettings = (uid: string, settings: Partial<ChatWorkspaceSettings>) =>
    meili.httpRequest.patch<ChatWorkspaceSettings>({ path: `chats/${uid}/settings`, body: settings })

  const resetSettings = (uid: string) => meili.chat(uid).reset()

  const remove = (uid: string) => meili.httpRequest.delete({ path: `chats/${uid}` })

  const streamCompletion = (uid: string, body: ChatCompletionBody, signal?: AbortSignal) =>
    meili.httpRequest.postStream({
      path: `chats/${uid}/chat/completions`,
      body,
      extraRequestInit: { signal },
    })

  return { list, getSettings, updateSettings, resetSettings, remove, streamCompletion }
}
