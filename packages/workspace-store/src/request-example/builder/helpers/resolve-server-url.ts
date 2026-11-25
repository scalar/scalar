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

  // Leave any remaining placeholders available for the later environment substitution.
  if (!base || hasScheme.test(url) || url.includes('{')) {
    return url
  }

  // Without an OpenAPI or configured base, preserve support for schemeless hosts entered in the client.
  if (base.source === 'browser' && !isRelativePath(url)) {
    return url
  }

  if (base.source === 'configuration' && !url.startsWith('//')) {
    return combineUrlAndPath(base.url, url)
  }

  // An empty template points at the containing directory, so appending an operation does not include the API description filename.
  const relativeUrl = url || '.'
  const absoluteUrl = makeUrlAbsolute(relativeUrl, { baseUrl: base.url })
  return absoluteUrl === relativeUrl ? url : absoluteUrl
}
