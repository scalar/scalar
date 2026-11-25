import { combineUrlAndPath } from '@scalar/helpers/url/merge-urls'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { withServerUrlBase } from '@/request-example/builder/helpers/resolve-server-url'
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

/** Retrieves server choices and associates relative URLs with their configured or document base. */
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
    if (server.url?.startsWith('/')) {
      const origin = baseServerUrl || (documentBase ? new URL('/', documentBase).href : baseUrl)
      // Existing selections and server mutations use the same resolved URL as their key.
      server.url = combineUrlAndPath(origin, server.url)
      return server
    }

    return withServerUrlBase(server, base)
  })
}

/** Keeps credentials used to fetch an API description out of the server URLs derived from it. */
const getDocumentBase = (documentUrl: string | undefined): URL | undefined => {
  if (!documentUrl || !URL.canParse('.', documentUrl)) {
    return undefined
  }

  const base = new URL(documentUrl)
  base.username = ''
  base.password = ''
  return base
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
