import { isObject } from '@scalar/helpers/object/is-object'
import { isPollutionKey } from '@scalar/helpers/object/prevent-pollution'
import { bundle } from '@scalar/json-magic/bundle'
import { join as joinDocuments } from '@scalar/json-magic/join'
import type { Document as OpenApiDocumentV3_1 } from '@scalar/openapi-types/3.1'
import type { UnknownObject } from '@scalar/types/utils'

import { upgrade } from '@/utils/upgrade'

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
const prefixComponents = async (inputs: OpenApiDocumentV3_1[], prefixes: string[]): Promise<void> => {
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
                if (isPollutionKey(key)) {
                  delete node[key]
                  return
                }

                const newKey = `${prefix ?? ''}${key}`
                if (isPollutionKey(newKey)) {
                  delete node[key]
                  return
                }
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

const asOpenApiDocumentV3_1 = (document: UnknownObject): OpenApiDocumentV3_1 => {
  return document as OpenApiDocumentV3_1
}

/**
 * Joins multiple OpenAPI documents into a single document.
 *
 * - Merges the "info" object, paths, webhooks, tags, and servers from all input documents.
 * - If there are conflicting paths or webhooks (same path and method), returns a list of conflicts.
 * - Tags (by name) and servers (by URL) retain the last input occurrence.
 * - Metadata uses the first input document when fields overlap.
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
 * const result = await join([doc1, doc2])
 * // result.ok === true
 * // result.document.info.title === "API 1"
 * // result.document.info.description === "Second API"
 * // result.document.paths has both "/foo" and "/bar"
 * // result.document.tags contains both "foo" and "bar"
 * // result.document.servers contains both server URLs
 */
export const join = async (inputs: UnknownObject[], config?: { prefixComponents: string[] }): Promise<JoinResult> => {
  // Keep OpenAPI version normalization separate from the format-independent join.
  const upgraded = inputs.map((it) => upgrade(it).specification)

  // Preprocess documents by prefixing components if specified
  if (config?.prefixComponents) {
    await prefixComponents(upgraded, config.prefixComponents)
  }

  // Reverse the upgraded documents to ensure the first document has the highest precedence
  upgraded.reverse()

  const documents = upgraded.map((document) => ({
    ...document,
    info: isObject(document.info) ? document.info : {},
    paths: document.paths ?? {},
    webhooks: document.webhooks ?? {},
    components: document.components ?? {},
    tags: document.tags ?? [],
    servers: document.servers ?? [],
  }))

  const result = joinDocuments(documents, {
    strategy: ({ path, current }) => {
      const [field] = path
      if (field === 'info') {
        return 'merge'
      }
      if (field === 'tags') {
        return { uniqueBy: 'name' }
      }
      if (field === 'servers') {
        return { uniqueBy: 'url' }
      }
      if (field === 'paths' || field === 'webhooks' || field === 'components') {
        if (path.length < 3) {
          return 'merge'
        }
        // Preserve the existing handling of falsy component definitions.
        return field === 'components' && !current ? 'replace' : 'conflict'
      }
      return 'replace'
    },
  })

  if (result.ok === false) {
    const conflicts: Conflicts[] = []
    // Keep the public conflict shape and category order stable.
    for (const field of ['paths', 'webhooks', 'components']) {
      for (const { path } of result.conflicts) {
        if (path[0] !== field) {
          continue
        }
        if (field === 'components') {
          conflicts.push({ type: 'component', componentType: path[1], name: path[2] })
        } else {
          conflicts.push({ type: field === 'paths' ? 'path' : 'webhook', path: path[1], method: path[2] })
        }
      }
    }
    return { ok: false, conflicts }
  }

  return {
    ok: true,
    document: asOpenApiDocumentV3_1({
      ...result.document,
      info: result.document.info ?? {},
      paths: result.document.paths ?? {},
      webhooks: withDefault(result.document.webhooks, undefined),
      tags: withDefault(result.document.tags, undefined),
      servers: withDefault(result.document.servers, undefined),
      components: withDefault(result.document.components, undefined),
    }),
  }
}
