/**
 * Turns a camelCase or snake_case identifier into a human-readable "Title Case" label.
 *
 * Used to render a fallback label for experimental features that aren't in the i18n
 * catalogue yet (e.g. a feature added in a newer Meilisearch version than we know about).
 *
 * @example humanize('getTaskDocumentsRoute') // "Get Task Documents Route"
 * @example humanize('logs_route')            // "Logs Route"
 */
export const humanize = (key: string): string =>
  key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
