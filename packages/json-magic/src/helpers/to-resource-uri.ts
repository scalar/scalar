import path from 'pathe'

/** Convert a filesystem retrieval path to an absolute URI without losing literal path characters. */
export const toResourceUri = (value: string): string => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[a-z]:[\\/]/i.test(value)) {
    return value
  }
  const normalized = value.startsWith('/')
    ? value
    : value
        .replace(/\\/g, '/')
        .replace(/^\/\/\?\/UNC\//i, '//')
        .replace(/^\/\/\?\//, '')
  if (value.startsWith('\\\\') && normalized.startsWith('//')) {
    return new URL(`file://${normalized.slice(2).split('/').map(encodeURIComponent).join('/')}`).href
  }
  const absolute = normalized.startsWith('/') || /^[a-z]:\//i.test(normalized) ? normalized : path.resolve(normalized)
  return `file://${absolute.startsWith('/') ? '' : '/'}${absolute
    .split('/')
    .map((segment, index) => (index === 0 && /^[a-z]:$/i.test(segment) ? segment : encodeURIComponent(segment)))
    .join('/')}`
}
