import { useLocalStorage } from '@vueuse/core'
import { useCredentials, type CredentialsRecord } from '~/stores'

type ViewMode = 'table' | 'documents' | 'map'
type UpdateMode = 'replace' | 'update'
type UseIndexLocalSettings = {
  attributesAsDateTime: Array<string>
  attributesAsBadges: Array<string>
  facets: Array<string>
  appliedSort: Array<string>
  itemsPerPage: number
  viewMode: ViewMode
  updateMode: UpdateMode
}

const DEFAULT_ITEMS_PER_PAGE = 20
const DEFAULT_VIEW_MODE = 'documents'
const DEFAULT_UPDATE_MODE = 'replace'

export const useIndexLocalSettings = (indexUid: string) => {
  const { credentials } = useCredentials()
  const storageKey = `${(credentials as CredentialsRecord).baseUri}-${indexUid}`
  const storage = useLocalStorage<UseIndexLocalSettings>(storageKey, {
    attributesAsDateTime: [],
    attributesAsBadges: [],
    facets: [],
    appliedSort: [],
    itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
    viewMode: DEFAULT_VIEW_MODE,
    updateMode: DEFAULT_UPDATE_MODE,
  })

  const self = reactive({ storage })

  return {
    attributesAsDateTime: computed({
      get: () => self.storage.attributesAsDateTime ?? [],
      set: (value: Array<string>) =>
        (self.storage.attributesAsDateTime = value),
    }),
    attributesAsBadges: computed({
      get: () => self.storage.attributesAsBadges ?? [],
      set: (value: Array<string>) => (self.storage.attributesAsBadges = value),
    }),
    facets: computed({
      get: () => self.storage.facets ?? [],
      set: (value: Array<string>) => (self.storage.facets = value),
    }),
    appliedSort: computed({
      get: () => self.storage.appliedSort ?? [],
      set: (value: Array<string>) => (self.storage.appliedSort = value),
    }),
    itemsPerPage: computed({
      get: () => self.storage.itemsPerPage ?? DEFAULT_ITEMS_PER_PAGE,
      set: (value: number) => (self.storage.itemsPerPage = value),
    }),
    viewMode: computed({
      get: () => self.storage.viewMode ?? DEFAULT_VIEW_MODE,
      set: (value: ViewMode) => (self.storage.viewMode = value),
    }),
    updateMode: computed({
      get: () => self.storage.updateMode ?? DEFAULT_UPDATE_MODE,
      set: (value: UpdateMode) => (self.storage.updateMode = value),
    }),
  }
}
