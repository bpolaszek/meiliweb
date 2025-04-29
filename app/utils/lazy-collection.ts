type Result<T> = {
  limit: number
  offset: number
  items: T[]
}

type Retriever<T> = (offset: number, limit: number) => Promise<Result<T>>

type LazyCollectionOptions = {
  batchSize: number
  maxItems: number
}

const DEFAULT_OPTIONS: LazyCollectionOptions = {
  batchSize: 10,
  maxItems: Infinity,
}

export class LazyCollection<T> implements AsyncIterable<T> {
  private currentOffset: number = 0
  private nextOffset: number = 0
  private totalItems: number = 0
  private currentResult: Result<T> | null = null
  private currentIndex: number = 0
  private isLastBatch: boolean = false
  private readonly options: LazyCollectionOptions

  constructor(
    private readonly retriever: Retriever<T>,
    options: LazyCollectionOptions = DEFAULT_OPTIONS,
  ) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options)
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    while (true) {
      if (this.currentResult === null || this.currentIndex >= this.currentResult.items.length) {
        if (this.isLastBatch) {
          break
        }

        this.currentOffset = this.nextOffset
        this.currentResult = await this.retriever(
          this.currentOffset,
          this.currentResult?.limit ?? this.options.batchSize,
        )
        this.currentIndex = 0
        this.nextOffset += this.currentResult.items.length

        if (this.currentResult.items.length < this.currentResult.limit) {
          this.isLastBatch = true
        }
      }

      this.totalItems = this.currentOffset + this.currentIndex

      if (this.totalItems === this.options.maxItems) {
        break
      }

      yield this.currentResult.items[this.currentIndex++] as T
    }
  }

  async toArray(): Promise<T[]> {
    const array: T[] = []
    for await (const item of this) {
      array.push(item)
    }
    return array
  }
}
