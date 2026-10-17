import { asyncComputed } from '@vueuse/core'
import { defineStore } from 'pinia'
import { useVersion } from './version'

/** Conversational search (the `/chats` routes) landed in Meilisearch 1.15. */
export const CHAT_MIN_VERSION = '>=1.15.0'

/** Name of the experimental feature that unlocks the `/chats` routes. */
export const CHAT_EXPERIMENTAL_FEATURE = 'chatCompletions'

/**
 * Whether chat workspaces can be used against the current instance. Both conditions must
 * hold: a recent enough Meilisearch, and the `chatCompletions` experimental feature on.
 *
 * Kept as a store so the check is shared (top navigation + pages) instead of being fired
 * once per component. Both inputs resolve asynchronously, hence `loading`: until it turns
 * false, callers must not conclude that the feature is unavailable.
 */
export const useChatAvailability = defineStore('chat-availability', () => {
  const { version, satisfiesVersion } = useVersion()

  // `undefined` (rather than `false`) as the initial value is what makes `loading` able to
  // tell "not fetched yet" from "fetched, and disabled".
  const chatCompletionsEnabled = asyncComputed<boolean | undefined>(async () => {
    // Instantiating the client inside the evaluator makes this re-run when the active
    // instance changes, since `useMeiliClient()` reads the credentials store reactively.
    const meili = useMeiliClient()
    try {
      // Direct call (not tryOrThrow): instances older than the endpoint answer 404, and a
      // missing experimental-features route just means "unavailable", not "fatal error".
      const features = (await meili.getExperimentalFeatures()) as Record<string, boolean>
      return !!features[CHAT_EXPERIMENTAL_FEATURE]
    } catch {
      return false
    }
  }, undefined)

  const self = reactive({
    version,
    chatCompletionsEnabled,
    versionSupported: computed(() => satisfiesVersion(CHAT_MIN_VERSION)),
  })

  return {
    available: computed(() => self.versionSupported && true === self.chatCompletionsEnabled),
    loading: computed(() => !self.version || undefined === self.chatCompletionsEnabled),
    versionSupported: computed(() => self.versionSupported),
    chatCompletionsEnabled: computed(() => true === self.chatCompletionsEnabled),
  }
})
