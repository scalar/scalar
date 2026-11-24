import { replaceEnvVariables, replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { isRelativePath } from '@scalar/helpers/url/is-relative-path'
import { makeUrlAbsolute } from '@scalar/helpers/url/make-url-absolute'
import { combineUrlAndPath } from '@scalar/helpers/url/merge-urls'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { getServerVariables } from '@/request-example/builder/helpers/get-server-variables'
import type { WorkspaceDocument } from '@/schemas'
import { isOpenApiDocument } from '@/schemas/type-guards'
import type { OperationObject } from '@/schemas/v3.2/strict/operation'

/**
 * Server processing options containing base URLs for resolving relative server URLs.
 */
type ServerProcessingOptions = {
  baseServerUrl?: string
  documentUrl?: string
}

// Keep the context on the prepared server. Its URL remains the template used for selection and editing.
const serverUrlContext = Symbol('serverUrlContext')
type PreparedServer = ServerObject & { [serverUrlContext]?: ServerProcessingOptions }

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
function resolveRelativeServerUrl(serverUrl: string, options: ServerProcessingOptions): string {
  const { baseServerUrl, documentUrl } = options
  const baseUrl = baseServerUrl || (documentUrl && extractBaseUrlFromDocumentUrl(documentUrl)) || getFallbackUrl()
  return baseUrl ? combineUrlAndPath(baseUrl, serverUrl, { preservePathSegments: true }) : serverUrl
}

/**
 * Processes a single server object, handling validation and URL resolution.
 */
function processServerObject(server: ServerObject, options: ServerProcessingOptions): PreparedServer {
  if (server.url?.startsWith('/')) {
    server.url = resolveRelativeServerUrl(server.url, options)
  } else if (server.url && isRelativePath(server.url) && (options.baseServerUrl || options.documentUrl)) {
    return { ...server, [serverUrlContext]: options }
  }

  return server
}

/** Expands server variables before deciding whether the server needs a document base URL. */
export const resolveServerUrl = (
  server: PreparedServer | null,
  environmentVariables?: Record<string, string>,
): string => {
  const serverUrl = replacePathVariables(server?.url ?? '', getServerVariables(server))
  const url = environmentVariables ? replaceEnvVariables(serverUrl, environmentVariables) : serverUrl
  const context = server?.[serverUrlContext]

  if (!context || !isRelativePath(url)) {
    return url
  }

  // Keep remaining placeholders in a root-relative path available for later substitution.
  if (url.startsWith('/') && !url.startsWith('//')) {
    return resolveRelativeServerUrl(url, context)
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

export const getSelectedServer = (
  document: WorkspaceDocument | null,
  operation: OperationObject | null,
  configServers: ServerObject[] | null,
  servers: ServerObject[],
): ServerObject | null => {
  const documentSelectedServer = isOpenApiDocument(document) ? document['x-scalar-selected-server'] : undefined
  const selectedServerUrl =
    configServers != null ? documentSelectedServer : (operation?.['x-scalar-selected-server'] ?? documentSelectedServer)

  if (selectedServerUrl == null) {
    return servers[0] ?? null
  }

  return servers.find(({ url }) => url === selectedServerUrl) ?? null
}
