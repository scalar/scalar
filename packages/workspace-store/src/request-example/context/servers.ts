import { replaceEnvVariables, replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { isRelativePath } from '@scalar/helpers/url/is-relative-path'
import { makeUrlAbsolute } from '@scalar/helpers/url/make-url-absolute'
import { combineUrlAndPath } from '@scalar/helpers/url/merge-urls'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { getServerVariables } from '@/request-example/builder/helpers/get-server-variables'
import type { WorkspaceDocument } from '@/schemas'
import type { XScalarSelectedServer } from '@/schemas/extensions/server/x-scalar-selected-server'
import { isOpenApiDocument } from '@/schemas/type-guards'
import type { OperationObject } from '@/schemas/v3.2/strict/operation'

/**
 * Server processing options containing base URLs for resolving relative server URLs.
 */
export type ServerProcessingOptions = {
  baseServerUrl?: string
  documentUrl?: string
  /** Allow configured hosts such as example.com/api without an explicit scheme. */
  allowSchemelessHost?: boolean
}

// Keep the context on the prepared server. Its URL remains the template used for selection and editing.
const serverUrlContext = Symbol('serverUrlContext')
const legacyServerSelection = Symbol('legacyServerSelection')
type PreparedServer = ServerObject & {
  [serverUrlContext]?: ServerProcessingOptions
  [legacyServerSelection]?: { previousUrl: string; currentUrl: string }
}

const hasUrlScheme = (url: string): boolean => /^[a-z][a-z\d+.-]*:/i.test(url)

const isRelativeServerUrl = (url: string, options: ServerProcessingOptions): boolean =>
  options.documentUrl && !options.allowSchemelessHost ? !hasUrlScheme(url) : isRelativePath(url)

/**
 * Prepares OpenAPI servers for URL resolution.
 * Root-relative URLs receive their base immediately so their selection keys stay stable.
 * Other relative templates retain the base context until their variables are expanded.
 */
export function getServers(servers: ServerObject[] | undefined, options: ServerProcessingOptions = {}): ServerObject[] {
  // Handle invalid server array
  if (!Array.isArray(servers)) {
    return []
  }

  // Process each server and filter out invalid ones
  const validServers = servers.map((server) => processServerObject(server, options))
  return validServers
}

/** Prepares a server for URL resolution without mutating the supplied server object. */
export const prepareServer = (
  server: ServerObject | null,
  options: ServerProcessingOptions = {},
): ServerObject | null => (server ? processServerObject({ ...server }, options) : null)

/**
 * Extracts the base URL (protocol + hostname) from a document URL.
 * Returns undefined if the URL is invalid.
 */
function extractBaseUrlFromDocumentUrl(documentUrl: string): string | undefined {
  try {
    const url = new URL(documentUrl)
    const port = url.port ? `:${url.port}` : ''
    return `${url.protocol}//${url.hostname}${port}`
  } catch {
    return undefined
  }
}

/**
 * Gets the fallback URL from window.location.origin if available.
 */
function getFallbackUrl(): string | undefined {
  if (typeof window === 'undefined' || typeof window?.location?.origin !== 'string') {
    return undefined
  }
  return window.location.origin
}

/**
 * Resolves a relative server URL to an absolute URL using available base URLs.
 * Uses a priority system: baseServerURL > documentUrl > fallbackUrl.
 */
function getRelativeServerBase({ baseServerUrl, documentUrl }: ServerProcessingOptions): string | undefined {
  return baseServerUrl || (documentUrl && extractBaseUrlFromDocumentUrl(documentUrl)) || getFallbackUrl()
}

function resolveRelativeServerUrl(serverUrl: string, baseUrl: string): string {
  if (serverUrl.startsWith('//')) {
    // A network-path reference supplies its own host. Only inherit the base scheme.
    const scheme = /^[a-z][a-z\d+.-]*:/i.exec(baseUrl)?.[0]?.toLowerCase()
    return scheme ? `${scheme}${serverUrl}` : serverUrl
  }
  return combineUrlAndPath(baseUrl, serverUrl, { preservePathSegments: true })
}

/**
 * Processes a single server object, handling validation and URL resolution.
 */
function processServerObject(server: ServerObject, options: ServerProcessingOptions): PreparedServer {
  if (server.url?.startsWith('/')) {
    const baseUrl = getRelativeServerBase(options)
    if (!baseUrl) {
      return server
    }

    const previousUrl = combineUrlAndPath(baseUrl, server.url)
    const currentUrl = resolveRelativeServerUrl(server.url, baseUrl)
    if (previousUrl !== currentUrl) {
      // Keep the legacy selection available through repeated preparation of this server.
      Object.defineProperty(server, legacyServerSelection, {
        value: { previousUrl, currentUrl },
        configurable: true,
      })
    }
    server.url = currentUrl
  } else if (server.url && (options.baseServerUrl || options.documentUrl) && isRelativeServerUrl(server.url, options)) {
    return { ...server, [serverUrlContext]: options }
  }

  return server
}

/** Returns the base context retained during preparation of a server template. */
export const getServerUrlContext = (server: PreparedServer | null): ServerProcessingOptions | undefined =>
  server?.[serverUrlContext]

/** Resolves a substituted server URL with its original base context. */
export const resolveServerUrlWithContext = (url: string, context?: ServerProcessingOptions): string => {
  if (url.startsWith('//')) {
    const baseUrl = getRelativeServerBase(context ?? {})
    return baseUrl ? resolveRelativeServerUrl(url, baseUrl) : url
  }

  if (!context || !isRelativeServerUrl(url, context)) {
    return url
  }

  // Keep remaining placeholders in a root-relative path available for later substitution.
  if (url.startsWith('/')) {
    const baseUrl = getRelativeServerBase(context)
    return baseUrl ? resolveRelativeServerUrl(url, baseUrl) : url
  }

  // An unexpanded template may still supply its own origin.
  if (url.includes('{')) {
    return url
  }

  if (context.baseServerUrl) {
    return combineUrlAndPath(context.baseServerUrl, url, { preservePathSegments: true })
  }

  return makeUrlAbsolute(url, { baseUrl: context.documentUrl })
}

/** Expands server variables before deciding whether the server needs a document base URL. */
export const resolveServerUrl = (
  server: PreparedServer | null,
  environmentVariables?: Record<string, string>,
): string => {
  const serverUrl = replacePathVariables(server?.url ?? '', getServerVariables(server))
  const url = environmentVariables ? replaceEnvVariables(serverUrl, environmentVariables) : serverUrl
  return resolveServerUrlWithContext(url, getServerUrlContext(server))
}

/** Finds the selected server and updates its stored URL when a legacy match is unambiguous. */
export const getSelectedServer = (
  document: WorkspaceDocument | null,
  operation: OperationObject | null,
  configServers: ServerObject[] | null,
  servers: PreparedServer[],
): ServerObject | null => {
  if (configServers == null && operation?.['x-scalar-selected-server'] != null) {
    return restoreServerSelection(servers, operation['x-scalar-selected-server'], operation)
  }

  const selectionTarget = isOpenApiDocument(document) ? document : null
  return restoreServerSelection(servers, selectionTarget?.['x-scalar-selected-server'], selectionTarget)
}

/** Prepares a scoped server selection for display without mutating the API description. */
export const prepareServerSelection = (
  scope: XScalarSelectedServer & { servers?: ServerObject[] },
  options: ServerProcessingOptions,
): ServerObject | null => {
  const servers = (scope.servers ?? []).flatMap((server) => {
    const prepared = prepareServer(getResolvedRef(server) ?? null, options)
    return prepared?.url ? [prepared] : []
  })
  return findSelectedServer(servers, scope['x-scalar-selected-server'])
}

/** Saves an unambiguous replacement for a legacy URL before its temporary alias is lost. */
export const restoreServerSelection = (
  servers: PreparedServer[],
  selectedServerUrl: string | undefined,
  selectionTarget: XScalarSelectedServer | null,
): ServerObject | null => {
  const server = findSelectedServer(servers, selectedServerUrl)
  if (selectionTarget && server && selectedServerUrl != null && selectedServerUrl !== server.url) {
    selectionTarget['x-scalar-selected-server'] = server.url
  }
  return server
}

/** Finds an exact selection first, then falls back to a single matching legacy URL. */
const findSelectedServer = (servers: PreparedServer[], selectedServerUrl?: string): ServerObject | null => {
  if (selectedServerUrl == null) {
    return servers[0] ?? null
  }

  const exact = servers.find(({ url }) => url === selectedServerUrl)
  if (exact) {
    return exact
  }

  const legacyMatches = servers.filter((server) => {
    const legacy = server[legacyServerSelection]
    return legacy?.currentUrl === server.url && legacy?.previousUrl === selectedServerUrl
  })
  return legacyMatches.length === 1 ? (legacyMatches[0] ?? null) : null
}
