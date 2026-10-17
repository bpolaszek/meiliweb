/**
 * The locales Meilisearch accepts in a search request's `locales` parameter.
 *
 * The API also accepts the ISO 639-3 spelling of each of these (`fra` for `fr`, ...), but the two
 * lists are equivalent, so only the shorter ISO 639-1 codes are offered. The client types the
 * parameter as a plain `string` (meilisearch 0.60.0), so this list is ours to maintain: it comes
 * from the instance's own error message for an unknown locale, and can be refreshed with
 * `curl -X POST '<instance>/indexes/<uid>/search' -d '{"locales":["?"]}'`.
 *
 * Human-readable names are derived at display time with `Intl.DisplayNames` rather than stored.
 */
export const MEILISEARCH_LOCALES = [
  'af',
  'ak',
  'am',
  'ar',
  'az',
  'be',
  'bn',
  'bg',
  'ca',
  'cs',
  'da',
  'de',
  'el',
  'en',
  'eo',
  'et',
  'fi',
  'fr',
  'gu',
  'he',
  'hi',
  'hr',
  'hu',
  'hy',
  'id',
  'it',
  'jv',
  'ja',
  'kn',
  'ka',
  'km',
  'ko',
  'la',
  'lv',
  'lt',
  'ml',
  'mr',
  'mk',
  'my',
  'ne',
  'nl',
  'nb',
  'or',
  'pa',
  'fa',
  'pl',
  'pt',
  'ro',
  'ru',
  'si',
  'sk',
  'sl',
  'sn',
  'es',
  'sr',
  'sv',
  'ta',
  'te',
  'tl',
  'th',
  'tk',
  'tr',
  'uk',
  'ur',
  'uz',
  'vi',
  'yi',
  'zh',
  'zu',
] as const

/** `fr` → `French (fr)`, falling back to the bare code where the browser has no name for it. */
export const humanizeLocale = (code: string): string => {
  const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(code)
  return !name || name === code ? code : `${name} (${code})`
}
