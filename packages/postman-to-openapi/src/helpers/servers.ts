import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { ServerUsage } from './path-items'

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
 * - If server used in all paths → document level
 * - If server used in multiple paths → document level
 * - If server used in multiple operations within 1 path → path item level
 * - If server used in only 1 operation → operation level
 */
export function analyzeServerDistribution(serverUsage: ServerUsage[], allUniquePaths: Set<string>): ServerPlacement {
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

    // Check if server covers all paths in the document
    const coversAllPaths =
      allUniquePaths.size > 0 &&
      uniquePaths.size === allUniquePaths.size &&
      Array.from(uniquePaths).every((path) => allUniquePaths.has(path))

    if (coversAllPaths || pathCount > 1) {
      // Server used in all paths or multiple paths → document level
      placement.document.push(serverObject)
    } else if (usages.size > 1) {
      // Server used in multiple operations within 1 path → path item level
      const path = Array.from(usages)[0]?.path
      if (!path) {
        continue
      }
      if (!placement.pathItems.has(path)) {
        placement.pathItems.set(path, [])
      }
      placement.pathItems.get(path)!.push(serverObject)
    } else {
      // Server used in only 1 operation → operation level
      const usage = Array.from(usages)[0]
      if (!usage) {
        continue
      }
      const operationKey = `${usage.path}:${usage.method}`
      if (!placement.operations.has(operationKey)) {
        placement.operations.set(operationKey, [])
      }
      placement.operations.get(operationKey)!.push(serverObject)
    }
  }

  return placement
}
