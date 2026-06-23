import type { ServerObject } from '@/schemas/v3.1/strict/openapi-document'

import { getResolvedRef } from './get-resolved-ref'

/**
 * Iterate through all available servers and pick the first one
 *
 * @example
 * getFirstServer(operation.servers, pathItem.servers, document.servers)
 */
export const getFirstServer = (...availableServers: (ServerObject[] | ServerObject | null)[]): ServerObject | null => {
  for (const serverSource of availableServers) {
    if (!serverSource) {
      continue
    }

    // Handle single server object
    if (!Array.isArray(serverSource)) {
      const resolvedServer = getResolvedRef(serverSource) as ServerObject
      if (resolvedServer?.url) {
        return resolvedServer
      }
      continue
    }

    // Handle array of servers, pick the first one with a URL
    for (const server of serverSource) {
      const resolvedServer = getResolvedRef(server) as ServerObject
      if (resolvedServer?.url) {
        return resolvedServer
      }
    }
  }

  return null
}
