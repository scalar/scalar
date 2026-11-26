import { resolveReferencePath } from './resolve-reference-path'
import { toResourceUri } from './to-resource-uri'

/** Resolve URI syntax without turning filesystem retrieval paths into encoded filenames. */
export const resolveResourcePath = (base: string, reference: string): string => {
  const baseUri = toResourceUri(base)
  const resolved = ((): string => {
    try {
      return resolveReferencePath(baseUri, reference)
    } catch {
      // Invalid URI syntax must reach the normal unresolved-document diagnostic.
      return reference
    }
  })()
  if (baseUri === base || !resolved.startsWith('file:')) {
    return resolved
  }
  const uri = new URL(resolved)
  if (uri.host || uri.search || uri.hash || /%2f|%5c/i.test(uri.pathname)) {
    return resolved
  }
  try {
    const path = decodeURIComponent(uri.pathname)
    return /^[a-z]:[\\/]/i.test(base) ? path.slice(1) : path
  } catch {
    return resolved
  }
}
