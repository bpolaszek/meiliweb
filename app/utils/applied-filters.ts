import match from 'match-operator'
import { field, filterBuilder, withinGeoBoundingBox } from 'meilisearch-filters'

export enum StringFilterStatus {
  EXCLUDE,
  INCLUDE,
}

type FacetName = string
type FacetValue = string
type AppliedStringFacets = Map<FacetName, AppliedStringFacetValues>
type AppliedStringFacetValues = Map<FacetValue, StringFilterStatus>
type AppliedRangeFacets = Map<FacetName, AppliedRange>
type AppliedRange = [number, number]

type Latitude = number
type Longitude = number
type Coordinates = [Latitude, Longitude]
type GeoBoundingBox = {
  topLeftCorner: Coordinates
  bottomRightCorner: Coordinates
}

export class AppliedFilters {
  public length: number = 0
  private shouldIncludeAll: FacetName[] = []
  constructor(
    private appliedStringFilters: AppliedStringFacets = new Map(),
    private appliedRangeFilters: AppliedRangeFacets = new Map(),
    private appliedBoundingBox: GeoBoundingBox | null = null,
  ) {}

  without(facetName: FacetName): AppliedFilters {
    const appliedStringFilters = structuredClone(
      toRaw(this.appliedStringFilters),
    )
    const appliedRangeFilters = structuredClone(toRaw(this.appliedRangeFilters))
    appliedStringFilters.delete(facetName)
    appliedRangeFilters.delete(facetName)
    return new AppliedFilters(
      appliedStringFilters,
      appliedRangeFilters,
      this.appliedBoundingBox,
    )
  }

  applyStringFilter(facetName: FacetName, facetValue: FacetValue) {
    const appliedFacet = this.getAppliedFacet(facetName)
    const status = appliedFacet.get(facetValue) ?? null
    const update = match(status, [
      [
        StringFilterStatus.INCLUDE,
        () => {
          this.length++
          appliedFacet.set(facetValue, StringFilterStatus.EXCLUDE)
        },
      ],
      [
        StringFilterStatus.EXCLUDE,
        () => {
          this.length--
          appliedFacet.delete(facetValue)
        },
      ],
      [
        match.default,
        () => appliedFacet.set(facetValue, StringFilterStatus.INCLUDE),
      ],
    ])
    update()
  }

  includeAll(facetName: FacetName, includeAll?: boolean) {
    includeAll = includeAll ?? !this.shouldIncludeAll.includes(facetName)
    if (includeAll) {
      this.shouldIncludeAll.push(facetName)
    } else {
      this.shouldIncludeAll.splice(
        this.shouldIncludeAll.findIndex((v) => v === facetName),
        1,
      )
    }
  }

  applyRangeFilter(facetName: FacetName, range: AppliedRange) {
    if (!this.appliedRangeFilters.has(facetName)) {
      this.length++
    }
    this.appliedRangeFilters.set(facetName, range)
  }

  applyBoundingBox(boundingBox: GeoBoundingBox) {
    this.length++
    this.appliedBoundingBox = boundingBox
  }

  getAppliedFacet(facetName: FacetName): AppliedStringFacetValues {
    if (!this.appliedStringFilters.has(facetName)) {
      this.appliedStringFilters.set(facetName, reactive(new Map()))
    }
    return this.appliedStringFilters.get(facetName) as Map<
      FacetValue,
      StringFilterStatus
    >
  }

  isValueApplied(facetName: FacetName, facetValue: FacetValue) {
    return this.getAppliedFacet(facetName).has(facetValue)
  }

  toString() {
    const appliedStringFilters = Array.from(
      this.appliedStringFilters,
      ([facetName, facetValues]) => {
        const includedValues = []
        const excludedValues = []
        for (const [facetValue, status] of facetValues.entries()) {
          if (StringFilterStatus.INCLUDE === status) {
            includedValues.push(facetValue)
          } else {
            excludedValues.push(facetValue)
          }
        }
        const expressions = []
        includedValues.length > 0 &&
          expressions.push(
            this.shouldIncludeAll.includes(facetName)
              ? field(facetName).hasAll(includedValues)
              : field(facetName).isIn(includedValues),
          )
        excludedValues.length > 0 &&
          expressions.push(field(facetName).isNotIn(excludedValues))

        return filterBuilder(...expressions)
      },
    )

    const appliedRangeFilters = Array.from(
      this.appliedRangeFilters,
      ([facetName, [min, max]]) => {
        return field(facetName).isBetween(min, max)
      },
    )

    let expression = filterBuilder(
      ...appliedStringFilters,
      ...appliedRangeFilters,
    )

    if (this.appliedBoundingBox) {
      expression = expression.and(
        withinGeoBoundingBox(
          this.appliedBoundingBox.topLeftCorner,
          this.appliedBoundingBox.bottomRightCorner,
        ),
      )
    }

    return expression.toString()
  }
}
