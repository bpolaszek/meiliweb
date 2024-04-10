export const looksLikeAPictureUrl = (value: any) => {
  if ('string' !== typeof value) {
    return false
  }
  if (!value.startsWith('http')) {
    return false
  }
  const url = new URL(value)
  const path = url.pathname.toLowerCase()
  return (
    path.endsWith('.jpg') ||
    path.endsWith('.jpeg') ||
    path.endsWith('.gif') ||
    path.endsWith('.png') ||
    path.endsWith('.webp')
  )
}
