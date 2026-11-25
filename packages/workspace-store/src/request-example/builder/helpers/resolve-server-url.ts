import { replaceEnvVariables, replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { isRelativePath } from '@scalar/helpers/url/is-relative-path'
import { makeUrlAbsolute } from '@scalar/helpers/url/make-url-absolute'
import { combineUrlAndPath } from '@scalar/helpers/url/merge-urls'

import type { ServerObject } from '@/schemas/v3.2/strict/server'

import { getServerVariables } from './get-server-variables'

/** A safe base URL and the resolution rules for its source. */
export type ServerUrlBase = {
  url: string
  source: 'configuration' | 'document' | 'browser'
  allowSchemelessHost?: boolean
}

// The base belongs to the in-memory server choice. Object spread keeps this symbol, while JSON
// and structured cloning drop it. Prepare the server again after restoring a serialized document.
const serverUrlBase = Symbol('serverUrlBase')
const urlScheme = /^[a-z][a-z\d+.-]*:/i
// Numeric ports on single-label hosts can look like schemes. Keep known schemes with that syntax.
const schemelessHostWithPort =
  /^(?!(?:https?|wss?|ftp|file|tel):)(?:[a-z\d-]+(?:\.[a-z\d-]+)*|\[[\da-f:]+\]):(?:\d+|\{[^}]+\})(?:[/?#]|$)/i

type ServerWithUrlBase = ServerObject & { [serverUrlBase]?: ServerUrlBase }

/** Carries the base on the server view while keeping the authored URL available for selection and editing. */
export const withServerUrlBase = (server: ServerObject, base: ServerUrlBase): ServerWithUrlBase =>
  !urlScheme.test(server.url) || schemelessHostWithPort.test(server.url) ? { ...server, [serverUrlBase]: base } : server

/** Retrieves the safe base of an in-memory server choice. */
export const getServerUrlBase = (server: ServerWithUrlBase | null): ServerUrlBase | undefined => server?.[serverUrlBase]

/** Resolves a server URL after substitutions available to the caller have been applied. */
export const resolveServerUrlWithBase = (url: string, base?: ServerUrlBase): string => {
  const hostWithPort = schemelessHostWithPort.test(url)

  if (!base || (urlScheme.test(url) && !hostWithPort)) {
    return url
  }

  // Without an OpenAPI or configured base, preserve support for schemeless hosts entered in the client.
  if ((base.source === 'browser' || base.allowSchemelessHost) && (hostWithPort || !isRelativePath(url))) {
    return url
  }

  // A network-path reference provides its own host, including when the host is a variable.
  if (url.startsWith('//')) {
    const scheme = urlScheme.exec(base.url)?.[0]
    return scheme ? scheme.toLowerCase() + url : url
  }

  const placeholderIndex = url.indexOf('{')
  const firstPathSlash = url.indexOf('/')
  // A remaining placeholder can still supply the origin if it precedes the path.
  if (placeholderIndex !== -1 && (firstPathSlash === -1 || placeholderIndex < firstPathSlash)) {
    return url
  }

  if (base.source === 'configuration') {
    return combineUrlAndPath(base.url, url, { preservePathSegments: true })
  }

  // An empty expansion uses the description's directory so the request path is never appended to the description file.
  const knownPath = placeholderIndex === -1 ? url || '.' : url.slice(0, firstPathSlash + 1)
  // A bare host and port can look like a custom scheme to the URL parser. Require an explicit authority for a host.
  const prefix = hostWithPort ? `./${knownPath}` : knownPath
  const resolvedPrefix = makeUrlAbsolute(prefix, { baseUrl: base.url })
  if (resolvedPrefix === prefix) {
    return url
  }

  return placeholderIndex === -1 ? resolvedPrefix : resolvedPrefix + url.slice(firstPathSlash + 1)
}

/** Resolves the base of an authored template for display, keeping its variable placeholders. */
export const resolveServerUrlTemplate = (server: ServerWithUrlBase): string =>
  server.url ? resolveServerUrlWithBase(server.url, getServerUrlBase(server)) : server.url

const getExpandedServerUrl = (server: ServerObject | null): string =>
  replacePathVariables(server?.url ?? '', getServerVariables(server))

/** Applies server defaults before resolving a relative URL. */
export const resolveServerUrl = (server: ServerWithUrlBase | null): string =>
  resolveServerUrlWithBase(getExpandedServerUrl(server), getServerUrlBase(server))

/** Applies server defaults and environment values before resolving a relative URL. */
export const resolveServerUrlWithEnvironment = (
  server: ServerWithUrlBase | null,
  environmentVariables: Record<string, string>,
): string =>
  resolveServerUrlWithBase(
    replaceEnvVariables(getExpandedServerUrl(server), environmentVariables),
    getServerUrlBase(server),
  )
