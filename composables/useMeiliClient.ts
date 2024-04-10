import { reactiveComputed } from '@vueuse/core'
import { Meilisearch } from 'meilisearch'
import { useCredentials } from '~/stores'

export const useMeiliClient = (): Meilisearch => {
  const { credentials } = toRefs(useCredentials())

  const self = reactive({
    credentials,
  })

  return reactiveComputed(
    () =>
      new Meilisearch({
        host: self.credentials?.baseUri ?? '',
        apiKey: self.credentials?.accessKey ?? '',
      }),
  )
}
