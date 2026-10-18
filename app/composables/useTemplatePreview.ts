import type { RenderTemplateResponse } from 'meilisearch'
import { useMeiliClient } from '~/composables/index'

export type TemplatePreviewKind = 'documentTemplate' | 'indexingFragments' | 'searchFragments'

/**
 * Renders embedder templates through the experimental /render-template route (`renderRoute` feature):
 * document templates and indexing fragments against a document of the index, search fragments against a query.
 */
export const useTemplatePreview = (indexUid: string) => {
  const meili = useMeiliClient()

  return async (kind: TemplatePreviewKind, template: unknown, input: string): Promise<RenderTemplateResponse> =>
    meili.renderTemplate({
      template:
        'documentTemplate' === kind
          ? { kind: 'inlineDocumentTemplate', inline: template }
          : { kind: 'inlineFragment', inline: template },
      input:
        'searchFragments' === kind
          ? { kind: 'inlineSearch', inline: { q: input } }
          : { kind: 'indexDocument', indexUid, id: input },
    })
}
