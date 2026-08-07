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
  hybridEnabled: boolean
  hybridEmbedder: string | null
  hybridSemanticRatio: number
}

const DEFAULT_ITEMS_PER_PAGE = 20
const DEFAULT_VIEW_MODE = 'documents'
const DEFAULT_UPDATE_MODE = 'replace'
// Hybrid search is opt-in: keyword search must keep working exactly as before unless the
// user explicitly turns it on, so `hybridEnabled` defaults to false regardless of how many
// embedders the index has. 0.5 matches the Meilisearch API default for `semanticRatio`.
const DEFAULT_HYBRID_ENABLED = false
const DEFAULT_HYBRID_EMBEDDER = null
const DEFAULT_HYBRID_SEMANTIC_RATIO = 0.5

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
    hybridEnabled: DEFAULT_HYBRID_ENABLED,
    hybridEmbedder: DEFAULT_HYBRID_EMBEDDER,
    hybridSemanticRatio: DEFAULT_HYBRID_SEMANTIC_RATIO,
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
    hybridEnabled: computed({
      get: () => self.storage.hybridEnabled ?? DEFAULT_HYBRID_ENABLED,
      set: (value: boolean) => (self.storage.hybridEnabled = value),
    }),
    hybridEmbedder: computed({
      get: () => self.storage.hybridEmbedder ?? DEFAULT_HYBRID_EMBEDDER,
      set: (value: string | null) => (self.storage.hybridEmbedder = value),
    }),
    hybridSemanticRatio: computed({
      get: () => self.storage.hybridSemanticRatio ?? DEFAULT_HYBRID_SEMANTIC_RATIO,
      set: (value: number) => (self.storage.hybridSemanticRatio = value),
    }),
    // Call this whenever the stored embedder no longer matches the index's live embedder
    // list (renamed/deleted) — resets everything hybrid-related to its default in one go,
    // so no caller can reset one field and forget the others (e.g. leaving a stale
    // semanticRatio next to an empty embedder).
    resetHybridSearch: () => {
      self.storage.hybridEnabled = DEFAULT_HYBRID_ENABLED
      self.storage.hybridEmbedder = DEFAULT_HYBRID_EMBEDDER
      self.storage.hybridSemanticRatio = DEFAULT_HYBRID_SEMANTIC_RATIO
    },
  }
}
