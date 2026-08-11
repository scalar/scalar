/** Strips a trailing slash for stable server base / path comparison. */
export const stripTrailingSlash = (url: string): string => (url.endsWith('/') ? url.slice(0, -1) : url)

/**
 * Splits a WebSocket connection URL into server base and path suffix,
 * matching the HTTP address bar pattern (server dropdown + path field).
 */
export const splitConnectionUrl = (connectionUrl: string, serverBaseUrl: string): { base: string; path: string } => {
  const full = stripTrailingSlash(connectionUrl)
  const base = stripTrailingSlash(serverBaseUrl)

  if (!base) {
    return { base: '', path: connectionUrl }
  }

  if (full === base) {
    return { base, path: '' }
  }

  if (full.startsWith(`${base}/`)) {
    return { base, path: full.slice(base.length) }
  }

  if (full.startsWith(base)) {
    const remainder = full.slice(base.length)
    return { base, path: remainder.startsWith('/') ? remainder : `/${remainder}` }
  }

  return { base, path: connectionUrl }
}

/** Merges server base and path segment into a full connection URL. */
export const mergeConnectionUrl = (serverBaseUrl: string, path: string): string => {
  const base = stripTrailingSlash(serverBaseUrl)

  if (!base) {
    return path
  }

  if (!path) {
    return base
  }

  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}
