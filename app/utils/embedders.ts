import type { Embedder, Embedders } from 'meilisearch'
import type { InjectionKey } from 'vue'

export const EMBEDDER_SOURCES = ['openAi', 'huggingFace', 'ollama', 'rest', 'userProvided', 'composite'] as const
export type EmbedderSource = (typeof EMBEDDER_SOURCES)[number]

// Sources a composite embedder can delegate to.
export const SUB_EMBEDDER_SOURCES = ['openAi', 'huggingFace', 'ollama', 'rest'] as const

// Versions of Meilisearch that introduced the experimental features embedders depend on
export const COMPOSITE_EMBEDDERS_MIN_VERSION = '>=1.14.0'
export const MULTIMODAL_MIN_VERSION = '>=1.16.0'
export const RENDER_ROUTE_MIN_VERSION = '>=1.48.0'
// Sources relying on the compositeEmbedders experimental feature
export const COMPOSITE_EMBEDDER_SOURCES: readonly string[] = ['composite']
export const COMPOSITE_EMBEDDER_PARTS = ['searchEmbedder', 'indexingEmbedder'] as const
export type CompositeEmbedderPart = (typeof COMPOSITE_EMBEDDER_PARTS)[number]

const DOCUMENT_TEMPLATE_FIELDS = ['documentTemplate', 'documentTemplateMaxBytes'] as const

// Fields each source accepts besides `source` itself: Meilisearch rejects any other one, even when set to `null`.
export const EMBEDDER_FIELDS_BY_SOURCE: Record<EmbedderSource, readonly string[]> = {
  openAi: ['apiKey', 'model', 'url', 'dimensions', ...DOCUMENT_TEMPLATE_FIELDS],
  huggingFace: ['model', 'revision', 'pooling', ...DOCUMENT_TEMPLATE_FIELDS],
  ollama: ['apiKey', 'url', 'model', 'dimensions', ...DOCUMENT_TEMPLATE_FIELDS],
  rest: [
    'apiKey',
    'url',
    'dimensions',
    'request',
    'response',
    'headers',
    'indexingFragments',
    'searchFragments',
    ...DOCUMENT_TEMPLATE_FIELDS,
  ],
  userProvided: ['dimensions'],
  composite: COMPOSITE_EMBEDDER_PARTS,
}

// Accepted by every source, at the top level only.
const SHARED_EMBEDDER_FIELDS = ['binaryQuantized', 'distribution'] as const

// Within a composite embedder, the search part neither renders documents nor indexes fragments,
// and the indexing part doesn't embed queries.
const FIELDS_EXCLUDED_FROM_PART: Record<CompositeEmbedderPart, readonly string[]> = {
  searchEmbedder: [...DOCUMENT_TEMPLATE_FIELDS, 'indexingFragments'],
  indexingEmbedder: ['searchFragments'],
}

// Edited as raw JSON text in the form.
export const EMBEDDER_JSON_FIELDS = ['request', 'response', 'headers'] as const
export const OPTIONAL_EMBEDDER_JSON_FIELDS: readonly string[] = ['headers']

// Edited as a list of named JSON values in the form.
export const EMBEDDER_FRAGMENT_FIELDS = ['indexingFragments', 'searchFragments'] as const

export const isEditableEmbedderSource = (source: string): source is EmbedderSource =>
  (EMBEDDER_SOURCES as readonly string[]).includes(source)

export const embedderFields = (source: EmbedderSource, part?: CompositeEmbedderPart): string[] => {
  const fields = EMBEDDER_FIELDS_BY_SOURCE[source] ?? []
  if (undefined === part) {
    return [...fields, ...SHARED_EMBEDDER_FIELDS]
  }
  return fields.filter((field) => !FIELDS_EXCLUDED_FROM_PART[part].includes(field))
}

export const embedderAcceptsField = (source: EmbedderSource, field: string, part?: CompositeEmbedderPart) =>
  embedderFields(source, part).includes(field)

// Experimental features the embedder settings depend on, provided by the embedders page.
export type EmbedderFeatures = {
  multimodal: boolean
  compositeEmbedders: boolean
  renderRoute: boolean
}
export const EMBEDDER_FEATURES: InjectionKey<EmbedderFeatures> = Symbol('embedderFeatures')

