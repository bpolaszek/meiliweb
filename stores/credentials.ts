import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

type BaseUri = string
export type CredentialsRecord = {
  baseUri: BaseUri
  accessKey: string
}

type CredentialsStorage = Map<BaseUri, CredentialsRecord>

export const useCredentials = defineStore('credentials', () => {
  const records = useLocalStorage<CredentialsStorage>(
    'credentials-all',
    new Map(),
  )
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
  const save = (credentials: CredentialsRecord) =>
    self.records.set(credentials.baseUri, credentials)

  const factory = () => ({
    baseUri: '',
    accessKey: '',
  })

  const auth = (record: CredentialsRecord) => {
    self.credentials = toRaw(record)
  }

  const logout = () => {
    self.credentials = null
  }

  return {
    credentials,
    records,
    save,
    factory,
    auth,
    logout,
  }
})
