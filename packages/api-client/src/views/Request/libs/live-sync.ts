import { isHTTPMethod } from '@/components/HttpMethod/helpers'
import {
  type Collection,
  type Request,
  type RequestParameterPayload,
  type RequestPayload,
  type SecurityScheme,
  type Server,
  type Tag,
  requestSchema,
  securitySchemeSchema,
  serverSchema,
  tagSchema,
} from '@scalar/oas-utils/entities/spec'
import { schemaModel } from '@scalar/oas-utils/helpers'
import { getNestedValue } from '@scalar/object-utils/nested'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
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

/** Generates a payload for the collection mutator from the basic info/security diffs */
export const diffToCollectionPayload = (
  diff: Difference,
  collection: Collection,
) => {
  let path = diff.path.join('.')
  let value = diff.type === 'REMOVE' ? undefined : diff.value

  // We need to handle a special case for arrays, it only adds or removes the last element,
  // the rest are a series of changes
  if (
    typeof diff.path[diff.path.length - 1] === 'number' &&
    (diff.type === 'CREATE' || diff.type === 'REMOVE')
  ) {
    path = diff.path.slice(0, -1).join('.')
    value = [...getNestedValue(collection, path)]
    if (diff.type === 'CREATE') {
      value.push(diff.value)
    } else if (diff.type === 'REMOVE') {
      value.pop()
    }
  }

  return [collection.uid, path, value] as const
}

/** Generates an array of payloads for the request mutator from the request diff */
export const diffToRequestPayload = (
  diff: Difference,
  collection: Collection,
  requests: Record<string, Request>,
) => {
  const [, _path, method, ...keys] = diff.path as [
    'paths',
    Request['path'],
    Request['method'] | 'method' | undefined,
    ...string[],
  ]

  // Path has changed
  if (_path === 'path' && diff.type === 'CHANGE') {
    return collection.requests
      .filter((uid) => requests[uid].path === diff.oldValue)
      .map((uid) => ['edit', uid, 'path', diff.value] as const)
  }
  // Method has changed
  else if (method === 'method' && diff.type === 'CHANGE') {
    return collection.requests
      .filter((uid) => requests[uid].method === diff.oldValue)
      .map((uid) => ['edit', uid, 'method', diff.value] as const)
  }
  // Add
  else if (diff.type === 'CREATE') {
    // In some cases value goes { method: operation }
    const [[_method, _operation]] = Object.entries(diff.value)

    const operation: OpenAPIV3_1.OperationObject<{
      tags?: string[]
      security?: OpenAPIV3_1.SecurityRequirementObject[]
    }> = method ? diff.value : _operation
    const newMethod = method || _method

    // TODO: match servers up and add if we don't have
    const operationServers = serverSchema.array().parse(operation.servers ?? [])

    // Remove security here and add it correctly below
    const { security: operationSecurity, ...operationWithoutSecurity } =
      operation

    const requestPayload: RequestPayload = {
      ...operationWithoutSecurity,
      method: isHTTPMethod(newMethod) ? newMethod : 'get',
      path: _path,
      parameters: (operation.parameters ?? []) as RequestParameterPayload[],
      servers: operationServers.map((s) => s.uid),
    }

    // Add list of UIDs to associate security schemes
    // As per the spec if there is operation level security we ignore the top level requirements
    if (operationSecurity?.length)
      requestPayload.security = operationSecurity.map((s) => {
        const _keys = Object.keys(s)

        // Handle the case of {} for optional
        if (_keys.length) {
          const [key] = Object.keys(s)
          return {
            [key]: s[key],
          }
        } else return s
      })

    // Save parse the request
    const request = schemaModel(requestPayload, requestSchema, false)
    if (request) return [['add', request, collection.uid]] as const
    else
      console.warn(
        'Live Sync: was unable to add the new reqeust, please refresh to try again.',
      )
  }
  // Delete
  else if (diff.type === 'REMOVE') {
    const request = findResource<Request>(
      collection.requests,
      requests,
      (_request) => _request.path === _path && _request.method === method,
    )
    if (request) return [['delete', request, collection.uid]] as const
  }
  // Edit
  else if (diff.type === 'CHANGE') {
    const request = findResource<Request>(
      collection.requests,
      requests,
      (r) => r.path === _path && r.method === method,
    )

    if (request)
      return [['edit', request.uid, keys.join('.'), diff.value]] as const
    else console.warn('Live Sync: request not found, was unable to update')
  }
  return [] as const
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
  const [, index, ...keys] = diff.path as ['tags', number, ...string[]]

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

/** Generates a payload for the security scheme mutator from the security scheme diff */
export const diffToSecuritySchemePayload = (
  diff: Difference,
  collection: Collection,
  securitySchemes: Record<string, SecurityScheme>,
) => {
  const [, , schemeName, ...keys] = diff.path as [
    'components',
    'securitySchemes',
    string,
    ...string[],
  ]

  // Edit: update properties
  if (keys?.length) {
    const scheme = securitySchemes[schemeName]

    if (!scheme) {
      console.warn('Live Sync: security scheme not found, update not applied')
      return null
    }

    let value: undefined | unknown = undefined
    if (diff.type === 'CHANGE' || diff.type === 'CREATE') {
      value = diff.value
    }

    return ['edit', schemeName, keys.join('.'), value] as const
  }
  // Delete whole object
  else if (diff.type === 'REMOVE') {
    if (schemeName in securitySchemes) return ['delete', schemeName] as const
    else
      console.warn('Live Sync: security scheme not found, delete not applied')
  }
  // Add whole object
  else if (diff.type === 'CREATE')
    return [
      'add',
      securitySchemeSchema.parse(diff.value),
      collection.uid,
    ] as const

  return null
}
