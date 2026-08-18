import type { MatchingStrategies, SearchParams } from 'meilisearch'

// Meilisearch wraps highlighted matches in `<em>…</em>` by default. Nothing in this app renders
// document values as HTML (no `v-html`, on purpose), so those tags would show up verbatim in the
// results. These markers are plain delimiters instead: StringRenderer strips them back out and
// paints the matches with the CSS Custom Highlight API. They were picked to be inert (no HTML
// meaning) and vanishingly rare in real documents — if one ever leaks through a renderer we don't
// parse, it reads as a bracket rather than as broken markup. Both fields stay user-editable, and
// the parser is tag-agnostic, so `<em>` still works for anyone who wants it.
export const DEFAULT_HIGHLIGHT_PRE_TAG = '⟦'
export const DEFAULT_HIGHLIGHT_POST_TAG = '⟧'
export const DEFAULT_CROP_LENGTH = 10
export const DEFAULT_CROP_MARKER = '…'
export const DEFAULT_MATCHING_STRATEGY: MatchingStrategies = 'last'
export const DEFAULT_SEMANTIC_RATIO = 0.5

export type SearchSettings = {
  hybridEnabled: boolean
  hybridEmbedder: string | null
  hybridSemanticRatio: number
  // A single attribute at most, and only a filterable one — see the Meilisearch `distinct` param.
  distinct: string | null
  // An empty list always means "leave it to Meilisearch" (all attributes retrieved, none cropped,
  // highlighted or restricted), which is also why nothing gets sent for it. The modal normalizes
  // `attributesToRetrieve` back to `[]` as soon as every attribute is checked again.
  attributesToRetrieve: Array<string>
  attributesToCrop: Array<string>
  attributesToHighlight: Array<string>
  attributesToSearchOn: Array<string>
  highlightPreTag: string
  highlightPostTag: string
  cropLength: number
  cropMarker: string
  matchingStrategy: MatchingStrategies
  rankingScoreThreshold: number | null
  locales: Array<string>
  personalizeUserContext: string
  showRankingScore: boolean
  showRankingScoreDetails: boolean
  showPerformanceDetails: boolean
}

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  // Hybrid search and personalization are opt-in: they must never silently change results for
  // users who haven't asked for them.
  hybridEnabled: false,
  hybridEmbedder: null,
  hybridSemanticRatio: DEFAULT_SEMANTIC_RATIO,
  distinct: null,
  attributesToRetrieve: [],
  attributesToCrop: [],
  attributesToHighlight: [],
  attributesToSearchOn: [],
  highlightPreTag: DEFAULT_HIGHLIGHT_PRE_TAG,
  highlightPostTag: DEFAULT_HIGHLIGHT_POST_TAG,
  cropLength: DEFAULT_CROP_LENGTH,
  cropMarker: DEFAULT_CROP_MARKER,
  matchingStrategy: DEFAULT_MATCHING_STRATEGY,
  rankingScoreThreshold: null,
  locales: [],
  personalizeUserContext: '',
  showRankingScore: false,
  showRankingScoreDetails: false,
  showPerformanceDetails: false,
}

/**
 * Turns the user's settings into the Meilisearch search parameters they describe.
 *
 * Anything empty (empty list, empty string, null) or left at its API default is omitted rather
 * than sent explicitly, so the request stays as close as possible to what the user actually asked
 * for. `personalize` is deliberately absent: reranking is slow and rate-limited, so it only rides
 * on the explicit "rerank" action, never on search-as-you-type.
 */
export const buildSearchParams = (settings: SearchSettings): SearchParams => {
  const params: SearchParams = {}
  if (settings.hybridEnabled && settings.hybridEmbedder) {
    params.hybrid = { embedder: settings.hybridEmbedder, semanticRatio: settings.hybridSemanticRatio }
  }
  if (settings.distinct) params.distinct = settings.distinct
  if (settings.attributesToRetrieve.length > 0) params.attributesToRetrieve = settings.attributesToRetrieve
  if (settings.attributesToSearchOn.length > 0) params.attributesToSearchOn = settings.attributesToSearchOn
  if (settings.attributesToHighlight.length > 0) {
    params.attributesToHighlight = settings.attributesToHighlight
    if (settings.highlightPreTag) params.highlightPreTag = settings.highlightPreTag
    if (settings.highlightPostTag) params.highlightPostTag = settings.highlightPostTag
  }
  if (settings.attributesToCrop.length > 0) {
    params.attributesToCrop = settings.attributesToCrop
    if (settings.cropLength) params.cropLength = settings.cropLength
    if (settings.cropMarker) params.cropMarker = settings.cropMarker
  }
  if (settings.matchingStrategy !== DEFAULT_MATCHING_STRATEGY) params.matchingStrategy = settings.matchingStrategy
  if (null !== settings.rankingScoreThreshold) params.rankingScoreThreshold = settings.rankingScoreThreshold
  if (settings.locales.length > 0) params.locales = settings.locales
  if (settings.showRankingScore) params.showRankingScore = true
  if (settings.showRankingScoreDetails) params.showRankingScoreDetails = true
  if (settings.showPerformanceDetails) params.showPerformanceDetails = true
  return params
}

/** The attributes whose `_formatted` counterpart is worth displaying instead of the raw value. */
export const getFormattedAttributes = (settings: SearchSettings): Array<string> => [
  ...new Set([...settings.attributesToHighlight, ...settings.attributesToCrop]),
]

/**
 * Settings are plain JSON data, but they reach us through reactive proxies (localStorage store,
 * modal draft) that `structuredClone` refuses to copy. A JSON round-trip is both the simplest deep
 * copy for this shape and the one that unwraps proxies on the way.
 */
export const cloneSearchSettings = (settings: SearchSettings): SearchSettings => JSON.parse(JSON.stringify(settings))
