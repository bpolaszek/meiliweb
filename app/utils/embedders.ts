import type { Embedder, Embedders } from 'meilisearch'

export const EMBEDDER_SOURCES = ['openAi', 'huggingFace', 'ollama', 'rest', 'userProvided'] as const
export type EmbedderSource = (typeof EMBEDDER_SOURCES)[number]

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
}

// Accepted by every source.
const SHARED_EMBEDDER_FIELDS = ['binaryQuantized', 'distribution'] as const

// Edited as raw JSON text in the form.
export const EMBEDDER_JSON_FIELDS = ['request', 'response', 'headers'] as const
export const OPTIONAL_EMBEDDER_JSON_FIELDS: readonly string[] = ['headers']

export const isEditableEmbedderSource = (source: string): source is EmbedderSource =>
  (EMBEDDER_SOURCES as readonly string[]).includes(source)

export const embedderAcceptsField = (source: EmbedderSource, field: string) =>
  EMBEDDER_FIELDS_BY_SOURCE[source]?.includes(field) ?? false

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
})

const toEmbedderFormSettings = (embedder: Embedder): EmbedderFormSettings => {
  const settings: Record<string, any> = structuredClone(toRaw(embedder ?? {}))
  for (const field of EMBEDDER_JSON_FIELDS) {
    settings[field] = undefined === settings[field] ? '' : JSON.stringify(settings[field], null, 2)
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

// Turns a form value into its API counterpart, `null` meaning "unset" (i.e. back to Meilisearch's default).
const toApiValue = (embedder: string, field: string, value: any): any => {
  if ((EMBEDDER_JSON_FIELDS as readonly string[]).includes(field)) {
    if (isBlank(value) || '' === String(value).trim()) {
      return null
    }
    try {
      return JSON.parse(value)
    } catch {
      throw new InvalidEmbedderJsonError(embedder, field)
    }
  }
  if ('distribution' === field) {
    return isBlank(value?.mean) || isBlank(value?.sigma) ? null : { mean: value.mean, sigma: value.sigma }
  }
  return isBlank(value) ? null : value
}

const isSameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Builds the PATCH payload of a single embedder, or `undefined` when nothing changed.
 *
 * Only changed fields are sent, which matters for two reasons:
 * - API keys are read back redacted (`abXXXX...`): sending them back would overwrite the real key with the redacted one;
 * - as soon as `source` is part of the payload, Meilisearch requires every mandatory field of that source again.
 */
export const toEmbedderPayload = (
  name: string,
  settings: EmbedderFormSettings,
  initial?: EmbedderFormSettings,
): Record<string, any> | undefined => {
  if (!isEditableEmbedderSource(settings.source)) {
    // Not editable from the form yet: leave it as it is on the instance
    return undefined
  }
  const fields = [...EMBEDDER_FIELDS_BY_SOURCE[settings.source], ...SHARED_EMBEDDER_FIELDS]
  const sourceChanged = settings.source !== initial?.source

  if (sourceChanged) {
    // Changing the source resets every other field: send the whole configuration, minus blanks.
    const payload: Record<string, any> = { source: settings.source }
    for (const field of fields) {
      const value = toApiValue(name, field, settings[field])
      // A redacted key left untouched is useless with the new source, and would be stored as is.
      const isRedactedKey = 'apiKey' === field && undefined !== initial && value === initial.apiKey
      if (null !== value && !isRedactedKey) {
        payload[field] = value
      }
    }
    return payload
  }

  const payload: Record<string, any> = {}
  for (const field of fields) {
    const value = toApiValue(name, field, settings[field])
    const initialValue = toApiValue(name, field, initial![field])
    if (!isSameValue(value, initialValue)) {
      payload[field] = value
    }
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
