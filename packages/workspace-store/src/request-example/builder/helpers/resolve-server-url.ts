import { replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { isRelativePath } from '@scalar/helpers/url/is-relative-path'
import { makeUrlAbsolute } from '@scalar/helpers/url/make-url-absolute'
import { combineUrlAndPath } from '@scalar/helpers/url/merge-urls'

import type { ServerObject } from '@/schemas/v3.2/strict/server'

import { getServerVariables } from './get-server-variables'

type ServerUrlBase = { url: string; source: 'configuration' | 'document' | 'browser' }

const serverUrlBase = Symbol('serverUrlBase')
const urlScheme = /^[a-z][a-z\d+.-]*:/i

type ServerWithUrlBase = ServerObject & { [serverUrlBase]?: ServerUrlBase }

/** Carries the base on the server view while keeping the authored template available for selection and editing. */
export const withServerUrlBase = (server: ServerObject, base: ServerUrlBase): ServerWithUrlBase =>
  server.variables && server.url?.includes('{') && !urlScheme.test(server.url)
    ? { ...server, [serverUrlBase]: base }
    : server

/** Substitutes OpenAPI server variable defaults, then resolves a relative template against its base. */
export const resolveServerUrl = (server: ServerWithUrlBase | null): string => {
  const url = replacePathVariables(server?.url ?? '', getServerVariables(server))
  const base = server?.[serverUrlBase]

  if (!base || urlScheme.test(url)) {
    return url
  }

  // Without an OpenAPI or configured base, preserve support for schemeless hosts entered in the client.
  if (base.source === 'browser' && !isRelativePath(url)) {
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
