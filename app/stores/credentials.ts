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

export const useCredentials = defineStore('credentials', () => {
  // Store all credentials
  const records = useLocalStorage<CredentialsStorage>(
    'credentials-all',
    new Map(),
  )

  // Store current active credentials
  const credentials = useLocalStorage<CredentialsRecord | null>(
    'credentials-current',
    null,
    {
      serializer: {
        read: (v: any) => (v ? JSON.parse(v) : null),
        write: (v: any) => JSON.stringify(v),
      },
    },
  )

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

  const logout = () => {
    self.credentials = null
    self.records.forEach((record, key) => {
      self.records.delete(key)
    })
  }

  const removeInstance = (id: Identifier) => {
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