export type EmbedderFragmentRow = {
  name: string
  // JSON text of the fragment's `value`
  value: string
}

export type EmbedderFormSettings = {
  source: EmbedderSource
  binaryQuantized: boolean
  distribution: { mean?: number | null; sigma?: number | null }
  [field: string]: any
}

export type EmbedderFormEntry = {
  name: string
  // Already saved on the instance: its name can no longer change, and its payload is diffed against the saved one.
  persisted: boolean
  settings: EmbedderFormSettings
}

export class InvalidEmbedderJsonError extends Error {
  constructor(
    public embedder: string,
    public field: string,
  ) {
    super(`Invalid JSON in ${field} of embedder ${embedder}`)
  }
}

// A single PATCH can't delete an embedder and create another one under the same name.
export class EmbedderNameTakenError extends Error {
  constructor(public embedder: string) {
    super(`An embedder named ${embedder} is already saved`)
  }
}

export class DuplicateFragmentNameError extends Error {
  constructor(
    public embedder: string,
    public field: string,
    public fragment: string,
  ) {
    super(`Duplicate fragment name in ${field} of embedder ${embedder}: ${fragment}`)
  }
}

export class DuplicateEmbedderNameError extends Error {
  constructor(public embedder: string) {
    super(`Duplicate embedder name: ${embedder}`)
  }
}

export const createEmbedderFormSettings = (source: EmbedderSource = 'ollama'): EmbedderFormSettings => ({
  source,
  binaryQuantized: false,
  distribution: {},
  ...Object.fromEntries(EMBEDDER_JSON_FIELDS.map((field) => [field, ''])),
  ...Object.fromEntries(EMBEDDER_FRAGMENT_FIELDS.map((field) => [field, []])),
})

const toEmbedderFormSettings = (embedder: Embedder | Record<string, any>): EmbedderFormSettings => {
  const settings: Record<string, any> = structuredClone(toRaw(embedder ?? {}))
  for (const field of EMBEDDER_JSON_FIELDS) {
    settings[field] = undefined === settings[field] ? '' : JSON.stringify(settings[field], null, 2)
  }
  for (const field of EMBEDDER_FRAGMENT_FIELDS) {
    settings[field] = Object.entries(settings[field] ?? {}).map(
      ([name, fragment]: [string, any]): EmbedderFragmentRow => ({
        name,
        value: JSON.stringify(fragment?.value ?? null, null, 2),
      }),
    )
  }
  for (const part of COMPOSITE_EMBEDDER_PARTS) {
    if (settings[part]) {
      settings[part] = toEmbedderFormSettings(settings[part])
    }
  }
  return {
    ...settings,
    source: settings.source,
    binaryQuantized: settings.binaryQuantized ?? false,
    distribution: settings.distribution ?? {},
  }
}

export const parseEmbedders = (embedders: Embedders): EmbedderFormEntry[] =>
  Object.entries(embedders ?? {}).map(([name, embedder]) => ({
    name,
    persisted: true,
    settings: toEmbedderFormSettings(embedder),
  }))

const isBlank = (value: unknown) =>
  undefined === value || null === value || '' === value || (typeof value === 'number' && isNaN(value))

const parseJson = (embedder: string, field: string, value: string) => {
  try {
    return JSON.parse(value)
  } catch {
    throw new InvalidEmbedderJsonError(embedder, field)
  }
}

// Turns a form value into its API counterpart, `null` meaning "unset" (i.e. back to Meilisearch's default).
const toApiValue = (embedder: string, field: string, value: any): any => {
  if ((EMBEDDER_JSON_FIELDS as readonly string[]).includes(field)) {
    return isBlank(value) || '' === String(value).trim() ? null : parseJson(embedder, field, value)
  }
  if ((EMBEDDER_FRAGMENT_FIELDS as readonly string[]).includes(field)) {
    const rows: EmbedderFragmentRow[] = Array.isArray(value) ? value : []
    const duplicate = rows.find(({ name }, i) => rows.findIndex((row) => row.name === name) !== i)
    if (undefined !== duplicate) {
      throw new DuplicateFragmentNameError(embedder, field, duplicate.name)
    }
    return 0 === rows.length
      ? null
      : Object.fromEntries(
          rows.map(({ name, value }) => [name, { value: parseJson(embedder, `${field}.${name}`, value) }]),
        )
  }
  if ('distribution' === field) {
    return isBlank(value?.mean) || isBlank(value?.sigma) ? null : { mean: value.mean, sigma: value.sigma }
  }
  return isBlank(value) ? null : value
}

const isSameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

// The whole configuration, minus blank fields.
const toFullPayload = (
  embedder: string,
  settings: EmbedderFormSettings | undefined,
  part?: CompositeEmbedderPart,
): Record<string, any> => {
  const payload: Record<string, any> = { source: settings?.source }
  for (const field of settings ? embedderFields(settings.source, part) : []) {
    const value = (COMPOSITE_EMBEDDER_PARTS as readonly string[]).includes(field)
      ? toFullPayload(`${embedder}.${field}`, settings![field], field as CompositeEmbedderPart)
      : toApiValue(embedder, field, settings![field])
    if (null !== value) {
      payload[field] = value
    }
  }
  return payload
}

/**
 * Builds the PATCH payload of a single embedder, or `undefined` when nothing changed.
 *
 * Only changed fields are sent, which matters because:
 * - API keys are read back redacted (`abXXXX...`): sending them back would overwrite the real key with the redacted one;
 * - as soon as `source` is part of the payload, Meilisearch requires every mandatory field of that source again;
 * - fragments are merged one by one, so removed ones must be sent as `null`.
 */
export const toEmbedderPayload = (
  name: string,
  settings: EmbedderFormSettings,
  initial?: EmbedderFormSettings,
): Record<string, any> | undefined => {
  if (!isEditableEmbedderSource(settings.source)) {
    // Not editable from the form: leave it as it is on the instance
    return undefined
  }

  if (settings.source !== initial?.source) {
    // Changing the source resets every other field: send the whole configuration.
    const payload = toFullPayload(name, settings)
    // A redacted key left untouched is useless with the new source, and would be stored as is.
    if (undefined !== initial && payload.apiKey === initial.apiKey) {
      delete payload.apiKey
    }
    return payload
  }

  const payload: Record<string, any> = {}
  for (const field of embedderFields(settings.source)) {
    if ((COMPOSITE_EMBEDDER_PARTS as readonly string[]).includes(field)) {
      // Parts of a composite embedder are replaced as a whole, so they are sent entirely as soon as they change.
      // Their API keys are not redacted, unlike top-level ones.
      const part = field as CompositeEmbedderPart
      const value = toFullPayload(`${name}.${part}`, settings[part], part)
      if (!isSameValue(value, toFullPayload(`${name}.${part}`, initial![part], part))) {
        payload[part] = value
      }
      continue
    }
    const value = toApiValue(name, field, settings[field])
    const initialValue = toApiValue(name, field, initial![field])
    if (isSameValue(value, initialValue)) {
      continue
    }
    payload[field] = (EMBEDDER_FRAGMENT_FIELDS as readonly string[]).includes(field)
      ? {
          ...Object.fromEntries(Object.keys(initialValue ?? {}).map((fragment) => [fragment, null])),
          ...value,
        }
      : value
  }
  return Object.keys(payload).length > 0 ? payload : undefined
}

// Embedders left out of the payload are kept as is; removed ones must be sent as `null`.
export const buildEmbeddersPayload = (entries: EmbedderFormEntry[], initialEntries: EmbedderFormEntry[]) => {
  const names = new Set<string>()
  for (const { name } of entries) {
    if (names.has(name)) {
      throw new DuplicateEmbedderNameError(name)
    }
    names.add(name)
  }

  const initialSettings = new Map(initialEntries.map(({ name, settings }) => [name, settings]))
  const recreated = entries.find(({ name, persisted }) => !persisted && initialSettings.has(name))
  if (undefined !== recreated) {
    throw new EmbedderNameTakenError(recreated.name)
  }
  const payload: Record<string, Record<string, any> | null> = {}
  for (const name of initialSettings.keys()) {
    if (!names.has(name)) {
      payload[name] = null
    }
  }
  for (const { name, settings } of entries) {
    const embedderPayload = toEmbedderPayload(name, settings, initialSettings.get(name))
    if (undefined !== embedderPayload) {
      payload[name] = embedderPayload
    }
  }
  return payload as Embedders
}
