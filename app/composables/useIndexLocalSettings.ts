import { useLocalStorage } from '@vueuse/core'
import { useCredentials, type CredentialsRecord } from '~/stores'
import { DEFAULT_SEARCH_SETTINGS, type SearchSettings } from '~/utils'

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
  searchSettings: SearchSettings
  similarDocumentsEmbedder: string | null
  illustrationAttribute: string | null
  nameAttribute: string | null
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
    searchSettings: DEFAULT_SEARCH_SETTINGS,
    similarDocumentsEmbedder: null,
    illustrationAttribute: null,
    nameAttribute: null,
  })

  const self = reactive({ storage })

  return {
    attributesAsDateTime: computed({
      get: () => self.storage.attributesAsDateTime ?? [],
      set: (value: Array<string>) => (self.storage.attributesAsDateTime = value),
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
    // Everything the search settings modal edits, committed in one go on submit. Defaults are
    // merged back in on read so settings persisted by an older version of the app (which knew
    // fewer keys) don't come back as `undefined` search parameters.
    searchSettings: computed({
      get: () => ({ ...DEFAULT_SEARCH_SETTINGS, ...(self.storage.searchSettings ?? {}) }),
      set: (value: SearchSettings) => (self.storage.searchSettings = value),
    }),
    // Which embedder the "similar documents" mode compares on, remembered per index. Reconciled
    // against the live embedder list by the documents page before it can reach a search request.
    similarDocumentsEmbedder: computed({
      get: () => self.storage.similarDocumentsEmbedder ?? null,
      set: (value: string | null) => (self.storage.similarDocumentsEmbedder = value),
    }),
    illustrationAttribute: computed({
      get: () => self.storage.illustrationAttribute ?? null,
      set: (value: string | null) => (self.storage.illustrationAttribute = value),
    }),
    nameAttribute: computed({
      get: () => self.storage.nameAttribute ?? null,
      set: (value: string | null) => (self.storage.nameAttribute = value),
    }),
  }
}
