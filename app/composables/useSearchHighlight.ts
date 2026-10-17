import type { InjectionKey, MaybeRefOrGetter, Ref } from 'vue'

export type HighlightTags = { preTag: string; postTag: string }
export type HighlightMatch = [start: number, end: number]

const HIGHLIGHT_TAGS = Symbol('search-highlight-tags') as InjectionKey<Ref<HighlightTags | null>>
/** Styled by `::highlight(meili-search-match)` in app/assets/css/main.css. */
const HIGHLIGHT_NAME = 'meili-search-match'

/**
 * The documents page asks Meilisearch to wrap matches in the configured tags; the values then
 * travel down through several layers of renderers before reaching the text nodes that must show
 * them. Provide/inject keeps that plumbing out of the components in between.
 */
export const provideHighlightTags = (tags: MaybeRefOrGetter<HighlightTags | null>) =>
  provide(
    HIGHLIGHT_TAGS,
    computed(() => toValue(tags)),
  )

/** `null` wherever no tags are provided (any page but the documents one), so nothing is parsed. */
export const useHighlightTags = () =>
  inject(
    HIGHLIGHT_TAGS,
    computed(() => null),
  )

/**
 * Splits a Meilisearch-formatted value into the text to display and the offsets of its matches
 * *within that text* — i.e. once the markers themselves have been taken out.
 */
export const parseHighlightMarkers = (
  value: string,
  { preTag, postTag }: HighlightTags,
): { text: string; matches: Array<HighlightMatch> } => {
  if (!preTag || !postTag || !value.includes(preTag)) return { text: value, matches: [] }

  const matches: Array<HighlightMatch> = []
  let text = ''
  let cursor = 0
  while (cursor < value.length) {
    const opening = value.indexOf(preTag, cursor)
    if (-1 === opening) break
    const closing = value.indexOf(postTag, opening + preTag.length)
    if (-1 === closing) break
    text += value.slice(cursor, opening)
    const start = text.length
    text += value.slice(opening + preTag.length, closing)
    matches.push([start, text.length])
    cursor = closing + postTag.length
  }
  return { text: text + value.slice(cursor), matches }
}

// A single Highlight instance shared by every rendered value: the CSS Custom Highlight API keys
// its styling by registered name, not by element, so one registry is all it takes.
let registry: Highlight | null = null
const getRegistry = () => {
  // Unsupported in older browsers (and the API is behind `CSS.highlights`) — matches then simply
  // render without emphasis, which is why parsing still strips the markers unconditionally.
  if ('undefined' === typeof Highlight || !CSS?.highlights) return null
  if (!registry) CSS.highlights.set(HIGHLIGHT_NAME, (registry = new Highlight()))
  return registry
}

/**
 * Paints `matches` over the text node of `element` using the CSS Custom Highlight API, so matches
 * are emphasized without wrapping them in extra DOM nodes (which is what `v-html` would take).
 */
export const useTextHighlight = (
  element: MaybeRefOrGetter<HTMLElement | null | undefined>,
  matches: MaybeRefOrGetter<Array<HighlightMatch>>,
) => {
  watchEffect(
    (onCleanup) => {
      const highlights = getRegistry()
      const textNode = toValue(element)?.firstChild
      if (!highlights || !textNode || Node.TEXT_NODE !== textNode.nodeType) return

      const ranges = toValue(matches).map(([start, end]) => {
        const range = new Range()
        range.setStart(textNode, start)
        range.setEnd(textNode, end)
        return range
      })
      ranges.forEach((range) => highlights.add(range))
      onCleanup(() => ranges.forEach((range) => highlights.delete(range)))
    },
    // The text node only exists once the component is rendered, and its content changes with it.
    { flush: 'post' },
  )
}
