import { bundle } from '@scalar/json-magic/bundle'
import type {
  ComponentsObject,
  Document as OpenApiDocumentV3_1,
  InfoObject as OpenApiInfoObjectV3_1,
  PathsObject,
  ServerObject,
  TagObject,
} from '@scalar/openapi-types/3.1'

import type { UnknownObject } from '@/types'
import { mergeObjects } from '@/utils/join/merge-objects'
import { upgrade } from '@/utils/upgrade'

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
 * Returns the value if it is not nullish (or, for arrays, not empty), otherwise returns the provided default value.
 * Useful for handling OpenAPI fields that may be missing or empty.
 */
const withDefault = <T, K>(value: T, defaultValue: K): T | K => {
  if (Array.isArray(value)) {
    return value.length ? value : defaultValue
  }

  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length ? value : defaultValue
  }

  return value ?? defaultValue
}

/**
 * Merges multiple OpenAPI PathsObjects into a single PathsObject.
 * - If a path does not exist in the result, it is added directly.
 * - If a path already exists, its operations (get, post, etc.) are merged.
 * - If the same operation (e.g., "get") exists for the same path in multiple inputs,
 *   a conflict is recorded for that path and method.
 *
 * @param inputs - Array of OpenAPI 3.1 PathsObjects to merge
 * @returns An object containing the merged paths and a list of conflicts
 */
