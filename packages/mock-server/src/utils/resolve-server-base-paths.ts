import { getOwnEntry } from '@scalar/helpers/object/get-own-entry'
import { isObject } from '@scalar/helpers/object/is-object'
import { REGEX } from '@scalar/helpers/regex/regex-helpers'
import { ensureProtocol } from '@scalar/helpers/url/ensure-protocol'
import { isRelativePath } from '@scalar/helpers/url/is-relative-path'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getPath } from 'hono/utils/url'

import { expandServerVariables } from './expand-server-variables'

/** Collect usable values from an OpenAPI server variable, which may come from an unvalidated document. */
const getVariableValues = (variable: unknown): string[] => {
  if (!isObject(variable)) {
    return []
  }

  if (Array.isArray(variable.enum) && variable.enum.length > 0) {
    return variable.enum.filter((value): value is string => typeof value === 'string')
  }

  return typeof variable.default === 'string' ? [variable.default] : []
}

/** Resolve a server URL to the URL it names, reading a domain without a scheme as a host like the API client does. */
const toAbsoluteUrl = (url: string): URL => {
  if (isRelativePath(url)) {
    return new URL(url.startsWith('/') ? url : `/${url}`, 'http://localhost')
  }

  return new URL(ensureProtocol(url))
}

/** The request path a server URL puts in front of path keys, as Hono reads it, or `undefined` when it has none. */
const getBasePath = (url: string): string | undefined => {
  const pathname = toAbsoluteUrl(url).pathname.replace(REGEX.MULTIPLE_SLASHES, '/').replace(/\/$/, '')

  if (pathname === '') {
    return undefined
  }

  const basePath = getPath(new Request(`http://localhost${pathname}`))

  // Braces left after decoding would be read as path templates, so such a path cannot be routed verbatim.
  return /[{}]/.test(basePath) ? undefined : basePath
}

/**
 * Resolve the base paths the servers of an operation put in front of its path keys.
 *
 * Every combination of enum values of the server variables is served, and the default is used when
 * a variable has no enum. A server whose URL keeps a variable without an enum or default adds no
 * base path, because its path cannot be known, and neither does a URL that does not parse. Relative
 * URLs are resolved against the root, as the mock server serves the document itself. The root path
 * is left out, since every operation is already served there.
 */
export const resolveServerBasePaths = (servers: OpenAPIV3_1.ServerObject[] = []): string[] => {
  const basePaths = new Set<string>()

  for (const server of servers) {
    if (typeof server?.url !== 'string') {
      continue
    }

    const variables = isObject(server.variables) ? server.variables : undefined
    const isAbsolutePath = server.url.startsWith('/') && !server.url.startsWith('//')
    for (const url of expandServerVariables(server.url, (name) => getVariableValues(getOwnEntry(variables, name)))) {
      try {
        // A leading slash added by a variable must not turn an absolute-path reference into a host.
        const basePath = getBasePath(isAbsolutePath ? url.replace(/^\/+/, '/') : url)

        if (basePath !== undefined) {
          basePaths.add(basePath)
        }
      } catch {
        // A server URL that does not parse cannot be requested, so it adds no route.
      }
    }
  }

  return [...basePaths]
}
