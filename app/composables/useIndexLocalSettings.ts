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
  showRankingScore: boolean
  showRankingScoreDetails: boolean
  showPerformanceDetails: boolean
  personalizeEnabled: boolean
  personalizeUserContext: string
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
const DEFAULT_SHOW_RANKING_SCORE = false
const DEFAULT_SHOW_RANKING_SCORE_DETAILS = false
const DEFAULT_SHOW_PERFORMANCE_DETAILS = false
// Personalization is opt-in for the same reason hybrid search is: it must never silently
// change results for users who haven't asked for it.
const DEFAULT_PERSONALIZE_ENABLED = false
const DEFAULT_PERSONALIZE_USER_CONTEXT = ''

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
    showRankingScore: DEFAULT_SHOW_RANKING_SCORE,
    showRankingScoreDetails: DEFAULT_SHOW_RANKING_SCORE_DETAILS,
    showPerformanceDetails: DEFAULT_SHOW_PERFORMANCE_DETAILS,
    personalizeEnabled: DEFAULT_PERSONALIZE_ENABLED,
    personalizeUserContext: DEFAULT_PERSONALIZE_USER_CONTEXT,
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
    showRankingScore: computed({
      get: () => self.storage.showRankingScore ?? DEFAULT_SHOW_RANKING_SCORE,
      set: (value: boolean) => (self.storage.showRankingScore = value),
    }),
    showRankingScoreDetails: computed({
      get: () => self.storage.showRankingScoreDetails ?? DEFAULT_SHOW_RANKING_SCORE_DETAILS,
      set: (value: boolean) => (self.storage.showRankingScoreDetails = value),
    }),
    showPerformanceDetails: computed({
      get: () => self.storage.showPerformanceDetails ?? DEFAULT_SHOW_PERFORMANCE_DETAILS,
      set: (value: boolean) => (self.storage.showPerformanceDetails = value),
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
    personalizeEnabled: computed({
      get: () => self.storage.personalizeEnabled ?? DEFAULT_PERSONALIZE_ENABLED,
      set: (value: boolean) => (self.storage.personalizeEnabled = value),
    }),
    personalizeUserContext: computed({
      get: () => self.storage.personalizeUserContext ?? DEFAULT_PERSONALIZE_USER_CONTEXT,
      set: (value: string) => (self.storage.personalizeUserContext = value),
    }),
    // Call this when the server rejects a personalized search (e.g. the instance has no
    // Cohere key configured) — resets both fields so the broken state can't be retried as-is.
    resetPersonalize: () => {
      self.storage.personalizeEnabled = DEFAULT_PERSONALIZE_ENABLED
      self.storage.personalizeUserContext = DEFAULT_PERSONALIZE_USER_CONTEXT
    },
  }
}
