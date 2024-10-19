export const processIteratorByChunks = async <T>(
  items: AsyncIterable<T>,
  flush: Function,
  batchSize: number = 1000,
) => {
  let chunks = [] as T[]
  for await (const item of items) {
    chunks.push(item)
    if (chunks.length === batchSize) {
      await flush(chunks)
      chunks = []
    }
  }

  if (chunks.length > 0) {
    await flush(chunks)
  }
}
