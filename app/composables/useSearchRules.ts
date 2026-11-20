import type { SearchRule, SearchRuleListPayload, SearchRuleUpdatePayload } from 'meilisearch'
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

export type {
  SearchRule,
  SearchRuleActions,
  SearchRuleConditions,
  SearchRuleListPayload,
  SearchRulePin,
  SearchRuleScale,
  SearchRuleUpdatePayload,
} from 'meilisearch'

/** `1.50.0-rc.1` and friends must count as 1.50, hence the coercion. */
export const supportsSearchRules = (pkgVersion?: string | null) => {
  const parsed = semver.coerce(pkgVersion ?? '')
  return null !== parsed && semver.gte(parsed, SEARCH_RULES_MIN_VERSION)
}

export const useSearchRules = () => {
  const meili = useMeiliClient()

  const list = (parameters?: SearchRuleListPayload) => meili.getDynamicSearchRules(parameters)

  const get = (uid: string): Promise<SearchRule> => meili.getDynamicSearchRule(uid)

  /** Creates the rule when `uid` is unknown, patches it otherwise. */
  const save = (uid: string, rule: SearchRuleUpdatePayload) => meili.updateDynamicSearchRule(uid, rule)

  const remove = (uid: string) => meili.deleteDynamicSearchRule(uid)

  const removeAll = () => meili.deleteAllDynamicSearchRules()

  return { list, get, save, remove, removeAll }
}
