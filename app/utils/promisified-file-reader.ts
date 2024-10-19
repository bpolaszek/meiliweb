export class PromisifiedFileReader<T> implements AsyncIterable<T> {
  private readonly source: Blob
  private readonly reader: FileReader
  private readPositions: { start: number; end: number } = { start: 0, end: 0 }
  private currentRead?: {
    resolve: (value: any) => void
    reject: (reason?: any) => void
  }
  private text: string = ''
  private lines: string[] = []
  private lineIndex: number = 0

  constructor(source: Blob) {
    this.source = source
    this.reader = new FileReader()
    this.reader.addEventListener('load', this.onLoad.bind(this))
    this.reader.addEventListener('error', this.onError.bind(this))
    this.reader.addEventListener('abort', this.onError.bind(this))
  }

  private onLoad(): void {
    if (!this.currentRead)
      throw new Error(
        'Assertion error: a result was received but no read operation was in progress',
      )

    const { resolve } = this.currentRead
    this.currentRead = undefined
    resolve(this.reader.result)
  }

  private onError(): void {
    if (!this.currentRead) {
      return
    }

    const { reject } = this.currentRead
    this.currentRead = undefined
    reject(this.reader.error)
  }

  private assertNoReadInProgress(): void {
    if (this.currentRead) {
      throw new Error(
        'Assertion error: a read operation is already in progress',
      )
    }
  }

  public abort(): void {
    this.reader.abort()
  }

  public async readAsDataURL(): Promise<string | ArrayBuffer | null> {
    this.assertNoReadInProgress()

    return new Promise((resolve, reject) => {
      this.currentRead = { resolve, reject }
      this.reader.readAsDataURL(this.source)
    })
  }

  public async readAsText(encoding?: string): Promise<string | null> {
    this.assertNoReadInProgress()

    return new Promise((resolve, reject) => {
      this.currentRead = { resolve, reject }
      this.reader.readAsText(this.source, encoding)
    })
  }

  public async readAsArrayBuffer(
    byteSize?: number,
  ): Promise<ArrayBuffer | null> {
    this.assertNoReadInProgress()

    const start = this.readPositions.end
    const end = byteSize
      ? Math.min(start + byteSize, this.source.size)
      : this.source.size

    this.readPositions = { start, end }

    const blobSlice =
      Blob.prototype.slice ||
      (Blob.prototype as any).mozSlice ||
      (Blob.prototype as any).webkitSlice

    return new Promise((resolve, reject) => {
      this.currentRead = { resolve, reject }
      this.reader.readAsArrayBuffer(blobSlice.call(this.source, start, end))
    })
  }

  public async *[Symbol.asyncIterator](): AsyncIterator<T> {
    if (this.lines.length === 0) {
      this.text = (await this.readAsText()) || ''
      this.lines = this.text.split('\n')
    }

    while (this.lineIndex < this.lines.length) {
      const line = this.lines[this.lineIndex++]
      if (line !== '' || this.lineIndex < this.lines.length) {
        yield line as T
      }
    }

    this.lineIndex = 0
    this.lines = []
    this.text = ''
  }
}
