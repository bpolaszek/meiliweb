import { tryOnScopeDispose, until } from '@vueuse/core'
import type { Batch, Task } from 'meilisearch'
import { useMeiliClient } from '~/composables/useMeiliClient'
import { useCredentials, useVersion } from '~/stores'

/** Meilisearch version that introduced `/tasks/stream` and `/batches/stream`. */
const STREAMING_SINCE = '>=1.52.0'

/** Experimental feature gating both streaming routes. */
const STREAMING_FEATURE = 'tasksStreamingRoute'

const MAX_RETRIES = 5
const BASE_BACKOFF = 1_000
const MAX_BACKOFF = 16_000

/** A connection that stayed up this long is considered healthy, so its retry budget is refilled. */
const STABLE_CONNECTION = 30_000

/** How long we wait for the instance to report its version before giving up on streaming. */
const VERSION_TIMEOUT = 10_000

type StreamResource = 'tasks' | 'batches'

type StreamQuery = Record<string, string | number | Array<string | number> | undefined | null>

type MeiliStreamOptions<T> = {
  /** Same filters as the matching list endpoint — the stream routes accept `TasksFilterQuery`. */
  query?: StreamQuery
  /** Called once per streamed object. The server pushes whole `TaskView` / `BatchView` payloads. */
  onMessage: (item: T) => void
}

/**
 * Subscribes to a Meilisearch task/batch change stream, so pages don't have to poll.
 *
 * The routes are plain SSE (`text/event-stream`, `data: {...}` frames) despite the OpenAPI
 * annotation advertising `application/x-ndjson`. They only accept the API key through an
 * `Authorization` header, which `EventSource` cannot set — so we read the body ourselves
 * through the client's `httpRequest.getStream()` and parse the frames by hand.
 *
 * Going through the client rather than a bare `fetch` keeps host normalisation, the auth
 * header and reactive credential switching in one place. It is safe for a long-lived
 * connection because this app never sets `timeout` on the client config.
 *
 * The stream carries no backlog: it emits objects whose status changed *after* connecting.
 * Callers keep doing their initial `getTasks()` / `getBatches()` fetch and merge from there.
 *
 * `streaming` is `false` until the connection is established, and drops back to `false` for
 * good once the retry budget is spent — callers gate their polling fallback on it.
 */
const useMeiliStream = <T>(resource: StreamResource, options: MeiliStreamOptions<T>) => {
  const meili = useMeiliClient()
  const versionStore = useVersion()
  const { credentials } = toRefs(useCredentials())

  const self = reactive({
    streaming: false,
  })

  let controller: AbortController | null = null
  let stopped = false
  let wakeUp: (() => void) | null = null

  const buildParams = () =>
    Object.fromEntries(
      Object.entries(options.query ?? {})
        .filter(([, value]) => null != value)
        .map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : String(value)]),
    )

  /** Streaming needs both a recent enough instance and the experimental feature switched on. */
  const isSupported = async () => {
    await until(() => unref(versionStore.version)).toBeTruthy({ timeout: VERSION_TIMEOUT, throwOnTimeout: false })
    if (!versionStore.satisfiesVersion(STREAMING_SINCE)) {
      return false
    }
    try {
      const features = (await meili.getExperimentalFeatures()) as Record<string, boolean>
      return true === features[STREAMING_FEATURE]
    } catch {
      // Older instances 404 on this endpoint — degrade to polling rather than fail.
      return false
    }
  }

  /** An SSE frame is a set of lines; we only care about its (possibly multi-line) `data:` payload. */
  const emit = (frame: string) => {
    const data = frame
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice('data:'.length).trimStart())
      .join('\n')
    if ('' === data) {
      // Keep-alive comments and `retry:` hints carry no payload.
      return
    }
    try {
      options.onMessage(JSON.parse(data) as T)
    } catch {
      // A malformed frame must not tear down an otherwise healthy stream.
    }
  }

  const readStream = async (signal: AbortSignal) => {
    const body = await meili.httpRequest.getStream({
      path: `${resource}/stream`,
      params: buildParams(),
      extraRequestInit: { signal, headers: { Accept: 'text/event-stream' } },
    })

    self.streaming = true
    const reader = body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) {
        return
      }
      buffer = (buffer + value).replaceAll('\r\n', '\n')
      // Frames are separated by a blank line, and a chunk may hold several (or half of one).
      let boundary = buffer.indexOf('\n\n')
      while (-1 !== boundary) {
        emit(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
        boundary = buffer.indexOf('\n\n')
      }
    }
  }

  /** Interruptible backoff: disposing the scope resolves it immediately instead of leaving a timer behind. */
  const delay = (ms: number) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, ms)
      wakeUp = () => {
        clearTimeout(timer)
        resolve()
      }
    })

  const run = async () => {
    if (!(await isSupported()) || stopped) {
      return
    }

    let attempt = 0
    while (!stopped && attempt <= MAX_RETRIES) {
      controller = new AbortController()
      const connectedAt = Date.now()

      try {
        await readStream(controller.signal)
      } catch {
        // Network blip, server restart or intentional abort — all handled by the loop below.
      } finally {
        self.streaming = false
      }

      if (stopped) {
        break
      }
      // Only refill the budget for connections that actually held, so a server that accepts
      // then immediately drops us can never spin this loop.
      attempt = Date.now() - connectedAt > STABLE_CONNECTION ? 1 : attempt + 1
      if (attempt > MAX_RETRIES) {
        break
      }
      await delay(Math.min(BASE_BACKOFF * 2 ** (attempt - 1), MAX_BACKOFF))
    }

    self.streaming = false
  }

  const stop = () => {
    stopped = true
    wakeUp?.()
    controller?.abort()
    self.streaming = false
  }

  // Closed on unmount and on navigation away (the page's setup scope is disposed), and on
  // instance switch — `app.vue`'s pageKey then remounts the page, which opens a fresh stream.
  tryOnScopeDispose(stop)
  watch(() => credentials.value?.id, stop)

  run()

  const { streaming } = toRefs(self)

  return { streaming: readonly(streaming), stop }
}

export const useTaskStream = (options: MeiliStreamOptions<Task>) => useMeiliStream<Task>('tasks', options)

export const useBatchStream = (options: MeiliStreamOptions<Batch>) => useMeiliStream<Batch>('batches', options)
