import {
  type Collection,
  type Request,
  type Server,
  type Tag,
  serverSchema,
  tagSchema,
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
    }
    // If adding anthing other than a path or method we can just change instead
    else if (current.type === 'CREATE' && current.path.length > 3) {
      combined.push({ ...current, type: 'CHANGE', oldValue: undefined })
    }
    // If deleting anthing other than a path or method we can also do a change
    else if (current.type === 'REMOVE' && current.path.length > 3) {
      combined.push({ ...current, type: 'CHANGE', value: undefined })
    }
    // Just regular things
    else {
      combined.push(current)
    }
  }

  return combined
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
export const diffToInfoPayload = (diff: Difference, collection: Collection) => {
  if (diff.type === 'CHANGE' || diff.type === 'CREATE')
    return [collection.uid, diff.path.join('.'), diff.value] as const
  else if (diff.type === 'REMOVE')
    return [collection.uid, diff.path.join('.'), undefined] as const

  return null
}

/** Generates a payload for the server mutator from the server diff including the mutator method */
export const diffToServerPayload = (
  diff: Difference,
  collection: Collection,
  servers: Record<string, Server>,
) => {
  const [, index, ...keys] = diff.path as ['servers', number, keyof Server]

  // Edit: update properties
  if (keys?.length) {
    const serverUid = collection.servers[index]
    const server = servers[serverUid]

    if (!server) {
      console.warn('Live Sync: Server not found, update not applied')
      return null
    }

    let value: undefined | unknown = undefined
    if (diff.type === 'CHANGE' || diff.type === 'CREATE') {
      value = diff.value
    } else if (keys[keys.length - 1] === 'variables') {
      value = {}
    }

    return ['edit', serverUid, keys.join('.'), value] as const
  }
  // Delete whole object
  else if (diff.type === 'REMOVE') {
    const serverUid = collection.servers[index]
    if (serverUid) return ['delete', serverUid, collection.uid] as const
    else console.warn('Live Sync: Server not found, update not applied')
  }
  // Add whole object
  else if (diff.type === 'CREATE')
    return ['add', serverSchema.parse(diff.value), collection.uid] as const

  return null
}

/** Generates a payload for the tag mutator from the tag diff */
export const diffToTagPayload = (
  diff: Difference,
  tags: Record<string, Tag>,
  collection: Collection,
) => {
  const [, index, ...keys] = diff.path as ['tags', number, keyof Tag]

  if (keys?.length) {
    const tagUid = collection.tags[index]
    const tag = tags[tagUid]

    if (!tag) {
      console.warn('Live Sync: Tag not found, update not applied')
      return null
    }

    return [
      'edit',
      tagUid,
      keys.join('.'),
      'value' in diff ? diff.value : undefined,
    ] as const
  }
  // Delete whole object
  else if (diff.type === 'REMOVE') {
    const tagUid = collection.tags[index]
    const tag = tags[tagUid]
    if (tag) return ['delete', tag, collection.uid] as const
    else console.warn('Live Sync: Server not found, update not applied')
  }
  // Add whole object
  else if (diff.type === 'CREATE')
    return ['add', tagSchema.parse(diff.value), collection.uid] as const

  return null
}
