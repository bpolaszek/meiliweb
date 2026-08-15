import type {
  SearchRule as ClientSearchRule,
  SearchRuleConditions as ClientSearchRuleConditions,
  ResourceResults,
  SearchRuleListPayload,
  SearchRuleUpdatePayload,
} from 'meilisearch'
import semver from 'semver/preload'
import { useMeiliClient } from './useMeiliClient'

/**
 * Dynamic Search Rules (DSR) are global to a Meilisearch instance (not per-index).
 * They pin documents at fixed positions whenever a search matches their conditions.
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

/**
 * Meilisearch validates rule uids exactly like index uids. The hyphen must be escaped: browsers
 * compile the `pattern` attribute with the `v` flag, which rejects an unescaped one here and would
 * silently drop the validation altogether.
 */
export const SEARCH_RULE_UID_PATTERN = '[a-zA-Z0-9_\\-]+'

export type { SearchRuleAction, SearchRuleListPayload, SearchRulePinAction, SearchRuleSelector } from 'meilisearch'

/**
 * Matches searches whose own filter carries these attribute/value pairs. Meilisearch 1.53 accepts
 * it but meilisearch@0.60.0 does not type it yet, and it is not covered by the documented how-tos
 * either — so we don't expose an editor for it. `conditions` being replaced wholesale on update,
 * callers must still round-trip it or it would be silently lost.
 */
export type SearchRuleFilterCondition = {
  values?: Record<string, unknown> | null
}

export type SearchRuleConditions = ClientSearchRuleConditions & {
  filter?: SearchRuleFilterCondition | null
}

/** The client also misses `lastUpdatedAt`, which the API returns on every rule. */
export type SearchRule = Omit<ClientSearchRule, 'conditions'> & {
  lastUpdatedAt?: string | null
  conditions?: SearchRuleConditions | null
}

/** Partial update payload. Top-level keys are merged, but `conditions` is replaced as a whole. */
export type SearchRulePayload = Omit<SearchRuleUpdatePayload, 'conditions'> & {
  conditions?: SearchRuleConditions | null
}

/** `1.50.0-rc.1` and friends must count as 1.50, hence the coercion. */
export const supportsSearchRules = (pkgVersion?: string | null) => {
  const parsed = semver.coerce(pkgVersion ?? '')
  return null !== parsed && semver.gte(parsed, SEARCH_RULES_MIN_VERSION)
}

export const useSearchRules = () => {
  const meili = useMeiliClient()

  // The casts below only widen the client's types with the two fields it hasn't caught up with
  // (`conditions.filter`, `lastUpdatedAt`); drop them once meilisearch-js declares them.
  const list = (parameters?: SearchRuleListPayload) =>
    meili.getDynamicSearchRules(parameters) as Promise<ResourceResults<SearchRule[]>>

  const get = (uid: string) => meili.getDynamicSearchRule(uid) as Promise<SearchRule>

  /** Creates the rule when `uid` is unknown, patches it otherwise. */
  const save = (uid: string, rule: SearchRulePayload) =>
    meili.updateDynamicSearchRule(uid, rule as SearchRuleUpdatePayload)

  const remove = (uid: string) => meili.deleteDynamicSearchRule(uid)

  const removeAll = () => meili.deleteAllDynamicSearchRules()

  return { list, get, save, remove, removeAll }
}
