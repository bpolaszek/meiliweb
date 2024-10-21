import stringify from 'json-oneline-stringify'
import type { DocumentsQuery, Meilisearch } from 'meilisearch'
import { LazyCollection } from '~/utils/lazy-collection'

export const exportDocuments = (
  client: Meilisearch,
  index: string,
  params: DocumentsQuery = {},
) => {
  const retriever = async (offset: number, limit: number) => {
    const documents = await client
      .index(index)
      .getDocuments({ offset, limit, ...params })
    return {
      limit: documents.limit!,
      offset: documents.offset!,
      items: documents.results!,
    }
  }

  return new Export(new LazyCollection(retriever))
}

export class Export<T> implements AsyncIterable<T> {
  constructor(private items: LazyCollection<T>) {}

  async toJson(): Promise<Blob> {
    const json = JSON.stringify(await this.items.toArray(), undefined, 2)
    return new Blob([json], { type: 'application/json' })
  }

  async toNDJson(): Promise<Blob> {
    const items = this.items
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        for await (const item of items) {
          controller.enqueue(encoder.encode(stringify(item) + '\n'))
        }
        controller.close()
      },
    })

    const response = new Response(stream)
    const blob = await response.blob()
    return new Blob([blob], { type: 'application/x-ndjson' })
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    for await (const item of this.items) {
      yield item
    }
  }
}
