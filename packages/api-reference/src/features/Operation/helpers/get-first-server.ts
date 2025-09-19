import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Iterate through all available servers and pick the first one
 *
 * @example
 * getFirstServer([operation.servers, pathItem.servers, server])
 */
export function getFirstServer(
  ...availableServers: (ServerObject[] | ServerObject | undefined)[]
): ServerObject | undefined {
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

  return undefined
}
