import { navigateTo, xxh32 } from '#imports'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

type Identifier = string
export type CredentialsRecord = {
  id?: Identifier
  baseUri: string
  accessKey: string
  name?: string // Optional friendly name for the instance
}

type CredentialsStorage = Map<Identifier, CredentialsRecord>

const RECORDS_STORAGE_KEY = 'credentials-all'
const CURRENT_STORAGE_KEY = 'credentials-current'
const SESSION_COOKIE = 'meiliweb-session'

/**
 * Makes credentials live as long as the browser session, while staying shared across tabs.
 *
 * They sit in localStorage (visible to every tab), paired with a session cookie that carries no
 * secret and has no expiry, so the browser drops it on restart. A missing cookie therefore means
 * "browser was restarted" (or first visit / legacy persisted data): stale credentials are purged.
 */
const ensureBrowserSession = () => {
  if (!import.meta.client || document.cookie.split('; ').includes(`${SESSION_COOKIE}=1`)) {
    return
  }
  localStorage.removeItem(RECORDS_STORAGE_KEY)
  localStorage.removeItem(CURRENT_STORAGE_KEY)
  document.cookie = `${SESSION_COOKIE}=1; path=/; SameSite=Strict`
}

export const useCredentials = defineStore('credentials', () => {
  ensureBrowserSession()

  // Store all credentials
  const records = useLocalStorage<CredentialsStorage>(RECORDS_STORAGE_KEY, new Map())

  // Store current active credentials
  const credentials = useLocalStorage<CredentialsRecord | null>(CURRENT_STORAGE_KEY, null, {
    serializer: {
      read: (v: any) => (v ? JSON.parse(v) : null),
      write: (v: any) => JSON.stringify(v),
    },
  })

  const self = reactive({
    records,
    credentials,
  })

  const save = (credentials: CredentialsRecord) => {
    credentials.id =
      credentials.id ??
      xxh32(
        JSON.stringify({
          baseUri: credentials.baseUri,
          accessKey: credentials.accessKey,
        }),
      )
    self.records.set(credentials.id, credentials)
  }

  const factory = () => ({
    baseUri: '',
    accessKey: '',
    name: '',
  })

  const auth = (record: CredentialsRecord) => {
    save(record) // Save to records when authenticating
    self.credentials = toRaw(record)
  }

  const switchInstance = async (id: Identifier) => {
    const record = self.records.get(id)
    if (record) {
      self.credentials = toRaw(record)
      await navigateTo(`/indexes`, { external: true })
    }
  }

  // Only drops the active instance: the other ones stay logged in.
  const logout = () => {
    if (self.credentials?.id) {
      self.records.delete(self.credentials.id)
    }
    self.credentials = null
  }

  const removeInstance = (id: Identifier) => {
    if (id === self.credentials?.id) {
      logout()
      return
    }
    self.records.delete(id)
  }

  return {
    credentials,
    records,
    save,
    factory,
    auth,
    logout,
    switchInstance,
    removeInstance,
  }
})
