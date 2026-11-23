import { REGEX } from '@scalar/helpers/regex/regex-helpers'
import { ensureProtocol } from '@scalar/helpers/url/ensure-protocol'
import { isRelativePath } from '@scalar/helpers/url/is-relative-path'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getPath } from 'hono/utils/url'

/** Matches a server variable in a URL template. */
const SERVER_VARIABLE = /\{([^{}]+)\}/g

/** Every URL a server template can expand to, one per combination of its variable values. */
const expandServerUrl = (template: string, variables: OpenAPIV3_1.ServerObject['variables'] = {}): string[] => {
  let urls = [template]

  for (const name of new Set([...template.matchAll(SERVER_VARIABLE)].map((match) => match[1]!))) {
    const variable = Object.hasOwn(variables, name) ? variables[name] : undefined
    const values = variable?.enum?.length ? variable.enum : variable?.default !== undefined ? [variable.default] : []

    urls = [...new Set(urls.flatMap((url) => values.map((value) => url.replaceAll(`{${name}}`, () => String(value)))))]
  }

  return urls
}

/** Resolve a server URL to the URL it names, reading a domain without a scheme as a host like the API client does. */
const toAbsoluteUrl = (url: string): URL => {
  if (isRelativePath(url)) {
    return new URL(`/${url}`.replace(/^\/+/, '/'), 'http://localhost')
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

    for (const url of expandServerUrl(server.url, server.variables)) {
      try {
        const basePath = getBasePath(url)

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
