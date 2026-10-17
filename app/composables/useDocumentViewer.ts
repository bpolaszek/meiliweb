import type { InjectionKey } from 'vue'

export type DocumentId = string | number
export type DocumentViewer = (documentId: DocumentId) => void

const DOCUMENT_VIEWER = Symbol('document-viewer') as InjectionKey<DocumentViewer>

/**
 * The documents page owns the document slideover, but the clickable ids live several levels down
 * (table cells, cards inside the map view, ...). Provide/inject keeps that plumbing out of the
 * intermediate components, which don't care about the viewer at all.
 */
export const provideDocumentViewer = (openDocument: DocumentViewer) => provide(DOCUMENT_VIEWER, openDocument)

/** Returns `null` where no viewer is provided, so ids simply render as plain values. */
export const useDocumentViewer = () => inject(DOCUMENT_VIEWER, null)
