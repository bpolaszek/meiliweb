import type { EnqueuedTask } from 'meilisearch'
import semver from 'semver/preload'
import { useMeiliClient } from './useMeiliClient'

/**
 * Dynamic Search Rules (DSR) are global to a Meilisearch instance (not per-index).
 * They pin documents at fixed positions whenever a search matches their conditions.
 *
 * The official JS client (meilisearch@0.59.0) does not expose them yet, so we talk to the REST
 * API directly through the client's `httpRequest` — same approach as useWebhooks. Going through
 * `useMeiliClient()` keeps reactive credential switching working.
 *
 * @see https://www.meilisearch.com/docs/reference/api/search-rules/list-search-rules
 */

/**
 * The routes appeared in 1.41 but their payload kept changing in a breaking way until 1.50,
 * so we only expose the UI on instances running >= 1.50.
 */
export const SEARCH_RULES_MIN_VERSION = '1.50.0'

/** Key of the experimental feature flag that must be on for the DSR routes to answer. */
export const SEARCH_RULES_FEATURE = 'dynamicSearchRules'

/** Meilisearch validates rule uids exactly like index uids. */
export const SEARCH_RULE_UID_PATTERN = '[a-zA-Z0-9_-]+'

export type SearchRuleQueryCondition = {
  isEmpty?: boolean | null
  words?: string | null
}

export type SearchRuleTimeCondition = {
  /** RFC 3339 datetimes. Meilisearch rejects bounds that are in the past. */
  start?: string | null
  end?: string | null
}

/**
 * Matches searches whose own filter carries these attribute/value pairs. It is not covered by the
 * documented how-tos and we don't expose an editor for it, but `conditions` is replaced wholesale
 * on update, so callers must round-trip it or it would be silently lost.
 */
export type SearchRuleFilterCondition = {
  values?: Record<string, unknown> | null
}

export type SearchRuleConditions = {
  query?: SearchRuleQueryCondition | null
  time?: SearchRuleTimeCondition | null
  filter?: SearchRuleFilterCondition | null
}

export type SearchRuleSelector = {
  indexUid?: string | null
  id: string
}

/** `pin` is the only action type Meilisearch accepts as of 1.53. `position` is zero-based. */
export type SearchRulePinAction = {
  type: 'pin'
  position: number
}

export type SearchRuleAction = {
  selector: SearchRuleSelector
  action: SearchRulePinAction
}

export type SearchRule = {
  uid: string
  description?: string | null
  lastUpdatedAt?: string | null
  precedence?: number | null
  active?: boolean
  conditions?: SearchRuleConditions | null
  actions: SearchRuleAction[]
}

/** Partial update payload. Top-level keys are merged, but `conditions` is replaced as a whole. */
export type SearchRulePayload = {
  description?: string | null
  precedence?: number | null
  active?: boolean | null
  conditions?: SearchRuleConditions | null
  actions?: SearchRuleAction[] | null
}

export type SearchRuleListPayload = {
  offset?: number
  limit?: number
  filter?: {
    /** Matches rule uids and descriptions. */
    query?: string | null
    active?: boolean | null
  } | null
}

export type SearchRuleListResponse = {
  results: SearchRule[]
  offset: number
  limit: number
  total: number
}

/** `1.50.0-rc.1` and friends must count as 1.50, hence the coercion. */
export const supportsSearchRules = (pkgVersion?: string | null) => {
  const parsed = semver.coerce(pkgVersion ?? '')
  return null !== parsed && semver.gte(parsed, SEARCH_RULES_MIN_VERSION)
}

export const useSearchRules = () => {
  const meili = useMeiliClient()

  /** Listing is a POST: the filters travel in the body, not in the query string. */
  const list = (body: SearchRuleListPayload = {}) =>
    meili.httpRequest.post<SearchRuleListResponse>({ path: 'dynamic-search-rules', body })

  const get = (uid: string) => meili.httpRequest.get<SearchRule>({ path: `dynamic-search-rules/${uid}` })

  /** Creates the rule when `uid` is unknown, patches it otherwise. */
  const save = (uid: string, body: SearchRulePayload) =>
    meili.httpRequest.patch<EnqueuedTask>({ path: `dynamic-search-rules/${uid}`, body })

  const remove = (uid: string) => meili.httpRequest.delete<EnqueuedTask>({ path: `dynamic-search-rules/${uid}` })

  const removeAll = () => meili.httpRequest.delete<EnqueuedTask>({ path: 'dynamic-search-rules' })

  return { list, get, save, remove, removeAll }
}
