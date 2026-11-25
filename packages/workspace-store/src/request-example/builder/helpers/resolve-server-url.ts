import { replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { isRelativePath } from '@scalar/helpers/url/is-relative-path'
import { makeUrlAbsolute } from '@scalar/helpers/url/make-url-absolute'
import { combineUrlAndPath } from '@scalar/helpers/url/merge-urls'

import type { ServerObject } from '@/schemas/v3.2/strict/server'

import { getServerVariables } from './get-server-variables'

/** Keeps the URL base on the server view without adding a field to the API description. */
export const SERVER_URL_BASE = Symbol('server-url-base')

/** A server with the base to use if its template expands to a relative URL. */
export type ServerWithUrlBase = ServerObject & {
  [SERVER_URL_BASE]?: { url: string; prefix?: true }
}

/** Substitutes OpenAPI server variables and resolves a relative expansion against its base. */
export const resolveServerUrl = (server: ServerWithUrlBase | null): string => {
  const url = replacePathVariables(server?.url ?? '', getServerVariables(server))
  const base = server?.[SERVER_URL_BASE]
  // Keep unresolved server and environment placeholders intact for their own substitution steps.
  if (!base || /[{}]/.test(url) || !isRelativePath(url)) {
    return url
  }
  return base.prefix && !url.startsWith('//')
    ? combineUrlAndPath(base.url, url)
    : makeUrlAbsolute(url, { baseUrl: base.url })
}
