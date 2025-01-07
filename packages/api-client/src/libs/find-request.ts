import type { Request } from '@scalar/oas-utils/entities/spec'

/** Convert path string like '/planets/{planetId}' to regex pattern /\/planets/([^/]+)/ */
export const pathToRegex = (path: string) => {
  const regxStr =
    '^' + // start anchor
    path
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape special regex chars
      .replace(/\\\{([^}]+)\\\}/g, '([^/]+)') + // replace {param} with capture group
    '$' // end anchor

  return new RegExp(regxStr)
}

/**
 * Takes in a curl string and an array of requests and tries to match via method + path including
 * path params via regex
 */
export const findRequestByPathMethod = (
  path: string,
  method: string,
  requests: Request[],
) =>
  requests.find((r) => {
    if (r.method !== method) return false
    if (r.path === path) return true

    const regex = pathToRegex(r.path)
    const match = path.match(regex)
    if (match) return true

    return false
  })
