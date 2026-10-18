import { asyncComputed } from '@vueuse/core'
import { MeilisearchApiError } from 'meilisearch'
import { defineStore } from 'pinia'
import { useCredentials } from './credentials'

/** Reported when the access key is unknown to `/keys`: that is how the master key looks from the API. */
export const MASTER_KEY = Symbol('master-key')

/**
 * Who is connected: the name of the API key in use, resolved through the API.
 *
 * `null` when it can't be told (no key, or a key without the `keys.get` action).
 */
export const useCurrentKey = defineStore('current-key', () => {
  const { credentials } = storeToRefs(useCredentials())

  const key = asyncComputed<string | typeof MASTER_KEY | null>(async () => {
    const accessKey = credentials.value?.accessKey
    if (!accessKey) {
      return null
    }
    // Instantiating the client inside the evaluator makes this re-run when the active instance changes.
    const meili = useMeiliClient()
    try {
      const { name, uid } = await meili.getKey(accessKey)
      return name ?? uid
    } catch (e) {
      return e instanceof MeilisearchApiError && e.cause?.code === 'api_key_not_found' ? MASTER_KEY : null
    }
  }, null)

  return { key }
})
