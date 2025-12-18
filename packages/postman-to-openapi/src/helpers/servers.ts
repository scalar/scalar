import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { Item, ItemGroup, PostmanCollection } from '@/types'
import type { ServerUsage } from './path-items'

/**
 * Recursively processes collection items to extract server URLs
 */
function processItems(items: (Item | ItemGroup)[], domains: Set<string>) {
  items.forEach((item) => {
    if ('item' in item && Array.isArray(item.item)) {
      processItems(item.item, domains)
    } else if ('request' in item) {
      const request = item.request
      if (typeof request !== 'string') {
        const url = typeof request.url === 'string' ? request.url : request.url?.raw

        if (url) {
          try {
            // Extract domain from URL
            const urlMatch = url.match(/^(?:https?:\/\/)?([^/?#]+)/i)
            if (urlMatch?.[1]) {
              // Ensure we have the protocol
              const serverUrl = urlMatch[1].startsWith('http')
                ? urlMatch[1].replace(/\/$/, '')
                : `https://${urlMatch[1]}`.replace(/\/$/, '')
              domains.add(serverUrl)
            }
          } catch (error) {
            console.error(`Error extracting domain from URL "${url}":`, error)
          }
        }
      }
    }
  })
}

/**
 * Parses a Postman collection to extract unique server URLs.
 * @deprecated This function is kept for backward compatibility but servers are now placed at appropriate levels.
 */
export function parseServers(postmanCollection: PostmanCollection): OpenAPIV3_1.ServerObject[] {
  const domains = new Set<string>()

  if (postmanCollection.item && Array.isArray(postmanCollection.item)) {
    processItems(postmanCollection.item, domains)
  }

  return Array.from(domains).map((domain) => ({
    url: domain,
  }))
}

/**
 * Information about where a server should be placed.
 */
export type ServerPlacement = {
  document: OpenAPIV3_1.ServerObject[]
  pathItems: Map<string, OpenAPIV3_1.ServerObject[]>
  operations: Map<string, OpenAPIV3_1.ServerObject[]>
}

/**
 * Analyzes server usage and determines the optimal placement level for each server.
 * Placement logic:
 * - If server used in only 1 operation → operation level
 * - If server used in multiple operations within 1 path → path item level
 * - If server used in multiple paths → document level
 */
export function analyzeServerDistribution(serverUsage: ServerUsage[]): ServerPlacement {
  const placement: ServerPlacement = {
    document: [],
    pathItems: new Map(),
    operations: new Map(),
  }

  if (serverUsage.length === 0) {
    return placement
  }

  // Build a map: serverUrl -> Set<{path, method}>
  const serverMap = new Map<string, Set<{ path: string; method: string }>>()

  for (const usage of serverUsage) {
    if (!serverMap.has(usage.serverUrl)) {
      serverMap.set(usage.serverUrl, new Set())
    }
    serverMap.get(usage.serverUrl)!.add({
      path: usage.path,
      method: usage.method,
    })
  }

  // For each server, determine its placement
  for (const [serverUrl, usages] of serverMap.entries()) {
    const serverObject: OpenAPIV3_1.ServerObject = { url: serverUrl }

    // Count unique paths this server appears in
    const uniquePaths = new Set(Array.from(usages).map((u) => u.path))
    const pathCount = uniquePaths.size

    if (pathCount > 1) {
      // Server used in multiple paths → document level
      placement.document.push(serverObject)
    } else if (usages.size > 1) {
      // Server used in multiple operations within 1 path → path item level
      const path = Array.from(usages)[0].path
      if (!placement.pathItems.has(path)) {
        placement.pathItems.set(path, [])
      }
      placement.pathItems.get(path)!.push(serverObject)
    } else {
      // Server used in only 1 operation → operation level
      const usage = Array.from(usages)[0]
      const operationKey = `${usage.path}:${usage.method}`
      if (!placement.operations.has(operationKey)) {
        placement.operations.set(operationKey, [])
      }
      placement.operations.get(operationKey)!.push(serverObject)
    }
  }

  return placement
}
