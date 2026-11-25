import { replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { isRelativePath } from '@scalar/helpers/url/is-relative-path'
import { makeUrlAbsolute } from '@scalar/helpers/url/make-url-absolute'
import { combineUrlAndPath } from '@scalar/helpers/url/merge-urls'

import type { ServerObject } from '@/schemas/v3.2/strict/server'

import { getServerVariables } from './get-server-variables'

type ServerUrlBase = { url: string; source: 'configuration' | 'document' | 'browser' }

const serverUrlBase = Symbol('serverUrlBase')
const hasScheme = /^[a-z][a-z\d+.-]*:/i

type ServerWithUrlBase = ServerObject & { [serverUrlBase]?: ServerUrlBase }

/** Carries the base on the server view while keeping the authored template available for selection and editing. */
export const withServerUrlBase = (server: ServerObject, base: ServerUrlBase): ServerWithUrlBase =>
  server.variables && server.url?.includes('{') && !hasScheme.test(server.url)
    ? { ...server, [serverUrlBase]: base }
    : server

/** Substitutes OpenAPI server variable defaults, then resolves a relative template against its base. */
export const resolveServerUrl = (server: ServerWithUrlBase | null): string => {
  const url = replacePathVariables(server?.url ?? '', getServerVariables(server))
  const base = server?.[serverUrlBase]

  if (!base || hasScheme.test(url)) {
    return url
  }

  // Without an OpenAPI or configured base, preserve support for schemeless hosts entered in the client.
  if (base.source === 'browser' && !isRelativePath(url)) {
    return url
  }

  const placeholderIndex = url.indexOf('{')
  const hasOwnHost = url.startsWith('//')
  const firstPathSlash = url.indexOf('/', hasOwnHost ? 2 : 0)
  // A remaining placeholder can still supply the origin if it precedes the path.
  if (placeholderIndex !== -1 && (firstPathSlash === -1 || placeholderIndex < firstPathSlash)) {
    return url
  }

  if (base.source === 'configuration' && !hasOwnHost) {
    return combineUrlAndPath(base.url, url)
  }

  // Resolve only the known prefix when a path placeholder still needs substitution.
  // An empty expansion uses the directory that contains the API description.
  const prefix = placeholderIndex === -1 ? url || '.' : url.slice(0, firstPathSlash + 1)
  const resolvedPrefix = makeUrlAbsolute(prefix, { baseUrl: base.url })
  if (resolvedPrefix === prefix) {
    return url
  }

  return placeholderIndex === -1 ? resolvedPrefix : resolvedPrefix + url.slice(firstPathSlash + 1)
}
