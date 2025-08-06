import { type Server, serverSchema } from '@/entities/spec/server'
import type { ImportSpecToWorkspaceArgs } from '@/transforms'
import { isDefined } from '@scalar/helpers/array/is-defined'
import { combineUrlAndPath } from '@scalar/helpers/url/merge-urls'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

/**
 * Extracts the base URL (protocol + hostname) from a document URL.
 * Falls back to the original URL if it's not a valid URL.
 */
function getBaseUrlFromDocumentUrl(documentUrl: string): string | undefined {
  try {
    const url = new URL(documentUrl)
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`
  } catch {
    // If the documentUrl is not a valid URL, we can't use it
    return undefined
  }
}

/**
 * Creates a default server from the document URL when no servers are provided.
 */
function createDefaultServerFromDocumentUrl(documentUrl: string): Server | undefined {
  const baseUrl = getBaseUrlFromDocumentUrl(documentUrl)

  if (!baseUrl) {
    return undefined
  }

  try {
    return serverSchema.parse({ url: baseUrl })
  } catch {
    console.warn('Failed to create default server from document URL:', documentUrl)
    return undefined
  }
}

/**
 * Creates a default server using the fallback URL when no other options are available.
 */
function createDefaultServerFromFallback(): Server | undefined {
  const fallbackUrl = getFallbackUrl()

  if (!fallbackUrl) {
    return undefined
  }

  try {
    return serverSchema.parse({ url: fallbackUrl })
  } catch {
    console.warn('Failed to create default server from fallback URL:', fallbackUrl)
    return undefined
  }
}

/**
 * Resolves a relative server URL to an absolute URL using available base URLs.
 */
function resolveRelativeServerUrl(
  serverUrl: string,
  options: {
    baseServerURL?: string
    documentUrl?: string
  },
): string {
  const { baseServerURL, documentUrl } = options

  // Priority 1: Use provided base server URL
  if (baseServerURL) {
    return combineUrlAndPath(baseServerURL, serverUrl)
  }

  // Priority 2: Extract base URL from document URL
  if (documentUrl) {
    const baseUrl = getBaseUrlFromDocumentUrl(documentUrl)
    if (baseUrl) {
      return combineUrlAndPath(baseUrl, serverUrl)
    }
  }

  // Priority 3: Use fallback URL (window.location.origin)
  const fallbackUrl = getFallbackUrl()

  if (fallbackUrl) {
    return combineUrlAndPath(fallbackUrl, serverUrl)
  }

  // If no base URL is available, return the original URL
  return serverUrl
}

/**
 * Processes a single server object, handling validation and URL resolution.
 */
function processServerObject(
  server: OpenAPIV3_1.ServerObject,
  options: {
    baseServerURL?: string
    documentUrl?: string
  },
): Server | undefined {
  try {
    // Validate the server against the schema
    const parsedServer = serverSchema.parse(server)

    // Resolve relative URLs to absolute URLs
    if (parsedServer.url?.startsWith('/')) {
      parsedServer.url = resolveRelativeServerUrl(parsedServer.url, options)
    }

    return parsedServer
  } catch (error) {
    console.warn('Invalid server configuration:', server)
    console.warn('Error:', error)
    return undefined
  }
}

/**
 * Retrieves a list of servers from an OpenAPI document and converts them to a list of Server entities.
 *
 * This function handles several scenarios:
 * 1. No servers provided - creates a default server from document URL
 * 2. Invalid server configurations - filters them out with warnings
 * 3. Relative URLs - resolves them to absolute URLs using available base URLs
 *
 * @param servers - Array of OpenAPI server objects from the document
 * @param options - Configuration options for server processing
 * @returns Array of validated Server entities
 */
export function getServersFromOpenApiDocument(
  servers: OpenAPIV3_1.ServerObject[] | undefined,
  {
    baseServerURL,
    documentUrl,
  }: Pick<ApiReferenceConfiguration, 'baseServerURL'> & Pick<ImportSpecToWorkspaceArgs, 'documentUrl'> = {},
): Server[] {
  // Handle case where no servers are provided
  if (!servers?.length) {
    // Priority 1: Try to create default server from document URL
    if (documentUrl) {
      const defaultServer = createDefaultServerFromDocumentUrl(documentUrl)

      if (defaultServer) {
        return [defaultServer]
      }
    }

    // Priority 2: Try to create default server from fallback URL
    const fallbackServer = createDefaultServerFromFallback()

    if (fallbackServer) {
      return [fallbackServer]
    }

    // If all else fails, return empty array
    return []
  }

  // Handle invalid server array
  if (!Array.isArray(servers)) {
    return []
  }

  // Process each server and filter out invalid ones
  const validServers = servers
    .map((server) => processServerObject(server, { baseServerURL, documentUrl }))
    .filter(isDefined)

  // If all servers were invalid, provide a fallback
  if (validServers.length === 0) {
    // Priority 1: Try to create default server from document URL
    if (documentUrl) {
      const defaultServer = createDefaultServerFromDocumentUrl(documentUrl)

      if (defaultServer) {
        return [defaultServer]
      }
    }

    // Priority 2: Try to create default server from fallback URL
    const fallbackServer = createDefaultServerFromFallback()

    if (fallbackServer) {
      return [fallbackServer]
    }
  }

  return validServers
}

/**
 * Fallback to the current window.location.origin, if available
 */
function getFallbackUrl() {
  if (typeof window === 'undefined') {
    return undefined
  }

  if (typeof window?.location?.origin !== 'string') {
    return undefined
  }

  return window.location.origin
}
