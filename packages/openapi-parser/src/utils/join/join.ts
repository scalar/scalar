import type { UnknownObject } from '@/types'
import { mergeObjects } from '@/utils/join/merge-objects'
import { upgrade } from '@/utils/upgrade'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Returns the intersection of two sets as an array.
 *
 * @param a - The first set
 * @param b - The second set
 * @returns An array containing the elements present in both sets
 *
 * @example
 * const setA = new Set([1, 2, 3, 4])
 * const setB = new Set([3, 4, 5, 6])
 * const intersection = getSetIntersection(setA, setB)
 * // intersection: [3, 4]
 */
const getSetIntersection = <T>(a: Set<T>, b: Set<T>): T[] => {
  const result: T[] = []
  for (const value of a) {
    if (b.has(value)) {
      result.push(value)
    }
  }
  return result
}

/**
 * Merges multiple OpenAPI PathsObjects into a single PathsObject.
 * - If a path does not exist in the result, it is added directly.
 * - If a path already exists, its operations (get, post, etc.) are merged.
 * - If the same operation (e.g., "get") exists for the same path in multiple inputs,
 *   a conflict is recorded for that path and method.
 *
 * @param inputs - Array of OpenAPIV3_1.PathsObject to merge
 * @returns An object containing the merged paths and a list of conflicts
 */
const mergePaths = (inputs: OpenAPIV3_1.PathsObject[]) => {
  const result: OpenAPIV3_1.PathsObject = {}
  const conflicts: { path: string; method: string }[] = []

  for (const paths of inputs) {
    if (typeof paths !== 'object') {
      continue
    }

    for (const [path, pathItem] of Object.entries(paths)) {
      if (!result[path]) {
        // If the path does not exist, add it directly
        result[path] = pathItem
        continue
      }

      // Find intersecting operation keys (e.g., "get", "post") for this path
      const intersectingKeys = getSetIntersection(new Set(Object.keys(result[path])), new Set(Object.keys(pathItem)))

      // If the path exists, merge the operations (get, post, etc.)
      result[path] = { ...result[path], ...pathItem }
      // Record conflicts for each intersecting operation key
      intersectingKeys.forEach((key) => conflicts.push({ method: key, path }))
    }
  }

  return { paths: result, conflicts }
}

/**
 * Merges multiple arrays of OpenAPI TagObjects into a single array, ensuring uniqueness by tag name.
 * - If a tag with the same name appears in multiple arrays, only the first occurrence is included in the result.
 *
 * @param inputs - Array of arrays of OpenAPIV3_1.TagObject to merge
 * @returns An array of unique TagObjects (by name)
 */
const mergeTags = (inputs: OpenAPIV3_1.TagObject[][]) => {
  const cache = new Set<string>()
  const result: OpenAPIV3_1.TagObject[] = []

  for (const tags of inputs) {
    for (const tag of tags) {
      if (!cache.has(tag.name)) {
        result.push(tag)
      }
      cache.add(tag.name)
    }
  }

  return result
}

/**
 * Merges multiple arrays of OpenAPI ServerObjects into a single array, ensuring uniqueness by server URL.
 * - If a server with the same URL appears in multiple arrays, only the first occurrence is included in the result.
 *
 * @param inputs - Array of arrays of OpenAPIV3_1.ServerObject to merge
 * @returns An array of unique ServerObjects (by url)
 */
const mergeServers = (inputs: OpenAPIV3_1.ServerObject[][]) => {
  const cache = new Set<string>()
  const result: OpenAPIV3_1.ServerObject[] = []

  for (const servers of inputs) {
    for (const server of servers) {
      if (!cache.has(server.url)) {
        result.push(server)
      }
      cache.add(server.url)
    }
  }

  return result
}

type Conflicts = { type: 'path'; path: string; method: string } | { type: 'webhook'; path: string; method: string }
type JoinResult = { ok: true; document: OpenAPIV3_1.Document } | { ok: false; conflicts: Conflicts[] }

/**
 * Joins multiple OpenAPI documents into a single document.
 *
 * - Merges the "info" object, paths, webhooks, tags, and servers from all input documents.
 * - If there are conflicting paths or webhooks (same path and method), returns a list of conflicts.
 * - Only the first occurrence of a tag (by name) or server (by url) is included.
 * - The merge is performed in reverse order, so the first document in the input array has the highest precedence.
 *
 * @param inputs - Array of OpenAPI documents (UnknownObject) to join
 * @returns {JoinResult} - { ok: true, document } if successful, or { ok: false, conflicts } if there are conflicts
 *
 * @example
 * const doc1 = {
 *   info: { title: "API 1", version: "1.0.0" },
 *   paths: { "/foo": { get: { summary: "Get Foo" } } },
 *   tags: [{ name: "foo" }],
 *   servers: [{ url: "https://api1.example.com" }]
 * }
 * const doc2 = {
 *   info: { description: "Second API" },
 *   paths: { "/bar": { get: { summary: "Get Bar" } } },
 *   tags: [{ name: "bar" }],
 *   servers: [{ url: "https://api2.example.com" }]
 * }
 * const result = join([doc1, doc2])
 * // result.ok === true
 * // result.document.info.title === "API 1"
 * // result.document.info.description === "Second API"
 * // result.document.paths has both "/foo" and "/bar"
 * // result.document.tags contains both "foo" and "bar"
 * // result.document.servers contains both server URLs
 */
export const join = (inputs: UnknownObject[]): JoinResult => {
  // Reverse the input list and upgrade them (first input has highest precedence)
  const upgraded = inputs.reverse().map((it) => upgrade(it).specification)

  // Merge only the "info" object from all inputs
  const info = upgraded.reduce<OpenAPIV3_1.InfoObject>((acc, curr) => {
    if (curr.info && typeof curr.info === 'object') {
      return mergeObjects(acc, curr.info)
    }
    return acc
  }, {} as OpenAPIV3_1.InfoObject)

  // Merge paths from all documents, collecting conflicts
  const { paths, conflicts: pathConflicts } = mergePaths(upgraded.map((it) => it.paths ?? {}))

  // Merge webhooks from all documents, collecting conflicts
  const { paths: webhooks, conflicts: webhookConflicts } = mergePaths(upgraded.map((it) => it.webhooks ?? {}))

  // Merge tags, ensuring uniqueness by tag name
  const tags = mergeTags(upgraded.map((it) => it.tags ?? []))

  // Merge servers, ensuring uniqueness by server url
  const servers = mergeServers(upgraded.map((it) => it.servers ?? []))

  // Merge all documents in the upgraded array into a single object (shallow merge)
  const result = upgraded.reduce<UnknownObject>((acc, curr) => ({ ...acc, ...curr }), {})

  // Collect all conflicts (paths and webhooks)
  const conflicts: Conflicts[] = [
    ...pathConflicts.map((it) => ({ type: 'path', path: it.path, method: it.method }) as const),
    ...webhookConflicts.map((it) => ({ type: 'webhook', path: it.path, method: it.method }) as const),
  ]

  // If there are any conflicts, return them
  if (conflicts.length) {
    return {
      ok: false,
      conflicts,
    }
  }

  // Return the merged OpenAPI document
  return {
    ok: true,
    document: {
      ...result,
      info,
      paths,
      webhooks,
      tags: tags,
      servers: servers,
    },
  }
}
