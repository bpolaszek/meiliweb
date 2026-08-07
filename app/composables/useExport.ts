import { useLocalStorage } from '@vueuse/core'
import type { EnqueuedTask } from 'meilisearch'
import { useMeiliClient } from './useMeiliClient'

export type ExportIndexOptions = {
  filter?: string
  overrideSettings?: boolean
}

export type ExportPayload = {
  url: string
  apiKey?: string
  payloadSize?: string
  indexes?: Record<string, ExportIndexOptions>
}

/** Minimum Meilisearch version exposing `POST /export`. */
export const EXPORT_MIN_VERSION = '>=1.16.0'

/**
 * `POST /export` (Meilisearch >= 1.16) exports all or part of the instance to a remote
 * Meilisearch instance. It is not exposed by the JS client yet, so we go through the
 * public `httpRequest` escape hatch. Going through `useMeiliClient()` keeps reactive
 * credential switching working.
 *
 * @see https://www.meilisearch.com/docs/reference/api/export/export-to-a-remote-meilisearch
 */
export const useExport = () => {
  const meili = useMeiliClient()

  const exportToRemote = (payload: ExportPayload) =>
    meili.httpRequest.post<EnqueuedTask>({ path: 'export', body: payload })

  return { exportToRemote }
}

/**
 * Remembers destination URLs used for past exports, to speed up the form.
 *
 * The destination API key is NEVER stored here: it is sensitive and must be re-entered
 * every time.
 */
export const useExportDestinations = () => {
  const destinations = useLocalStorage<string[]>('export-destinations', [])

  const remember = (url: string) => {
    if (!url || destinations.value.includes(url)) return
    destinations.value = [url, ...destinations.value].slice(0, 5)
  }

  return { destinations, remember }
}
