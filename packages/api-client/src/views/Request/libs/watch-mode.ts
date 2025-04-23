import type { WorkspaceStore } from '@/store'
import type { ActiveEntitiesStore } from '@/store/active-entities'
import {
  type Request,
  type RequestParameterPayload,
  type RequestPayload,
  type SecurityScheme,
  type Server,
  collectionSchema,
  createExampleFromRequest,
  requestSchema,
  securitySchemeSchema,
  serverSchema,
  tagSchema,
} from '@scalar/oas-utils/entities/spec'
import { isHttpMethod, schemaModel } from '@scalar/oas-utils/helpers'
import { type Path, type PathValue, getNestedValue } from '@scalar/object-utils/nested'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import microdiff, { type Difference } from 'microdiff'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

/**
 * Combine Rename Diffs
 * Rename diffs show up as a delete and an add.
 * This will go through the diff and combine any diff items which are next to each other which go from remove to add.
 *
 * - first we check if the payloads are the same then it was just a simple rename
 * - next we will add the rename and also handle any changes in the diff
 */
export const combineRenameDiffs = (diff: Difference[], pathPrefix: string[] = []): Difference[] => {
  const combined: Difference[] = []
  let skipNext = false

  for (let i = 0; i < diff.length; i++) {
    if (skipNext) {
      skipNext = false
      continue
    }

    const current = diff[i]
    const next = diff[i + 1]

    if (!current) {
      continue
    }

    // Prefix the paths when nested
    if (pathPrefix.length) {
      current.path = [...pathPrefix, ...current.path]
      if (next) {
        next.path = [...pathPrefix, ...next.path]
      }
    }
    // Only mutate paths
    else if (current.path[0] !== 'paths') {
      combined.push(current)
      continue
    }

    if (current.type === 'REMOVE' && next?.type === 'CREATE') {
      const [, currPath, currMethod] = current.path
      const [, nextPath, nextMethod] = next.path
      const nestedPrefix = ['paths', nextPath].filter((p) => typeof p === 'string')

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
      if (currMethod && typeof nextMethod === 'string' && currMethod !== nextMethod && nextPath) {
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
    // If adding anthing other than a path, method, or array we can just change instead
    else if (current.type === 'CREATE' && current.path.length > 3 && typeof current.path.at(-1) !== 'number') {
      combined.push({ ...current, type: 'CHANGE', oldValue: undefined })
    }
    // If deleting anthing other than a path, method, or array we can also do a change
    else if (current.type === 'REMOVE' && current.path.length > 3 && typeof current.path.at(-1) !== 'number') {
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
): T | null => {
  for (const uid of arr) {
    const resource = resources[uid]
    if (resource && condition(resource)) {
      return resource
    }
  }
  return null
}

/** Helper function to unwrap optional and default schemas */
const unwrapSchema = (schema: ZodSchema): ZodSchema => {
  if (schema instanceof z.ZodOptional) {
    return unwrapSchema(schema.unwrap())
  }
  if (schema instanceof z.ZodDefault) {
    return unwrapSchema(schema._def.innerType)
  }
  if (schema instanceof z.ZodEffects) {
    return unwrapSchema(schema._def.schema)
  }
  if (schema instanceof z.ZodCatch) {
    return unwrapSchema(schema._def.innerType)
  }
  return schema
}

/**
 * Traverses a zod schema based on the path and returns the schema at the end of the path
 * or null if the path doesn't exist. Handles optional unwrapping, records, and arrays
 */
export const traverseZodSchema = (schema: ZodSchema, path: (string | number)[]): ZodSchema | null => {
  let currentSchema: ZodSchema = schema

  for (const key of path) {
    // Unwrap optional and default schemas
    currentSchema = unwrapSchema(currentSchema)

    // If we encounter a ZodAny, return it for any nested path
    if (currentSchema instanceof z.ZodAny) {
      return currentSchema
    }

    // Traverse an object
    if (currentSchema instanceof z.ZodObject && typeof key === 'string' && key in currentSchema.shape) {
      currentSchema = currentSchema.shape[key]
    }
    // Traverse into an array
    else if (currentSchema instanceof z.ZodArray) {
      if (typeof key === 'number') {
        // If the key is a number, we're accessing an array element
        currentSchema = currentSchema.element
      } else if (typeof key === 'string') {
        // If the key is a string, we're accessing a property of the array elements
        currentSchema = currentSchema.element
        if (currentSchema instanceof z.ZodObject && key in currentSchema.shape) {
          currentSchema = currentSchema.shape[key]
        } else {
          return null
        }
      } else {
        return null
      }
    }
    // Traverse into a record
    else if (currentSchema instanceof z.ZodRecord) {
      currentSchema = currentSchema.valueSchema
    } else {
      // Path doesn't exist in the schema
      return null
    }

    // Unwrap again after traversing
    currentSchema = unwrapSchema(currentSchema)
  }

  return currentSchema
}

/**
 * Takes in diff, uses the path to get to the nested schema then parse the value
 * If there is a sub schema and it successfully parses, both the path and new value are valid and returned as such
 *
 * We return a tuple to make it easier to pass into the mutators
 */
export const parseDiff = <T>(
  schema: ZodSchema<T, ZodTypeDef, any>,
  diff: Difference,
): {
  /** Typed path as it has been checked agains the schema */
  path: Path<T>
  /** Path without the last item, used for getting the whole array instead of an item of the array */
  pathMinusOne: Path<T>
  /** Typed value which has been parsed against the schema */
  value: PathValue<T, Path<T>> | undefined
} | null => {
  const parsedSchema = traverseZodSchema(schema, diff.path)
  if (!parsedSchema) {
    return null
  }

  const path = diff.path.join('.') as Path<T>
  const pathMinusOne = diff.path.slice(0, -1).join('.') as Path<T>

  // If we are removing, value is undefined
  if (diff.type === 'REMOVE') {
    return {
      path,
      pathMinusOne,
      value: undefined,
    }
  }

  // Safe parse the value as well
  const parsedValue = schemaModel<T>(diff.value, parsedSchema, false)
  if (typeof parsedValue === 'undefined' || parsedValue === null) {
    return null
  }

  return {
    path,
    pathMinusOne,
    value: parsedValue as PathValue<T, Path<T>>,
  }
}

/**
 * Transforms the diff into a payload for the collection mutator then executes that mutation
 *
 * @returns true if it succeeds, and false for a failure
 */
export const mutateCollectionDiff = (
  diff: Difference,
  { activeCollection }: ActiveEntitiesStore,
  { collectionMutators }: WorkspaceStore,
): boolean => {
  if (!activeCollection.value) {
    return false
  }

  // We need to handle a special case for arrays, it only adds or removes the last element,
  // the rest are a series of changes
  if (typeof diff.path[diff.path.length - 1] === 'number' && (diff.type === 'CREATE' || diff.type === 'REMOVE')) {
    const parsed = parseDiff(collectionSchema, {
      ...diff,
      path: diff.path,
    })
    if (!parsed) {
      return false
    }

    const oldValue = [...getNestedValue(activeCollection.value, parsed.pathMinusOne)]
    if (diff.type === 'CREATE') {
      oldValue.push(parsed.value)
    } else if (diff.type === 'REMOVE') {
      oldValue.pop()
    }
    collectionMutators.edit(activeCollection.value.uid, parsed.pathMinusOne, oldValue)
  }
  // Non array + array change
  else {
    const parsed = parseDiff(collectionSchema, diff)
    if (!parsed) {
      return false
    }

    collectionMutators.edit(activeCollection.value.uid, parsed.path, parsed.value)
  }

  return true
}

/**
 * Currently we just generate new examples
 *
 * TODO: diff the changes in the examples and just update what we need to
 */
const updateRequestExamples = (requestUid: string, store: WorkspaceStore) => {
  const { requests, requestExamples, requestExampleMutators } = store
  const request = requests[requestUid]

  request?.examples.forEach((exampleUid) => {
    const newExample = createExampleFromRequest(request, requestExamples[exampleUid]?.name ?? 'Default')
    if (newExample) {
      requestExampleMutators.set({
        ...newExample,
        uid: exampleUid,
      })
    }
  })
}

/**
 * Generates an array of payloads for the request mutator from the request diff, also executes the mutation
 */
export const mutateRequestDiff = (
  diff: Difference,
  { activeCollection }: ActiveEntitiesStore,
  store: WorkspaceStore,
): boolean => {
  if (!activeCollection.value) {
    return false
  }
  const { requests, requestMutators } = store

  const [, path, method, ...keys] = diff.path as [
    'paths',
    Request['path'],
    Request['method'] | 'method' | undefined,
    ...string[],
  ]

  // Path has changed
  if (path === 'path' && diff.type === 'CHANGE') {
    activeCollection.value.requests.forEach((uid) => {
      if (requests[uid]?.path === diff.oldValue) {
        requestMutators.edit(uid, 'path', diff.value)
      }
    })
  }
  // Method has changed
  else if (method === 'method' && diff.type === 'CHANGE') {
    activeCollection.value.requests.forEach((uid) => {
      if (requests[uid]?.method === diff.oldValue && requests[uid]?.path === path) {
        requestMutators.edit(uid, 'method', diff.value)
      }
    })
  }
  // Adding or removing to the end of an array - special case
  else if (diff.type !== 'CHANGE' && typeof keys.at(-1) === 'number') {
    const request = findResource<Request>(
      activeCollection.value.requests,
      requests,
      (r) => r.path === path && r.method === method,
    )
    const parsed = parseDiff(requestSchema, {
      ...diff,
      path: diff.path.slice(3),
    })
    if (!request || !parsed) {
      return false
    }

    // Chop off the path, method and array index
    const oldValue = [...getNestedValue(request, parsed.pathMinusOne)]

    if (diff.type === 'CREATE') {
      oldValue.push(parsed.value)
    } else if (diff.type === 'REMOVE') {
      oldValue.pop()
    }

    requestMutators.edit(request.uid, parsed.pathMinusOne, oldValue)

    // Generate new examples
    if (diff.path[3] === 'parameters' || diff.path[3] === 'requestBody') {
      updateRequestExamples(request.uid, store)
    }
  }

  // Add
  else if (diff.type === 'CREATE') {
    // In some cases value goes { method: operation }
    const [firstEntry] = Object.entries(diff.value ?? {})
    const [_method, _operation] = firstEntry ?? []

    const operation: OpenAPIV3_1.OperationObject<{
      tags?: string[]
      security?: OpenAPIV3_1.SecurityRequirementObject[]
    }> = method ? diff.value : _operation
    const newMethod = method || _method

    // TODO: match servers up and add if we don't have
    const operationServers = serverSchema.array().parse(operation.servers ?? [])

    // Remove security here and add it correctly below
    const { security: operationSecurity, ...operationWithoutSecurity } = operation

    const requestPayload: RequestPayload = {
      ...operationWithoutSecurity,
      method: isHttpMethod(newMethod) ? newMethod : 'get',
      path,
      parameters: (operation.parameters ?? []) as RequestParameterPayload[],
      servers: operationServers.map((s) => s.uid),
    }

    // Add list of UIDs to associate security schemes
    // As per the spec if there is operation level security we ignore the top level requirements
    if (operationSecurity?.length) {
      requestPayload.security = operationSecurity.map((s) => {
        const _keys = Object.keys(s)

        // Handle the case of {} for optional
        if (_keys.length) {
          const [key] = Object.keys(s)
          if (!key) {
            return s
          }

          return {
            [key]: s[key],
          }
        }
        return s
      })
    }

    // Save parse the request
    const request = schemaModel(requestPayload, requestSchema, false)
    if (!request) {
      return false
    }

    requestMutators.add(request, activeCollection.value.uid)
  }
  // Delete
  else if (diff.type === 'REMOVE') {
    const request = findResource<Request>(
      activeCollection.value.requests,
      requests,
      (_request) => _request.path === path && _request.method === method,
    )
    if (!request) {
      return false
    }

    requestMutators.delete(request, activeCollection.value.uid)
  }
  // Edit
  else if (diff.type === 'CHANGE') {
    const request = findResource<Request>(
      activeCollection.value.requests,
      requests,
      (r) => r.path === path && r.method === method,
    )

    const parsed = parseDiff(requestSchema, { ...diff, path: keys })
    if (!request || !parsed) {
      return false
    }

    requestMutators.edit(request.uid, parsed.path, parsed.value)

    // Update the examples
    if (diff.path[3] === 'parameters' || diff.path[3] === 'requestBody') {
      updateRequestExamples(request.uid, store)
    }
  }

  return true
}

/** Generates a payload for the server mutator from the server diff including the mutator method */
export const mutateServerDiff = (
  diff: Difference,
  { activeCollection }: ActiveEntitiesStore,
  { servers, serverMutators }: WorkspaceStore,
): boolean => {
  if (!activeCollection.value) {
    return false
  }

  const [, index, ...keys] = diff.path as ['servers', number, keyof Server]

  // Edit: update properties
  if (keys?.length) {
    const serverUid = activeCollection.value.servers[index]
    if (!serverUid) {
      return false
    }

    const server = servers[serverUid]
    const parsed = parseDiff(serverSchema, { ...diff, path: keys })

    if (!server || !parsed) {
      return false
    }

    const removeVariables = diff.type === 'REMOVE' && keys[keys.length - 1] === 'variables'
    const value = removeVariables ? {} : parsed.value

    serverMutators.edit(serverUid, parsed.path, value)
  }
  // Delete whole object
  else if (diff.type === 'REMOVE') {
    if (!activeCollection.value.servers[index]) {
      return false
    }

    serverMutators.delete(activeCollection.value.servers[index], activeCollection.value.uid)
  }
  // Add whole object
  else if (diff.type === 'CREATE') {
    const parsed = schemaModel(diff.value, serverSchema, false)
    if (!parsed) {
      return false
    }

    serverMutators.add(parsed, activeCollection.value.uid)
  }
  return true
}

/** Generates a payload for the tag mutator from the tag diff */
export const mutateTagDiff = (
  diff: Difference,
  { activeCollection }: ActiveEntitiesStore,
  { tags, tagMutators }: WorkspaceStore,
): boolean => {
  if (!activeCollection.value) {
    return false
  }

  const [, index, ...keys] = diff.path as ['tags', number, ...string[]]

  if (keys?.length) {
    const tagUid = activeCollection.value.tags[index]
    if (!tagUid) {
      return false
    }

    const tag = tags[tagUid]
    const parsed = parseDiff(tagSchema, { ...diff, path: keys })

    if (!tag || !parsed) {
      return false
    }

    tagMutators.edit(tagUid, parsed.path, parsed.value)
  }
  // Delete whole object
  else if (diff.type === 'REMOVE') {
    const tagUid = activeCollection.value.tags[index]
    if (!tagUid) {
      return false
    }

    const tag = tags[tagUid]
    if (!tag) {
      return false
    }

    tagMutators.delete(tag, activeCollection.value.uid)
  }
  // Add whole object
  else if (diff.type === 'CREATE') {
    const parsed = schemaModel(diff.value, tagSchema, false)
    if (!parsed) {
      return false
    }

    tagMutators.add(parsed, activeCollection.value.uid)
  }

  return true
}

/** Narrows down a zod union schema */
export const narrowUnionSchema = (schema: ZodSchema, key: string, value: string): ZodSchema | null => {
  const _schema = unwrapSchema(schema)

  if (_schema instanceof z.ZodUnion || _schema instanceof z.ZodDiscriminatedUnion) {
    for (const option of _schema.options) {
      if (
        option instanceof z.ZodObject &&
        key in option.shape &&
        option.shape[key] instanceof z.ZodLiteral &&
        option.shape[key].value === value
      ) {
        return option
      }
    }
  }
  return null
}

/**
 * Generates a payload for the security scheme mutator from the security scheme diff, then executes that mutation
 *
 * Note: for edit we cannot use parseDiff here as it can't do unions, so we handle the unions first
 *
 * @returns true if it succeeds, and false for a failure
 */
export const mutateSecuritySchemeDiff = (
  diff: Difference,
  { activeCollection }: ActiveEntitiesStore,
  { securitySchemes, securitySchemeMutators }: WorkspaceStore,
): boolean => {
  if (!activeCollection.value) {
    return false
  }

  const [, , schemeName, ...keys] = diff.path as ['components', 'securitySchemes', string, ...string[]]

  const scheme =
    securitySchemes[schemeName] ??
    findResource<SecurityScheme>(
      activeCollection.value.securitySchemes,
      securitySchemes,
      (s) => s.nameKey === schemeName,
    )

  // Edit update properties
  if (keys?.length) {
    // Narrows the schema and path based on type of security scheme
    const schema = narrowUnionSchema(securitySchemeSchema, 'type', scheme?.type ?? '')
    if (!schema || !scheme) {
      return false
    }
    const parsed = parseDiff(schema, { ...diff, path: keys })
    if (!parsed) {
      return false
    }

    const path = parsed.path as Path<SecurityScheme>
    securitySchemeMutators.edit(scheme.uid, path, parsed.value)
  }
  // Delete whole object
  else if (diff.type === 'REMOVE') {
    if (!scheme) {
      return false
    }
    securitySchemeMutators.delete(scheme.uid)
  }
  // Add whole object
  else if (diff.type === 'CREATE') {
    securitySchemeMutators.add(securitySchemeSchema.parse(diff.value), activeCollection.value.uid)
  }

  return true
}
