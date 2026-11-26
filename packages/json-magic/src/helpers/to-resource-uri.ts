/** Convert a filesystem retrieval path to an absolute URI without losing literal path characters. */
export const toResourceUri = (value: string): string => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[a-z]:[\\/]/i.test(value)) {
    return value
  }
  const cwd = typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '/'
  const nativeWindows = /^[a-z]:[\\/]/i.test(cwd) || cwd.startsWith('\\\\')
  const windowsPath = nativeWindows || /^[a-z]:[\\/]/i.test(value) || value.startsWith('\\\\')
  const normalized = windowsPath
    ? value
        .replace(/\\/g, '/')
        .replace(/^\/\/\?\/UNC\//i, '//')
        .replace(/^\/\/\?\//, '')
    : value
  if (value.startsWith('\\\\') && normalized.startsWith('//')) {
    return new URL(`file://${normalized.slice(2).split('/').map(encodeURIComponent).join('/')}`).href
  }
  const drivePath = /^[a-z]:\//i.test(normalized)
  if (!drivePath && (nativeWindows || !normalized.startsWith('/'))) {
    const base = toResourceUri(cwd)
    const reference = normalized.split('/').map(encodeURIComponent).join('/')
    return reference ? new URL(reference, base.endsWith('/') ? base : `${base}/`).href : base
  }
  return new URL(
    `file://${normalized.startsWith('/') ? '' : '/'}${normalized
      .split('/')
      .map((segment, index) => (index === 0 && /^[a-z]:$/i.test(segment) ? segment : encodeURIComponent(segment)))
      .join('/')}`,
  ).href
}
