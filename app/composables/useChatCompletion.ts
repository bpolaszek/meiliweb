import { tryOnScopeDispose } from '@vueuse/core'
import { CHAT_TOOLS, useChatWorkspaces, type ChatMessage } from './useChatWorkspaces'

/** One entry of `_meiliSearchSources`; the document itself is arbitrary user data. */
export type ChatSourceDocument = Record<string, any> & { indexUid?: string }

export type ChatTurn = {
  role: 'user' | 'assistant'
  content: string
  /** Documents Meilisearch used to ground this answer, streamed through `_meiliSearchSources`. */
  sources: ChatSourceDocument[]
  /** Latest `_meiliSearchProgress` message, cleared once the answer starts coming in. */
  progress: string | null
}

type OpenAiDelta = {
  content?: string | null
  tool_calls?: Array<{
    index?: number
    function?: { name?: string; arguments?: string }
  }>
}

/**
 * Drives one conversation against `POST /chats/{workspace}/chat/completions`.
 *
 * The route speaks the OpenAI streaming protocol: SSE frames carrying
 * `choices[0].delta`, terminated by a `data: [DONE]` sentinel. On top of that, Meilisearch
 * calls back two tools — `_meiliSearchProgress` while it searches, `_meiliSearchSources`
 * with the documents it grounded the answer on — but only if the request declares them,
 * which is why {@link CHAT_TOOLS} is always sent.
 *
 * Tool call `arguments` arrive in fragments that have to be concatenated per tool call
 * before they parse as JSON.
 */
export const useChatCompletion = (workspace: string) => {
  const { streamCompletion } = useChatWorkspaces()

  const self = reactive({
    turns: [] as ChatTurn[],
    streaming: false,
    error: null as string | null,
  })

  let controller: AbortController | null = null

  const stop = () => {
    controller?.abort()
    controller = null
    self.streaming = false
  }

  // Abort on unmount, on navigation away and on instance switch (`app.vue`'s pageKey
  // remounts the page), so a half-read stream never outlives the component.
  tryOnScopeDispose(stop)

  const applyDelta = (turn: ChatTurn, delta: OpenAiDelta, toolArguments: Map<number, string>) => {
    if (delta.content) {
      turn.content += delta.content
      // The answer has started, so whatever the search was reporting is now stale.
      turn.progress = null
    }

    for (const [position, call] of (delta.tool_calls ?? []).entries()) {
      const index = call.index ?? position
      const name = call.function?.name
      const buffered = (toolArguments.get(index) ?? '') + (call.function?.arguments ?? '')
      toolArguments.set(index, buffered)

      let parsed: any
      try {
        parsed = JSON.parse(buffered)
      } catch {
        // Arguments are still arriving in fragments — wait for the rest.
        continue
      }

      if ('_meiliSearchSources' === name) {
        turn.sources = Array.isArray(parsed) ? parsed : parsed?.sources ?? []
      } else if ('_meiliSearchProgress' === name) {
        turn.progress = parsed?.message ?? parsed?.status ?? null
      }
      toolArguments.delete(index)
    }
  }

  /** An SSE frame is a set of lines; only its (possibly multi-line) `data:` payload matters. */
  const payloadOf = (frame: string) =>
    frame
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice('data:'.length).trimStart())
      .join('\n')

  const send = async (prompt: string, model: string) => {
    if (self.streaming || !prompt.trim()) {
      return
    }

    self.error = null
    self.turns.push({ role: 'user', content: prompt.trim(), sources: [], progress: null })
    const turn: ChatTurn = { role: 'assistant', content: '', sources: [], progress: null }
    self.turns.push(turn)

    // History is sent verbatim, minus our own display-only fields.
    const messages: ChatMessage[] = self.turns
      .filter((candidate) => candidate !== turn)
      .map(({ role, content }) => ({ role, content }))

    controller = new AbortController()
    self.streaming = true

    try {
      const body = await streamCompletion(
        workspace,
        { model, messages, stream: true, tools: CHAT_TOOLS },
        controller.signal,
      )
      const reader = body.pipeThrough(new TextDecoderStream()).getReader()
      const toolArguments = new Map<number, string>()
      let buffer = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        buffer = (buffer + value).replaceAll('\r\n', '\n')
        // Frames are separated by a blank line; a chunk may hold several, or half of one.
        let boundary = buffer.indexOf('\n\n')
        while (-1 !== boundary) {
          const data = payloadOf(buffer.slice(0, boundary))
          buffer = buffer.slice(boundary + 2)
          boundary = buffer.indexOf('\n\n')

          if ('' === data || '[DONE]' === data) {
            continue
          }
          try {
            applyDelta(turn, JSON.parse(data)?.choices?.[0]?.delta ?? {}, toolArguments)
          } catch {
            // A malformed frame must not tear down an otherwise healthy answer.
          }
        }
      }
    } catch (e: any) {
      // Aborting is a user action ("stop"), not a failure worth reporting.
      if ('AbortError' !== e?.name) {
        self.error = e?.message ?? String(e)
      }
    } finally {
      self.streaming = false
      controller = null
      turn.progress = null
    }
  }

  const clear = () => {
    stop()
    self.turns = []
    self.error = null
  }

  const { turns, streaming, error } = toRefs(self)

  return { turns, streaming, error, send, stop, clear }
}
