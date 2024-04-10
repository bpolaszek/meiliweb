export const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        resolve(event.target.result)
      } else {
        reject(new Error('Failed to read file as text.'))
      }
    }

    reader.onerror = (event) => {
      reject(event.target?.error || new Error('Failed to read file as text.'))
    }

    reader.readAsText(file)
  })