const mergePaths = (inputs: PathsObject[]) => {
  const result: PathsObject = {}
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
 * @param inputs - Array of arrays of OpenAPI 3.1 TagObjects to merge
 * @returns An array of unique TagObjects (by name)
 */
const mergeTags = (inputs: TagObject[][]) => {
  const cache = new Set<string>()
  const result: TagObject[] = []

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
 * @param inputs - Array of arrays of OpenAPI 3.1 ServerObjects to merge
 * @returns An array of unique ServerObjects (by url)
 */
const mergeServers = (inputs: ServerObject[][]) => {
  const cache = new Set<string>()
  const result: ServerObject[] = []

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

/**
 * Merges multiple OpenAPI ComponentsObject instances into a single components object.
 * - If a component with the same type and name appears in multiple inputs, only the first occurrence is included.
 * - Any conflicts (duplicate component names within the same type) are recorded in the `conflicts` array.
 *
 * @param inputs - Array of OpenAPI 3.1 ComponentsObjects to merge
 * @returns An object containing the merged components and an array of conflicts
 */
const mergeComponents = (inputs: ComponentsObject[]) => {
  const result: ComponentsObject = {}
  const conflicts: { componentType: string; name: string }[] = []

  for (const components of inputs) {
    if (typeof components !== 'object') {
      continue
    }

    // Merge each component type (schemas, responses, parameters, etc.)
    for (const [key, value] of Object.entries(components)) {
      for (const [name, component] of Object.entries(value)) {
        if (!result[key]) {
          result[key] = {}
        }

        if (result[key][name]) {
          // If the component already exists, record a conflict
          conflicts.push({ componentType: key, name })
        } else {
          // Otherwise, add the component
          result[key][name] = component
        }
      }
    }
  }

  return { components: result, conflicts }
}

/**
 * Prefixes component names and their references in multiple OpenAPI documents.
 *
 * This function mutates each input document in-place by:
 *   1. Prefixing all component names (e.g., schema names) with the corresponding prefix.
 *   2. Updating all $ref values that point to components to use the prefixed names.
 *
 * This is useful when merging multiple OpenAPI documents to avoid component name collisions.
 *
 * @param inputs - Array of OpenAPI documents to mutate.
 * @param prefixes - Array of prefixes to apply to each document's components.
 */
const prefixComponents = async (inputs: OpenApiDocumentV3_1[], prefixes: string[]) => {
  for (const index of inputs.keys()) {
    await bundle(inputs[index], {
      treeShake: false,
      urlMap: false,
      plugins: [
        // Plugin to update $ref values to use the prefixed component names
        {
          type: 'lifecycle',
          onBeforeNodeProcess: (node) => {
            const ref = node['$ref']

            if (typeof ref !== 'string') {
              return
            }

            // Only process refs that point to components
            if (!ref.startsWith('#/components/')) {
              return
            }

            const parts = ref.split('/')
            // Ensure the ref has the expected structure: #/components/{type}/{name}
            if (parts.length < 4) {
              return
            }

            // Prefix the component name (parts[3]) with the provided prefix
            parts[3] = `${prefixes[index] ?? ''}${parts[3]}`

            node['$ref'] = parts.join('/')
          },
        },
        // Plugin to rename component keys with the prefix
        {
          type: 'lifecycle',
          onBeforeNodeProcess: (node, context) => {
            // Check if the node is a component type object (e.g., schemas, responses) under "components"
            if (context.path.length === 2 && context.path[0] === 'components') {
              const prefix = prefixes[index]

              Object.keys(node).forEach((key) => {
                const newKey = `${prefix ?? ''}${key}`
                const childNode = node[key]
                delete node[key]
                node[newKey] = childNode
              })
            }
          },
        },
      ],
    })
  }
}

type Conflicts =
  | { type: 'path'; path: string; method: string }
  | { type: 'webhook'; path: string; method: string }
  | { type: 'component'; componentType: string; name: string }
type JoinResult = { ok: true; document: OpenApiDocumentV3_1 } | { ok: false; conflicts: Conflicts[] }

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
export const join = async (inputs: UnknownObject[], config?: { prefixComponents: string[] }): Promise<JoinResult> => {
  // Reverse the input list and upgrade them (first input has highest precedence)
  const upgraded = inputs.map((it) => upgrade(it).specification)

  // Preprocess documents by prefixing components if specified
  if (config?.prefixComponents) {
    await prefixComponents(upgraded, config.prefixComponents)
  }

  // Reverse the upgraded documents to ensure the first document has the highest precedence
  upgraded.reverse()

  // Merge only the "info" object from all inputs
  const info = upgraded.reduce<OpenApiInfoObjectV3_1>((acc, curr) => {
    if (curr.info && typeof curr.info === 'object') {
      return mergeObjects(acc, curr.info)
    }
    return acc
  }, {} as OpenApiInfoObjectV3_1)

  // Merge paths from all documents, collecting conflicts
  const { paths, conflicts: pathConflicts } = mergePaths(upgraded.map((it) => it.paths ?? {}))

  // Merge webhooks from all documents, collecting conflicts
  const { paths: webhooks, conflicts: webhookConflicts } = mergePaths(upgraded.map((it) => it.webhooks ?? {}))

  // Merge tags, ensuring uniqueness by tag name
  const tags = mergeTags(upgraded.map((it) => it.tags ?? []))

  // Merge servers, ensuring uniqueness by server url
  const servers = mergeServers(upgraded.map((it) => it.servers ?? []))

  // Merge components, collecting conflicts
  const { components, conflicts: componentConflicts } = mergeComponents(upgraded.map((it) => it.components ?? {}))

  // Merge all documents in the upgraded array into a single object (shallow merge)
  const result = upgraded.reduce<UnknownObject>((acc, curr) => ({ ...acc, ...curr }), {})

  // Collect all conflicts (paths and webhooks)
  const conflicts: Conflicts[] = [
    ...pathConflicts.map((it) => ({ type: 'path', ...it }) as const),
    ...webhookConflicts.map((it) => ({ type: 'webhook', ...it }) as const),
    ...componentConflicts.map((it) => ({ type: 'component', ...it }) as const),
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
      webhooks: withDefault(webhooks, undefined),
      tags: withDefault(tags, undefined),
      servers: withDefault(servers, undefined),
      components: withDefault(components, undefined),
    },
  }
}
