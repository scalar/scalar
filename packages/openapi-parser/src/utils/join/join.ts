import type { UnknownObject } from '@/types'
import { upgrade } from '@/utils/upgrade'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Deep merges two objects, combining their properties recursively.
 *
 * ⚠️ Note: This operation assumes there are no key collisions between the objects.
 * Use isKeyCollisions() to check for collisions before merging.
 *
 * @param a - Target object to merge into
 * @param b - Source object to merge from
 * @returns The merged object (mutates and returns a)
 *
 * @example
 * // Simple merge
 * const a = { name: 'John' }
 * const b = { age: 30 }
 * mergeObjects(a, b) // { name: 'John', age: 30 }
 *
 * // Nested merge
 * const a = { user: { name: 'John' } }
 * const b = { user: { age: 30 } }
 * mergeObjects(a, b) // { user: { name: 'John', age: 30 } }
 */
export const mergeObjects = <R>(a: Record<string, unknown>, b: Record<string, unknown>): R => {
  for (const key in b) {
    if (!(key in a)) {
      a[key] = b[key]
    } else {
      const aValue = a[key]
      const bValue = b[key]

      if (typeof aValue === 'object' && aValue !== null && typeof bValue === 'object' && bValue !== null) {
        a[key] = mergeObjects(aValue as Record<string, unknown>, bValue as Record<string, unknown>)
      } else {
        a[key] = bValue // Overwrite with b's value if not an object
      }
    }
  }

  return a as R
}

const getSetIntersection = <T>(a: Set<T>, b: Set<T>) => {
  const result: T[] = []
  for (const value of a) {
    if (b.has(value)) {
      result.push(value)
    }
  }
  return result
}

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

      const intersectingKeys = getSetIntersection(new Set(Object.keys(result[path])), new Set(Object.keys(pathItem)))

      // If the path exists, merge the operations (get, post, etc.)
      result[path] = { ...result[path], ...pathItem }
      intersectingKeys.forEach((key) => conflicts.push({ method: key, path }))
    }
  }

  return { paths: result, conflicts }
}

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

type Conflicts = { type: 'path'; path: string; method: string } | { type: 'webhook'; path: string; method: string }
type JoinResult = { ok: true; document: OpenAPIV3_1.Document } | { ok: false; conflicts: Conflicts[] }

export const join = (inputs: UnknownObject[], _?: {}): JoinResult => {
  // Reverse the input list and upgrade them
  const upgraded = inputs.reverse().map((it) => upgrade(it).specification)

  // Merge only the "info" object from all inputs
  const info = upgraded.reduce<OpenAPIV3_1.InfoObject>((acc, curr) => {
    if (curr.info && typeof curr.info === 'object') {
      return mergeObjects(acc, curr.info)
    }
    return acc
  }, {} as OpenAPIV3_1.InfoObject)

  // Merge paths
  const { paths, conflicts: pathConflicts } = mergePaths(upgraded.map((it) => it.paths ?? {}))

  // Merge webhooks
  const { paths: webhooks, conflicts: webhookConflicts } = mergePaths(upgraded.map((it) => it.webhooks ?? {}))

  // Merge tags
  const tags = mergeTags(upgraded.map((it) => it.tags ?? []))

  // Merge all documents in the upgraded array into a single object
  const result = upgraded.reduce<UnknownObject>((acc, curr) => ({ ...acc, ...curr }), {})

  const conflicts: Conflicts[] = [
    ...pathConflicts.map((it) => ({ type: 'path', path: it.path, method: it.method }) as const),
    ...webhookConflicts.map((it) => ({ type: 'webhook', path: it.path, method: it.method }) as const),
  ]

  if (conflicts.length) {
    return {
      ok: false,
      conflicts,
    }
  }

  return {
    ok: true,
    document: {
      ...result,
      info,
      paths,
      webhooks,
      tags,
    },
  }
}
