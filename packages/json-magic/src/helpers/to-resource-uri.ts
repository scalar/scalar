/** Convert an absolute filesystem retrieval path to a URI without losing literal path characters. */
export const toResourceUri = (value: string): string => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[a-z]:[\\/]/i.test(value)) {
    return value
  }
  const path = value.replace(/\\/g, '/')
  if (!path.startsWith('/') && !/^[a-z]:\//i.test(path)) {
    return value
  }
  return `file://${path.startsWith('/') ? '' : '/'}${path
    .split('/')
    .map((segment, index) => (index === 0 && /^[a-z]:$/i.test(segment) ? segment : encodeURIComponent(segment)))
    .join('/')}`
}
