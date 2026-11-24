import { getOwnEntry } from '@scalar/helpers/object/get-own-entry'
import { isObject } from '@scalar/helpers/object/is-object'
import { REGEX } from '@scalar/helpers/regex/regex-helpers'
import { ensureProtocol } from '@scalar/helpers/url/ensure-protocol'
import { isRelativePath } from '@scalar/helpers/url/is-relative-path'
import { isHttpUrl } from '@scalar/json-magic/helpers/is-http-url'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getPath } from 'hono/utils/url'

import { expandServerVariables } from './expand-server-variables'

/** Collect usable values from an OpenAPI server variable, which may come from an unvalidated document. */
const getVariableValues = function* (variable: unknown): Generator<string, void> {
  if (!isObject(variable)) {
    return
  }

  if (Array.isArray(variable.enum) && variable.enum.length > 0) {
    for (const value of variable.enum) {
      if (typeof value === 'string') {
        yield value
      }
    }
    return
  }

  if (typeof variable.default === 'string') {
    yield variable.default
  }
}

/** Maximum server URL combinations processed per OpenAPI description. */
export const MAX_SERVER_URL_EXPANSIONS = 4_096

/** Resolve a server URL to the URL it names, reading a domain without a scheme as a host like the API client does. */
const toAbsoluteUrl = (url: string, baseUrl: string): URL => {
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(url)) {
    return new URL(url)
  }

  const hasBareHostWithPort = /^[a-z\d-]+\.[a-z\d.-]+:\d+(?:[/?#]|$)/i.test(url)
  if (!hasBareHostWithPort && isRelativePath(url)) {
    // Preserve the path interpretation for scheme-less inputs the client treats as relative.
    return new URL(url.startsWith('/') || url === '' ? url : `./${url}`, baseUrl)
  }

  return new URL(ensureProtocol(url))
}

/** Collapse path slashes before URL parsing resolves dot segments, while preserving the authority. */
const normalizePathSlashes = (url: string): string =>
  url.replace(
    /^([a-z][a-z\d+.-]*:\/\/[^/?#]*|\/\/[^/?#]+)?([^?#]*)/i,
    (_, authority: string | undefined, pathname: string) =>
      (authority ?? '') + pathname.replace(REGEX.MULTIPLE_SLASHES, '/'),
  )

/**
 * Resolve the base paths the servers of an operation put in front of its path keys.
 *
 * Every combination of enum values of the server variables is served, and the default is used when
 * a variable has no enum. A server whose URL keeps a variable without an enum or default adds no
 * base path, because its path cannot be known, and neither does a URL that does not parse. Relative
 * URLs use the document's HTTP retrieval URL when known and the mock root otherwise. The root path
 * is left out, since every operation is already served there. Returns undefined when the shared
 * document budget is exhausted.
 */
export const resolveServerBasePaths = (
  servers: OpenAPIV3_1.ServerObject[] = [],
  retrievalUri = '',
  budget = { remaining: MAX_SERVER_URL_EXPANSIONS },
): string[] | undefined => {
  const baseUrl = isHttpUrl(retrievalUri) ? retrievalUri : 'http://localhost'
  const pathnames = new Set<string>()

  for (const server of servers) {
    if (typeof server?.url !== 'string') {
      continue
    }

    const variables = isObject(server.variables) ? server.variables : undefined
    const isAbsolutePath = server.url.startsWith('/') && !server.url.startsWith('//')
    const expansion = expandServerVariables(
      server.url,
      (name) => getVariableValues(getOwnEntry(variables, name)),
      budget.remaining,
    )
    if (!expansion) {
      return undefined
    }
    budget.remaining -= expansion.combinationCount

    for (const url of expansion.urls) {
      try {
        // A leading slash added by a variable must not turn an absolute-path reference into a host.
        const serverUrl = isAbsolutePath ? url.replace(/^\/+/, '/') : url
        const resolved = toAbsoluteUrl(normalizePathSlashes(serverUrl), baseUrl)
        const pathname = resolved.pathname.replace(REGEX.MULTIPLE_SLASHES, '/').replace(/\/$/, '')

        if (pathname.startsWith('/')) {
          pathnames.add(pathname)
        }
      } catch {
        // A server URL that does not parse cannot be requested, so it adds no route.
      }
    }
  }

  // Hostname combinations can share a pathname, and different encodings can decode to the same route.
  // Braces left after decoding would be treated as path templates.
  const basePaths = [...pathnames].map((pathname) => getPath(new Request(`http://localhost${pathname}`)))
  return [...new Set(basePaths.filter((path) => !/[{}]/.test(path)))]
}
