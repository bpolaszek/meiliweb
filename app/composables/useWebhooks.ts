import { useMeiliClient } from './useMeiliClient'

/**
 * Webhooks are global to a Meilisearch instance (not per-index).
 * The official JS client (meilisearch@0.51.0) does not expose them yet, so we
 * talk to the REST API directly through the client's `httpRequest`. Going
 * through `useMeiliClient()` keeps reactive credential switching working.
 *
 * @see https://www.meilisearch.com/docs/reference/api/webhooks
 */
export type Webhook = {
  uuid: string
  url: string | null
  headers: Record<string, string> | null
  /** Webhooks defined via the `--task-webhook-url` CLI flag are read-only. */
  isEditable: boolean
}

/**
 * Meilisearch redacts the value of sensitive headers (e.g. `Authorization`) in
 * its responses, replacing the secret with a string containing this marker.
 * We use it to detect values that must NOT be sent back on update, otherwise we
 * would overwrite the real secret with its masked representation.
 */
export const WEBHOOK_REDACTION_MARKER = 'XXX...'

/** Meilisearch caps the number of editable (user-defined) webhooks. */
export const WEBHOOK_MAX_EDITABLE = 5

export const isRedactedHeaderValue = (value: string) => value.includes(WEBHOOK_REDACTION_MARKER)

export const useWebhooks = () => {
  const meili = useMeiliClient()

  const list = () => meili.httpRequest.get<{ results: Webhook[] }>({ path: 'webhooks' })

  const get = (uuid: string) => meili.httpRequest.get<Webhook>({ path: `webhooks/${uuid}` })

  const create = (body: { url: string; headers?: Record<string, string> }) =>
    meili.httpRequest.post<Webhook>({ path: 'webhooks', body })

  /**
   * `headers` is merged server-side, not replaced: omitting a key keeps its
   * current value, and a `null` value removes the header. The caller is
   * responsible for omitting unchanged (redacted) secrets and setting removed
   * headers to `null`.
   */
  const update = (uuid: string, body: { url?: string; headers?: Record<string, string | null> }) =>
    meili.httpRequest.patch<Webhook>({ path: `webhooks/${uuid}`, body })

  const remove = (uuid: string) => meili.httpRequest.delete({ path: `webhooks/${uuid}` })

  return { list, get, create, update, remove }
}
