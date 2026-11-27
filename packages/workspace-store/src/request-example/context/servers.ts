import type { ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { resolveServerUrl, withServerUrlBase } from '@/request-example/builder/helpers/resolve-server-url'
import type { WorkspaceDocument } from '@/schemas'
import type { XScalarSelectedServer } from '@/schemas/extensions/server/x-scalar-selected-server'
import { isOpenApiDocument } from '@/schemas/type-guards'

/**
 * Server processing options containing base URLs for resolving relative server URLs.
 */
type ServerProcessingOptions = {
  baseServerUrl?: string
  documentUrl?: string
}

/**
 * Retrieves server choices and associates relative URLs with their configured or document base.
 * Root-relative inputs are resolved in place so selections and edits share the same URL key.
 */
export const getServers = (
  servers: ServerObject[] | undefined,
  { baseServerUrl, documentUrl }: ServerProcessingOptions = {},
): ServerObject[] => {
  if (!Array.isArray(servers)) {
    return []
  }

  const documentBase = getDocumentBase(documentUrl)
  const baseUrl = baseServerUrl || documentBase?.href || getFallbackUrl()
  if (!baseUrl) {
    return servers
  }

  const fallbackSource = documentBase ? 'document' : 'browser'
  const source = baseServerUrl ? 'configuration' : fallbackSource
  const base = { url: baseUrl, source } as const
  return servers.map((server) => {
    const preparedServer = withServerUrlBase(server, base)
    if (server.url?.startsWith('/') && !server.url.startsWith('//') && !server.url.includes('{')) {
      // Existing selections and server mutations use the same resolved URL as their key.
      server.url = resolveServerUrl(preparedServer)
      return server
    }

    return preparedServer
  })
}

/** Keeps credentials used to fetch an API description out of the server URLs derived from it. */
const getDocumentBase = (documentUrl: string | undefined): URL | undefined => {
  if (!documentUrl) {
    return undefined
  }

  try {
    const base = new URL(documentUrl)
    if (base.protocol !== 'http:' && base.protocol !== 'https:') {
      return undefined
    }
    base.username = ''
    base.password = ''
    return base
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
  return window.location.origin === 'null' ? undefined : window.location.origin
}

export const getSelectedServer = (
  document: WorkspaceDocument | null,
  localScope: XScalarSelectedServer | null,
  configServers: ServerObject[] | null,
  servers: ServerObject[],
): ServerObject | null => {
  const documentSelectedServer = isOpenApiDocument(document) ? document['x-scalar-selected-server'] : undefined
  const selectedServerUrl =
    configServers != null
      ? documentSelectedServer
      : (localScope?.['x-scalar-selected-server'] ?? documentSelectedServer)

  if (selectedServerUrl == null) {
    return servers[0] ?? null
  }

  return servers.find(({ url }) => url === selectedServerUrl) ?? null
}
