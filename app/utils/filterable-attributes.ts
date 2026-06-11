import type { FilterableAttributes, GranularFilterableAttribute } from 'meilisearch'

export type FilterableAttributeRow = {
  pattern: string
  facetSearch: boolean
  equalityFilter: boolean
  comparisonFilter: boolean
}

const ALL_FEATURES_ENABLED: FilterableAttributeRow = {
  pattern: '',
  facetSearch: true,
  equalityFilter: true,
  comparisonFilter: true,
}

export function decodeFilterableAttributes(attrs: FilterableAttributes): FilterableAttributeRow[] {
  if (!attrs) return []
  return attrs.flatMap((attr) => {
    if (typeof attr === 'string') {
      return [{ ...ALL_FEATURES_ENABLED, pattern: attr }]
    }
    return attr.attributePatterns.map((pattern) => ({
      pattern,
      facetSearch: attr.features.facetSearch,
      equalityFilter: attr.features.filter.equality,
      comparisonFilter: attr.features.filter.comparison,
    }))
  })
}

export function encodeFilterableAttributes(rows: FilterableAttributeRow[]): GranularFilterableAttribute[] {
  const groups = new Map<string, string[]>()
  for (const row of rows) {
    const key = `${row.facetSearch}:${row.equalityFilter}:${row.comparisonFilter}`
    const group = groups.get(key)
    if (group) {
      group.push(row.pattern)
    } else {
      groups.set(key, [row.pattern])
    }
  }

  return Array.from(groups.entries()).map(([key, patterns]) => {
    const parts = key.split(':')
    const facetSearch = parts[0] === 'true'
    const equality = parts[1] === 'true'
    const comparison = parts[2] === 'true'
    return {
      attributePatterns: patterns,
      features: {
        facetSearch,
        filter: { equality, comparison },
      },
    }
  })
}

export function getFilterableAttributePatterns(attrs: FilterableAttributes): string[] {
  if (!attrs) return []
  return attrs.flatMap((attr) => (typeof attr === 'string' ? [attr] : attr.attributePatterns))
}

export function getFacetSearchableAttributePatterns(attrs: FilterableAttributes): string[] {
  if (!attrs) return []
  return attrs.flatMap((attr) => {
    if (typeof attr === 'string') return [attr]
    return attr.features.facetSearch ? attr.attributePatterns : []
  })
}
