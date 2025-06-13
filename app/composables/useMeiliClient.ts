import { Meilisearch } from 'meilisearch'
import type { MaybeRef } from 'vue'
import { useCredentials } from '~/stores'

export const useMeiliClient = (accessKey?: MaybeRef<string>): Meilisearch => {
  const { credentials } = toRefs(useCredentials())

  const self = reactive({
    credentials,
    accessKey,
  })

  return new Meilisearch({
    host: self.credentials?.baseUri ?? '',
    apiKey: self.accessKey ?? self.credentials?.accessKey ?? '',
  })
}
