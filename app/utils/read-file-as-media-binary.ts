import type { MediaBinary } from 'meilisearch'

/** Splits a file into the `{ mime, data }` pair search fragments read from `media` (data being base64). */
export const readFileAsMediaBinary = (file: File): Promise<MediaBinary> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const match = /^data:([^;,]+)[^,]*;base64,(.*)$/s.exec(String(reader.result))
      if (null === match) {
        reject(new Error(`Failed to read ${file.name}.`))
        return
      }
      resolve({ mime: match[1] as string, data: match[2] as string })
    }
    reader.onerror = () => reject(reader.error ?? new Error(`Failed to read ${file.name}.`))
    reader.readAsDataURL(file)
  })
