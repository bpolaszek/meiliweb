import type { InjectionKey } from 'vue'
import type { DocumentId } from './useDocumentViewer'

export type SimilarDocumentsFinder = (documentId: DocumentId) => void

const SIMILAR_DOCUMENTS = Symbol('similar-documents') as InjectionKey<SimilarDocumentsFinder>

/**
 * Same plumbing as the document viewer: the documents page owns the "similar to" mode, but the
 * button that triggers it lives next to every document id, several levels down.
 */
export const provideSimilarDocuments = (findSimilarDocuments: SimilarDocumentsFinder) =>
  provide(SIMILAR_DOCUMENTS, findSimilarDocuments)

/** Returns `null` where nothing is provided (no embedder on this index), so the button hides itself. */
export const useSimilarDocuments = () => inject(SIMILAR_DOCUMENTS, null)

/**
 * Meilisearch returns a document's embeddings under `_vectors` when asked with `retrieveVectors`.
 * Generated embedders yield `{ embeddings, regenerate }`, while `userProvided` ones hand back the
 * raw value the document was indexed with — either a single vector or a list of them. A document
 * can carry several embeddings for one embedder (one per chunk); the first is what we compare on.
 *
 * `_vectors` isn't typed by the client (0.60.0), hence the loose input type.
 */
export const extractEmbedding = (document: Record<string, any>, embedder: string): Array<number> | null => {
  const vectors = document?._vectors?.[embedder]
  if (!vectors) return null
  const embeddings = Array.isArray(vectors) ? vectors : vectors.embeddings
  if (!Array.isArray(embeddings) || 0 === embeddings.length) return null
  const embedding = Array.isArray(embeddings[0]) ? embeddings[0] : embeddings
  return embedding.every((value: unknown) => 'number' === typeof value) ? embedding : null
}
