import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { ServerUsage } from './path-items'

/**
 * Information about where a server should be placed.
 */
type ServerPlacement = {
  document: OpenAPIV3_1.ServerObject[]
  pathItems: Map<string, OpenAPIV3_1.ServerObject[]>
  operations: Map<string, Map<string, OpenAPIV3_1.ServerObject[]>>
}

/**
 * Creates a unique key for a path/method combination.
 * Used to properly deduplicate operations in a Set since JavaScript Sets
 * compare objects by reference, not by value.
 */
function createOperationKey(path: string, method: string): string {
  return `${path}::${method}`
}

/**
 * Parses an operation key back into its path and method components.
 */
function parseOperationKey(key: string): { path: string; method: string } {
  const separatorIndex = key.lastIndexOf('::')
  return {
    path: key.substring(0, separatorIndex),
    method: key.substring(separatorIndex + 2),
  }
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

  // Build a map: serverUrl -> Set<operationKey>
  // Using string keys instead of objects because JavaScript Sets compare by reference
  const serverMap = new Map<string, Set<string>>()

  for (const usage of serverUsage) {
    if (!serverMap.has(usage.serverUrl)) {
      serverMap.set(usage.serverUrl, new Set())
    }
    serverMap.get(usage.serverUrl)!.add(createOperationKey(usage.path, usage.method))
  }

  // For each server, determine its placement
  for (const [serverUrl, operationKeys] of serverMap.entries()) {
    const serverObject: OpenAPIV3_1.ServerObject = { url: serverUrl }

    // Parse operation keys back to path/method pairs
    const operations = Array.from(operationKeys).map(parseOperationKey)

    // Count unique paths this server appears in
    const uniquePaths = new Set(operations.map((op) => op.path))
    const pathCount = uniquePaths.size

    // Check if server covers all paths in the document
    const coversAllPaths =
      allUniquePaths.size > 0 &&
      uniquePaths.size === allUniquePaths.size &&
      Array.from(uniquePaths).every((path) => allUniquePaths.has(path))

    if (coversAllPaths || pathCount > 1) {
      // Server used in all paths or multiple paths → document level
      placement.document.push(serverObject)
    } else if (operations.length > 1) {
      // Server used in multiple operations within 1 path → path item level
      const path = operations[0]?.path
      if (!path) {
        continue
      }
      if (!placement.pathItems.has(path)) {
        placement.pathItems.set(path, [])
      }
      placement.pathItems.get(path)!.push(serverObject)
    } else {
      // Server used in only 1 operation → operation level
      const operation = operations[0]
      if (!operation) {
        continue
      }
      // Use nested Map structure: path -> method -> servers
      if (!placement.operations.has(operation.path)) {
        placement.operations.set(operation.path, new Map())
      }
      const methodsMap = placement.operations.get(operation.path)!
      if (!methodsMap.has(operation.method)) {
        methodsMap.set(operation.method, [])
      }
      methodsMap.get(operation.method)!.push(serverObject)
    }
  }

  return placement
}
