import { type Server, serverSchema } from '@/entities/spec/server'
import { isDefined } from '@scalar/helpers/array/is-defined'
import { combineUrlAndPath } from '@scalar/helpers/url/merge-urls'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Server processing options containing base URLs for resolving relative server URLs.
 */
type ServerProcessingOptions = {
  baseServerURL?: string
  documentUrl?: string
}

/**
 * Retrieves and processes servers from an OpenAPI document.
 *
 * This function handles several scenarios:
 * 1. No servers provided - creates a default server from document URL or fallback
 * 2. Invalid server configurations - filters them out with warnings
 * 3. Relative URLs - resolves them to absolute URLs using available base URLs
 *
 * @param servers - Array of OpenAPI server objects from the document
 * @param options - Configuration options for server processing
 * @returns Array of validated Server entities
 */
export function getServersFromDocument(
  servers: ServerObject[] | undefined,
  options: ServerProcessingOptions = {},
): Server[] {
  // Handle case where no servers are provided
  if (!servers?.length) {
    const fallbackServer = createFallbackServer(options)
    return fallbackServer ? [fallbackServer] : []
  }

  // Handle invalid server array
  if (!Array.isArray(servers)) {
    return []
  }

  // Process each server and filter out invalid ones
  const validServers = servers.map((server) => processServerObject(server, options)).filter(isDefined)

  // If all servers were invalid, provide a fallback
  if (validServers.length === 0) {
    const fallbackServer = createFallbackServer(options)
    return fallbackServer ? [fallbackServer] : []
  }

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
 * Creates a server object from a URL string, with error handling.
 */
function createServerFromUrl(url: string, context: string): Server | undefined {
  try {
    return serverSchema.parse({ url })
  } catch {
    console.warn(`Failed to create server from ${context}:`, url)
    return undefined
  }
}

/**
 * Creates a default server using the document URL as the base.
 */
function createDefaultServerFromDocumentUrl(documentUrl: string): Server | undefined {
  const baseUrl = extractBaseUrlFromDocumentUrl(documentUrl)
  if (!baseUrl) {
    return undefined
  }

  return createServerFromUrl(baseUrl, 'document URL')
}

/**
 * Creates a default server using the fallback URL (window.location.origin).
 */
function createDefaultServerFromFallback(): Server | undefined {
  const fallbackUrl = getFallbackUrl()
  if (!fallbackUrl) {
    return undefined
  }

  return createServerFromUrl(fallbackUrl, 'fallback URL')
}

/**
 * Resolves a relative server URL to an absolute URL using available base URLs.
 * Uses a priority system: baseServerURL > documentUrl > fallbackUrl.
 */
function resolveRelativeServerUrl(serverUrl: string, options: ServerProcessingOptions): string {
  const { baseServerURL, documentUrl } = options

  // Priority 1: Use provided base server URL
  if (baseServerURL) {
    return combineUrlAndPath(baseServerURL, serverUrl)
  }

  // Priority 2: Extract base URL from document URL
  if (documentUrl) {
    const baseUrl = extractBaseUrlFromDocumentUrl(documentUrl)
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
function processServerObject(server: ServerObject, options: ServerProcessingOptions): Server | undefined {
  try {
    const parsedServer = serverSchema.parse(server)

    // Resolve relative URLs to absolute URLs
    if (parsedServer.url?.startsWith('/')) {
      parsedServer.url = resolveRelativeServerUrl(parsedServer.url, options)
    }

    return parsedServer
  } catch (error) {
    console.warn('Invalid server configuration:', server, 'Error:', error)
    return undefined
  }
}

/**
 * Creates a fallback server when no valid servers are available.
 * Uses document URL first, then fallback URL.
 */
function createFallbackServer(options: ServerProcessingOptions): Server | undefined {
  // Priority 1: Try to create default server from document URL
  if (options.documentUrl) {
    const defaultServer = createDefaultServerFromDocumentUrl(options.documentUrl)

    if (defaultServer) {
      return defaultServer
    }
  }

  // Priority 2: Try to create default server from fallback URL
  return createDefaultServerFromFallback()
}
