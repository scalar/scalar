/**
 * Walks a JSON Pointer (the part after `#`) to the value it points to within
 * `root`. Decodes the RFC 6901 escapes (`~1` → `/`, `~0` → `~`). Returns
 * `undefined` if any segment is missing. Kept local (rather than importing
 * `@amritk/resolve-refs`) so this hot-path module stays free of Node builtins
 * and ships cleanly to the browser.
 */
export const resolvePointer = (root: unknown, pointer: string): unknown => {
  if (pointer === '' || pointer === '/') {
    return root
  }

  const segments = pointer
    .replace(/^\//, '')
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))

  let current: unknown = root
  for (const segment of segments) {
    if (current === null || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}
