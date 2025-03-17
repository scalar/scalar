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
 * Takes a path and method and returns the request that matches the path and method while taking
 * path params into account by converting to a regex. Will also return the path params if they exist
 *
 * @example path can be /planets/{planetId} OR /planets/1
 */
export const findRequestByPathMethod = (path: string, method: string, requests: Request[]) => {
  let pathParams: { key: string; value: string }[] = []

  const request = requests.find((r) => {
    if (r.method.toLowerCase() !== method.toLowerCase()) {
      return false
    }
    if (r.path === path) {
      return true
    }

    const regex = pathToRegex(r.path)
    const match = path.match(regex)

    // Extract path params from the match
    if (match) {
      pathParams = match.slice(1).flatMap((value, index) => {
        const key = r.path.split('{')[index + 1]?.split('}')[0]
        if (!key) {
          return []
        }
        return [{ key, value }]
      })
      return true
    }

    return false
  })

  return { request, pathParams }
}
