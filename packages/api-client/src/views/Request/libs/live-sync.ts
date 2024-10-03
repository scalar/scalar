import type {
  Collection,
  Request,
  Server,
  Tag,
} from '@scalar/oas-utils/entities/spec'
import { getNestedValue } from '@scalar/object-utils/nested'
import microdiff, { type Difference } from 'microdiff'

/**
 * Combine Rename Diffs
 * Rename diffs show up as a delete and an add.
 * This will go through the diff and combine any diff items which are next to each other which go from remove to add.
 *
 * - first we check if the payloads are the same then it was just a simple rename
 * - next we will add the rename and also handle any changes in the diff
 */
export const combineRenameDiffs = (
  diff: Difference[],
  pathPrefix: string[] = [],
): Difference[] => {
  const combined: Difference[] = []
  let skipNext = false

  for (let i = 0; i < diff.length; i++) {
    if (skipNext) {
      skipNext = false
      continue
    }

    const current = diff[i]
    const next = diff[i + 1]

    // Prefix the paths when nested
    if (pathPrefix.length) {
      current.path.unshift(...pathPrefix)
      if (next) next.path.unshift(...pathPrefix)
    }
    // Only mutate paths
    else if (current.path[0] !== 'paths') {
      combined.push(current)
      continue
    }

    if (current.type === 'REMOVE' && next?.type === 'CREATE') {
      const [, currPath, currMethod] = current.path as string[]
      const [, nextPath, nextMethod] = next.path as string[]
      const nestedPrefix = ['paths', nextPath]

      // Handle path rename
      if (currPath !== nextPath) {
        combined.push({
          type: 'CHANGE',
          path: ['paths', 'path'],
          oldValue: currPath,
          value: nextPath,
        })
      }

      // Handle method rename
      if (currMethod && nextMethod && currMethod !== nextMethod) {
        combined.push({
          type: 'CHANGE',
          path: ['paths', nextPath, 'method'],
          oldValue: currMethod,
          value: nextMethod,
        })
        nestedPrefix.push(nextMethod)
      }

      // Only go one level deep
      if (pathPrefix.length === 0) {
        // Handle other changes within the renamed path or method
        const innerDiff = microdiff(current.oldValue, next.value)
        if (innerDiff.length) {
          const innerCombined = combineRenameDiffs(innerDiff, nestedPrefix)
          combined.push(...innerCombined)
        }
      }

      skipNext = true
    } else {
      combined.push(current)
    }
  }

  return combined
}

/** Build a payload for updating specific properties, only works with objects */
export const buildPayload = (
  diff: Difference,
  resource: Collection | Server,
) => {
  const path = [...diff.path]

  const key = path.pop()
  if (!key) return null

  // If we are indexing a resource, then we don't need the first couple path items
  const value =
    typeof path[1] === 'number'
      ? resource
      : getNestedValue(resource, path.join('.') as keyof typeof resource)

  // Destructure to remove the property from the object
  if (diff.type === 'REMOVE') {
    const { [key]: removeMe, ...rest } = value
    return rest
  }
  // Add or edit the property
  else {
    return { ...value, [key]: diff.value }
  }
}

/** Like array.find but returns the resource instead of the uid */
export const findResource = <T>(
  arr: string[],
  resources: Record<string, T>,
  condition: (resource: T) => boolean,
) => {
  for (let i = 0; i < arr.length; i++) {
    const r = resources[arr[i]]
    if (condition(r)) return r
  }
  return null
}

/** Generates a payload for the collection mutator from the info diff */
export const generateInfoPayload = (
  diff: Difference,
  collection: Collection,
) => {
  const payload = buildPayload(diff, collection)
  if (!payload) return null

  const prop = diff.path.slice(0, diff.path.length - 1).join('.')

  return [collection.uid, prop as keyof Collection, payload] as const
}
