import { resolveReferencePath } from './resolve-reference-path'
import { toResourceUri } from './to-resource-uri'

/** Resolve URI syntax without turning filesystem retrieval paths into encoded filenames. */
export const tryResolveResourcePath = (base: string, reference: string): string | undefined => {
  const baseUri = toResourceUri(base)
  let resolved: string
  try {
    resolved = resolveReferencePath(baseUri, reference)
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error
    }
    return undefined
  }
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

/** Preserve the authored value so the ordinary reference loader can report an unresolved document. */
export const resolveResourcePath = (base: string, reference: string): string =>
  tryResolveResourcePath(base, reference) ?? reference
