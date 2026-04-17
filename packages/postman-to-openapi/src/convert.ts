import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { processAuth } from '@/helpers/auth'
import { processContact } from '@/helpers/contact'
import { processExternalDocs } from '@/helpers/external-docs'
import { processLicense } from '@/helpers/license'
import { processLogo } from '@/helpers/logo'
import { DEFAULT_EXAMPLE_NAME, OPERATION_KEYS, mergePathItem } from '@/helpers/merge-path-item'
import {
  POSTMAN_EXAMPLE_NAME_EXTENSION,
  POSTMAN_FOLDER_SEGMENTS_EXTENSION,
  POSTMAN_POST_RESPONSE_SCRIPTS_EXTENSION,
  POSTMAN_PRE_REQUEST_SCRIPTS_EXTENSION,
  processItem,
} from '@/helpers/path-items'
import { pruneDocument } from '@/helpers/prune-document'
import { analyzeServerDistribution } from '@/helpers/servers'
import { getPathStructuralSignature, normalizePath } from '@/helpers/urls'

import type { Description, Item, ItemGroup, PostmanCollection } from './types'

/**
 * Indices from the collection root into nested `item` arrays.
 * Example: `[0, 2, 1]` → `collection.item[0].item[2].item[1]`.
 */
export type PostmanRequestIndexPath = readonly number[]

const normalizeDescription = (description?: Description): string | undefined => {
  if (typeof description === 'string') {
    return description
  }

  return description?.content
}

const parseCollectionInput = (postmanCollection: PostmanCollection | string): unknown => {
  if (typeof postmanCollection !== 'string') {
    return postmanCollection
  }

  try {
    return JSON.parse(postmanCollection) as PostmanCollection
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown parse error'
    const parseError = new Error(`Invalid Postman collection JSON: ${details}`)
    parseError.name = 'PostmanCollectionParseError'
    throw parseError
  }
}

const validateCollectionShape = (collection: unknown): PostmanCollection => {
  if (!collection || typeof collection !== 'object') {
    throw new Error('Invalid Postman collection: expected an object')
  }

  const candidate = collection as Partial<PostmanCollection>

  if (!candidate.info) {
    throw new Error('Missing required info on Postman collection')
  }

  if (!candidate.item || !Array.isArray(candidate.item)) {
    throw new Error('Invalid Postman collection: item must be an array')
  }

  if (typeof candidate.info !== 'object') {
    throw new Error('Invalid Postman collection: info must be an object')
  }

  if (!candidate.info.name) {
    throw new Error('Missing required info.name on Postman collection')
  }

  if (!candidate.info.schema) {
    throw new Error('Invalid Postman collection: missing info.schema')
  }

  if (candidate.variable && !Array.isArray(candidate.variable)) {
    throw new Error('Invalid Postman collection: variable must be an array when provided')
  }

  return candidate as PostmanCollection
}

const isItemGroup = (item: Item | ItemGroup): item is ItemGroup => 'item' in item && Array.isArray(item.item)

export type TagNamingStrategy = 'leaf' | 'chain'

type TagContext = {
  segments: string[]
  description?: string
}

type TagMetadata = {
  tags: OpenAPIV3_1.TagObject[]
  resolveTagName: (segments: string[]) => string | undefined
}

const TAG_CHAIN_SEPARATOR = ' > '
const TAG_DUPLICATE_SEPARATOR = ' / '

const getTagContextKey = (segments: string[]): string => JSON.stringify(segments)

const getChainTagName = (segments: string[]): string => segments.join(TAG_CHAIN_SEPARATOR)

const isPathParameterSegment = (segment: string): boolean =>
  (segment.startsWith('{') && segment.endsWith('}')) || segment.startsWith(':')

const normalizeLeafTagSegment = (segment: string): string => {
  const trimmed = segment.trim()
  if (!trimmed) {
    return trimmed
  }

  // Postman folders are sometimes literal URL templates (`/languages/{languageCode}`).
  // Keep tag names short by turning those into a readable leaf identifier.
  const looksLikePathTemplate = trimmed.startsWith('/') || (trimmed.includes('/') && !trimmed.includes(' '))
  if (!looksLikePathTemplate) {
    return trimmed
  }

  const segments = trimmed
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
  if (segments.length === 0) {
    return trimmed
  }

  const preferredSegment = [...segments].reverse().find((part) => !isPathParameterSegment(part))
  const fallbackSegment = preferredSegment ?? segments[segments.length - 1] ?? trimmed
  if (fallbackSegment.startsWith('{') && fallbackSegment.endsWith('}')) {
    return fallbackSegment.slice(1, -1)
  }
  if (fallbackSegment.startsWith(':')) {
    return fallbackSegment.slice(1)
  }
  return fallbackSegment
}

const getLeafTagName = (segments: string[]): string => normalizeLeafTagSegment(segments[segments.length - 1] ?? '')

const getLeafDuplicateFallback = (segments: string[], leafTagName: string): string => {
  const parentSegment = segments[segments.length - 2]
  if (!parentSegment) {
    return getChainTagName(segments)
  }

  const normalizedParent = normalizeLeafTagSegment(parentSegment)
  if (!normalizedParent) {
    return getChainTagName(segments)
  }

  return `${normalizedParent}${TAG_DUPLICATE_SEPARATOR}${leafTagName}`
}

const buildLeafTagContextDescription = (segments: string[]): string | undefined => {
  if (segments.length <= 1) {
    return undefined
  }

  return `Part of ${segments.slice(0, -1).join(' -> ')}`
}

const mergeTagDescriptions = (description?: string, contextDescription?: string): string | undefined => {
  if (description && contextDescription) {
    return `${description}\n\n${contextDescription}`
  }

  return description ?? contextDescription
}

const dedupeTagContexts = (contexts: TagContext[]): TagContext[] => {
  const contextMap = new Map<string, TagContext>()

  contexts.forEach((context) => {
    const key = getTagContextKey(context.segments)
    const existing = contextMap.get(key)
    if (!existing) {
      contextMap.set(key, context)
      return
    }

    if (!existing.description && context.description) {
      contextMap.set(key, context)
    }
  })

  return [...contextMap.values()]
}

const resolveTagNameMap = (contexts: TagContext[], strategy: TagNamingStrategy): Map<string, string> => {
  const nameMap = new Map<string, string>()

  contexts.forEach((context) => {
    const key = getTagContextKey(context.segments)
    const initialName = strategy === 'chain' ? getChainTagName(context.segments) : getLeafTagName(context.segments)
    nameMap.set(key, initialName || getChainTagName(context.segments))
  })

  if (strategy === 'chain') {
    return nameMap
  }

  const initialCounts = new Map<string, number>()
  nameMap.forEach((name) => {
    initialCounts.set(name, (initialCounts.get(name) ?? 0) + 1)
  })

  contexts.forEach((context) => {
    const key = getTagContextKey(context.segments)
    const currentName = nameMap.get(key)
    if (!currentName) {
      return
    }

    if ((initialCounts.get(currentName) ?? 0) > 1) {
      nameMap.set(key, getLeafDuplicateFallback(context.segments, currentName))
    }
  })

  const fallbackCounts = new Map<string, number>()
  nameMap.forEach((name) => {
    fallbackCounts.set(name, (fallbackCounts.get(name) ?? 0) + 1)
  })

  contexts.forEach((context) => {
    const key = getTagContextKey(context.segments)
    const currentName = nameMap.get(key)
    if (!currentName) {
      return
    }

    if ((fallbackCounts.get(currentName) ?? 0) > 1) {
      nameMap.set(key, getChainTagName(context.segments))
    }
  })

  return nameMap
}

const buildTagMetadata = (contexts: TagContext[], strategy: TagNamingStrategy): TagMetadata => {
  const uniqueContexts = dedupeTagContexts(contexts)
  const resolvedNameMap = resolveTagNameMap(uniqueContexts, strategy)
  const tags: OpenAPIV3_1.TagObject[] = []
  const seenNames = new Set<string>()

  uniqueContexts.forEach((context) => {
    const key = getTagContextKey(context.segments)
    const name = resolvedNameMap.get(key)
    if (!name || seenNames.has(name)) {
      return
    }

    seenNames.add(name)
    const contextDescription = strategy === 'leaf' ? buildLeafTagContextDescription(context.segments) : undefined
    const description = mergeTagDescriptions(context.description, contextDescription)
    tags.push({
      name,
      ...(description && { description }),
    })
  })

  const resolveTagName = (segments: string[]): string | undefined => {
    if (segments.length === 0) {
      return undefined
    }

    const fromMap = resolvedNameMap.get(getTagContextKey(segments))
    if (fromMap) {
      return fromMap
    }

    if (strategy === 'chain') {
      return getChainTagName(segments)
    }

    return getLeafTagName(segments) || getChainTagName(segments)
  }

  return { tags, resolveTagName }
}

const collectTagContexts = (items: PostmanCollection['item'], parentSegments: string[] = []): TagContext[] =>
  items.flatMap((item): TagContext[] => {
    if (!isItemGroup(item)) {
      return []
    }

    const nextSegments = item.name ? [...parentSegments, item.name] : parentSegments
    const currentContext: TagContext[] = item.name?.length
      ? [
          {
            segments: nextSegments,
            description: normalizeDescription(item.description),
          },
        ]
      : []

    return [...currentContext, ...collectTagContexts(item.item, nextSegments)]
  })

const extractTags = (items: PostmanCollection['item'], strategy: TagNamingStrategy): TagMetadata =>
  buildTagMetadata(collectTagContexts(items), strategy)

/**
 * Folder tags for ancestors of each selected path only (same shape as full extraction).
 */
const extractTagContextsForSelectedPaths = (
  items: PostmanCollection['item'],
  paths: readonly PostmanRequestIndexPath[],
): TagContext[] => {
  const seen = new Set<string>()
  const result: TagContext[] = []

  for (const path of paths) {
    if (path.length === 0) {
      continue
    }

    let list = items
    const segments: string[] = []

    for (let i = 0; i < path.length - 1; i++) {
      const idx = path[i]
      if (idx === undefined || idx < 0 || idx >= list.length) {
        break
      }

      const node = list[idx]
      if (node === undefined || !isItemGroup(node)) {
        break
      }

      if (node.name?.length) {
        segments.push(node.name)
        const key = getTagContextKey(segments)
        if (!seen.has(key)) {
          seen.add(key)
          result.push({
            segments: [...segments],
            description: normalizeDescription(node.description),
          })
        }
      }

      list = node.item
    }
  }

  return result
}

const extractTagsForSelectedPaths = (
  items: PostmanCollection['item'],
  paths: readonly PostmanRequestIndexPath[],
  strategy: TagNamingStrategy,
): TagMetadata => buildTagMetadata(extractTagContextsForSelectedPaths(items, paths), strategy)

const getNodeAtPath = (
  items: PostmanCollection['item'],
  path: PostmanRequestIndexPath,
): Item | ItemGroup | undefined => {
  if (path.length === 0) {
    return undefined
  }

  let list = items
  let node: Item | ItemGroup | undefined

  for (let i = 0; i < path.length; i++) {
    const idx = path[i]
    if (idx === undefined || idx < 0 || idx >= list.length) {
      return undefined
    }

    node = list[idx]
    if (node === undefined) {
      return undefined
    }

    if (i < path.length - 1) {
      if (!isItemGroup(node)) {
        return undefined
      }
      list = node.item
    }
  }

  return node
}

const collectParentTagSegments = (items: PostmanCollection['item'], path: PostmanRequestIndexPath): string[] => {
  const segments: string[] = []
  if (path.length <= 1) {
    return segments
  }

  let list = items
  for (let i = 0; i < path.length - 1; i++) {
    const idx = path[i]
    if (idx === undefined || idx < 0 || idx >= list.length) {
      return []
    }

    const node = list[idx]
    if (node === undefined || !isItemGroup(node)) {
      return []
    }

    if (node.name) {
      segments.push(node.name)
    }

    list = node.item
  }

  return segments
}

const dedupeIndexPaths = (paths: readonly PostmanRequestIndexPath[]): PostmanRequestIndexPath[] => {
  const map = new Map<string, PostmanRequestIndexPath>()
  for (const path of paths) {
    map.set(JSON.stringify([...path]), path)
  }
  return [...map.values()]
}

const mergeSecuritySchemes = (
  openapi: OpenAPIV3_1.Document,
  securitySchemes?: OpenAPIV3_1.ComponentsObject['securitySchemes'],
): void => {
  if (!securitySchemes || Object.keys(securitySchemes).length === 0) {
    return
  }

  openapi.components = openapi.components || {}
  openapi.components.securitySchemes = {
    ...(openapi.components.securitySchemes ?? {}),
    ...securitySchemes,
  }
}

const mergeServerLists = (
  existing: OpenAPIV3_1.ServerObject[] | undefined,
  incoming: OpenAPIV3_1.ServerObject[],
): OpenAPIV3_1.ServerObject[] => {
  const seen = new Set((existing ?? []).map((s) => s.url))
  const out = [...(existing ?? [])]
  for (const server of incoming) {
    if (!seen.has(server.url)) {
      seen.add(server.url)
      out.push(server)
    }
  }
  return out
}

const mergeTagsIntoDocument = (openapi: OpenAPIV3_1.Document, incoming: OpenAPIV3_1.TagObject[]): void => {
  if (incoming.length === 0) {
    return
  }

  const existing = openapi.tags ?? []
  if (existing.length === 0) {
    openapi.tags = incoming
    return
  }

  const names = new Set(existing.map((t: OpenAPIV3_1.TagObject) => t.name))
  const additions = incoming.filter((t: OpenAPIV3_1.TagObject) => t.name && !names.has(t.name))
  openapi.tags = additions.length > 0 ? [...existing, ...additions] : existing
}

const assignTagsFromPostman = (
  openapi: OpenAPIV3_1.Document,
  tags: OpenAPIV3_1.TagObject[],
  isMergingIntoBase: boolean,
): void => {
  if (tags.length === 0) {
    return
  }
  if (isMergingIntoBase) {
    mergeTagsIntoDocument(openapi, tags)
  } else {
    openapi.tags = tags
  }
}

const cleanupOperations = (paths: OpenAPIV3_1.PathsObject): void => {
  Object.values(paths).forEach((pathItem) => {
    if (!pathItem) {
      return
    }

    OPERATION_KEYS.forEach((operationKey) => {
      const operation = pathItem[operationKey]
      if (!operation) {
        return
      }

      if ('parameters' in operation && operation.parameters?.length === 0) {
        delete operation.parameters
      }

      if ('requestBody' in operation && operation.requestBody && 'content' in operation.requestBody) {
        const content = operation.requestBody.content
        if (content && 'text/plain' in content) {
          const text = content['text/plain']
          if (!text?.schema || (text.schema && Object.keys(text.schema).length === 0)) {
            content['text/plain'] = {}
          }
        }
      }

      if (!operation.description) {
        delete operation.description
      }

      // Internal merge bookkeeping should not leak in final OpenAPI output.
      delete operation[POSTMAN_EXAMPLE_NAME_EXTENSION]
      delete operation[POSTMAN_PRE_REQUEST_SCRIPTS_EXTENSION]
      delete operation[POSTMAN_POST_RESPONSE_SCRIPTS_EXTENSION]
      delete operation[POSTMAN_FOLDER_SEGMENTS_EXTENSION]
    })
  })
}

const getOrderedPathParameterNames = (path: string): string[] =>
  normalizePath(path)
    .split('/')
    .flatMap((segment) => {
      const match = segment.match(/^\{([^{}]+)\}$/)
      return match?.[1] ? [match[1]] : []
    })

const rewritePathParameterNames = (path: string, parameterNames: string[]): string => {
  const segments = normalizePath(path).split('/')
  let parameterIndex = 0

  const rewrittenSegments = segments.map((segment) => {
    if (!/^\{[^{}]+\}$/.test(segment)) {
      return segment
    }

    const canonicalName = parameterNames[parameterIndex]
    parameterIndex += 1

    return canonicalName ? `{${canonicalName}}` : segment
  })

  return rewrittenSegments.join('/')
}

const chooseMostCommonName = (names: string[]): string | undefined => {
  if (names.length === 0) {
    return undefined
  }

  const counts = new Map<string, number>()
  const firstIndex = new Map<string, number>()

  names.forEach((name, index) => {
    counts.set(name, (counts.get(name) ?? 0) + 1)
    if (!firstIndex.has(name)) {
      firstIndex.set(name, index)
    }
  })

  return [...counts.entries()].sort((a, b) => {
    if (a[1] !== b[1]) {
      return b[1] - a[1]
    }

    return (firstIndex.get(a[0]) ?? Number.POSITIVE_INFINITY) - (firstIndex.get(b[0]) ?? Number.POSITIVE_INFINITY)
  })[0]?.[0]
}

const renameParameters = (
  parameters: OpenAPIV3_1.ParameterObject[] | OpenAPIV3_1.ReferenceObject[] | undefined,
  renameMap: Map<string, string>,
): OpenAPIV3_1.PathItemObject['parameters'] => {
  if (!parameters || renameMap.size === 0) {
    return parameters
  }

  const mergedParameters = new Map<string, OpenAPIV3_1.ParameterObject | OpenAPIV3_1.ReferenceObject>()

  parameters.forEach((parameter, index) => {
    if (!parameter || '$ref' in parameter) {
      mergedParameters.set(`$ref/${index}`, parameter)
      return
    }

    const nextName = parameter.in === 'path' ? (renameMap.get(parameter.name) ?? parameter.name) : parameter.name
    const renamedParameter: OpenAPIV3_1.ParameterObject =
      nextName === parameter.name ? parameter : { ...parameter, name: nextName }
    const parameterKey = `${renamedParameter.name}/${renamedParameter.in}`
    const existingParameter = mergedParameters.get(parameterKey)

    if (!existingParameter || '$ref' in existingParameter || '$ref' in renamedParameter) {
      mergedParameters.set(parameterKey, renamedParameter)
      return
    }

    mergedParameters.set(parameterKey, {
      ...existingParameter,
      ...renamedParameter,
      examples: {
        ...(existingParameter.examples ?? {}),
        ...(renamedParameter.examples ?? {}),
      },
    })
  })

  return [...mergedParameters.values()] as OpenAPIV3_1.PathItemObject['parameters']
}

const renamePathParametersForOperation = (
  operation: OpenAPIV3_1.OperationObject,
  renameMap: Map<string, string>,
): OpenAPIV3_1.OperationObject => {
  if (!operation.parameters || renameMap.size === 0) {
    return operation
  }

  return {
    ...operation,
    parameters: renameParameters(operation.parameters, renameMap) as OpenAPIV3_1.OperationObject['parameters'],
  }
}

const renamePathItemParameterNames = (
  pathItem: OpenAPIV3_1.PathItemObject,
  sourceNames: string[],
  targetNames: string[],
): OpenAPIV3_1.PathItemObject => {
  const renameMap = new Map<string, string>()

  sourceNames.forEach((sourceName, index) => {
    const targetName = targetNames[index]
    if (sourceName && targetName && sourceName !== targetName) {
      renameMap.set(sourceName, targetName)
    }
  })

  if (renameMap.size === 0) {
    return pathItem
  }

  const renamedPathItem: OpenAPIV3_1.PathItemObject = {
    ...pathItem,
    parameters: renameParameters(pathItem.parameters, renameMap),
  }

  OPERATION_KEYS.forEach((operationKey) => {
    const operation = pathItem[operationKey]
    if (!operation) {
      return
    }

    renamedPathItem[operationKey] = renamePathParametersForOperation(operation, renameMap)
  })

  return renamedPathItem
}

const findFolderTemplateHint = (
  pathItemGroup: { pathItem: OpenAPIV3_1.PathItemObject; parameterNames: string[] }[],
  signature: string,
): string[] | undefined => {
  for (const { pathItem, parameterNames } of pathItemGroup) {
    for (const operationKey of OPERATION_KEYS) {
      const operation = pathItem[operationKey]
      if (!operation) {
        continue
      }

      // Use the raw Postman folder chain if available; otherwise fall back to
      // splitting tag strings (supports the legacy chain tag naming strategy).
      const rawSegments = operation[POSTMAN_FOLDER_SEGMENTS_EXTENSION] as string[] | undefined
      const folderNameCandidates: string[] = rawSegments ? [...rawSegments] : []
      for (const tag of operation.tags ?? []) {
        folderNameCandidates.push(...tag.split(' > ').map((segment: string) => segment.trim()))
      }

      for (const folderName of folderNameCandidates) {
        if (!folderName.startsWith('/')) {
          continue
        }

        const normalizedFolderName = normalizePath(folderName)
        if (getPathStructuralSignature(normalizedFolderName) !== signature) {
          continue
        }

        const folderParameterNames = getOrderedPathParameterNames(normalizedFolderName)
        if (folderParameterNames.length === parameterNames.length) {
          return folderParameterNames
        }
      }
    }
  }

  return undefined
}

type PathUnificationResult = {
  paths: OpenAPIV3_1.PathsObject
  canonicalPathByPath: Map<string, string>
}

const unifyEquivalentPathParameters = (paths: OpenAPIV3_1.PathsObject): PathUnificationResult => {
  const pathEntries = Object.entries(paths).filter((entry): entry is [string, OpenAPIV3_1.PathItemObject] =>
    Boolean(entry[1]),
  )
  const groups = new Map<
    string,
    Array<{ pathKey: string; pathItem: OpenAPIV3_1.PathItemObject; parameterNames: string[] }>
  >()

  pathEntries.forEach(([pathKey, pathItem]) => {
    const signature = getPathStructuralSignature(pathKey)
    if (!groups.has(signature)) {
      groups.set(signature, [])
    }

    groups.get(signature)?.push({
      pathKey,
      pathItem,
      parameterNames: getOrderedPathParameterNames(pathKey),
    })
  })

  const unifiedPaths: OpenAPIV3_1.PathsObject = {}
  const canonicalPathByPath = new Map<string, string>()
  const processedPathKeys = new Set<string>()

  pathEntries.forEach(([pathKey]) => {
    if (processedPathKeys.has(pathKey)) {
      return
    }

    const signature = getPathStructuralSignature(pathKey)
    const group = groups.get(signature) ?? []

    if (group.length < 2) {
      const pathItem = paths[pathKey]
      if (pathItem) {
        unifiedPaths[pathKey] = pathItem
        canonicalPathByPath.set(pathKey, pathKey)
      }
      processedPathKeys.add(pathKey)
      return
    }

    const firstGroupEntry = group[0]
    if (!firstGroupEntry || firstGroupEntry.pathKey !== pathKey) {
      return
    }

    const parameterCount = firstGroupEntry.parameterNames.length
    const folderTemplateHint = findFolderTemplateHint(group, signature)
    const canonicalParameterNames =
      folderTemplateHint ??
      Array.from({ length: parameterCount }, (_, parameterIndex) => {
        const namesInOrder = group
          .map((entry) => entry.parameterNames[parameterIndex])
          .filter((name): name is string => Boolean(name))

        return chooseMostCommonName(namesInOrder) ?? namesInOrder[0] ?? ''
      })

    const canonicalPath = rewritePathParameterNames(firstGroupEntry.pathKey, canonicalParameterNames)
    group.forEach(({ pathKey: groupedPathKey, pathItem, parameterNames }) => {
      const normalizedPathItem = renamePathItemParameterNames(pathItem, parameterNames, canonicalParameterNames)
      mergePathItem(unifiedPaths, canonicalPath, normalizedPathItem, true)
      canonicalPathByPath.set(groupedPathKey, canonicalPath)
      processedPathKeys.add(groupedPathKey)
    })
  })

  return { paths: unifiedPaths, canonicalPathByPath }
}

export type ConvertOptions = {
  /**
   * Whether to merge operations with the same path and method.
   * If true, the operations will be merged into a single operation.
   * If false, the operations will be kept as separate operations.
   * Default is true.
   */
  mergeOperation?: boolean
  /**
   * When set, only items at these paths are converted. Each path is a list of
   * zero-based indices from `collection.item` through nested `item` arrays.
   * The last index may point to a request or a folder; folders include every
   * descendant request. Paths out of range or through non-folders are skipped.
   * When omitted, the whole collection is converted (existing behavior).
   */
  requestIndexPaths?: readonly PostmanRequestIndexPath[]
  /**
   * Strategy for generating OpenAPI tag names from nested Postman folders.
   * - `leaf` (default): use the folder name only; duplicate leaves fallback to `parent / leaf`.
   * - `chain`: keep the legacy full folder chain joined by ` > `.
   */
  tagNamingStrategy?: TagNamingStrategy
  /**
   * Existing OpenAPI document to merge into. The input is is updated with Postman paths,
   * tags (union by name), security schemes, and servers.
   * Root `info` and existing paths are preserved unless Postman adds or merges operations.
   */
  document?: OpenAPIV3_1.Document
}

/**
 * Converts a Postman Collection to an OpenAPI 3.1.0 document.
 * This function processes the collection's information, servers, authentication,
 * and items to create a corresponding OpenAPI structure.
 */
export function convert(
  postmanCollection: PostmanCollection | string,
  options: ConvertOptions = { mergeOperation: false },
): OpenAPIV3_1.Document {
  const { requestIndexPaths, mergeOperation = false, tagNamingStrategy = 'leaf', document: baseDocument } = options
  const isMergingIntoBase = baseDocument !== undefined
  const collection = validateCollectionShape(parseCollectionInput(postmanCollection))

  // Extract title from collection info, fallback to 'API' if not provided
  const title = collection.info.name || 'API'

  // Look for version in collection variables, default to '1.0.0'
  const version = (collection.variable?.find((v) => v.key === 'version')?.value as string) || '1.0.0'

  // Handle different description formats in Postman
  const description = normalizeDescription(collection.info.description) || ''

  // Process license and contact information
  const license = processLicense(collection)
  const contact = processContact(collection)

  // Process logo information
  const logo = processLogo(collection)

  // Initialize the OpenAPI document with required fields (or clone a base document to merge into)
  const openapi: OpenAPIV3_1.Document = baseDocument ?? {
    openapi: '3.1.0',
    info: {
      title,
      version,
      ...(description && { description }),
      ...(license && { license }),
      ...(contact && { contact }),
      ...(logo && { 'x-logo': logo }),
    },
    paths: {},
  }

  openapi.paths = openapi.paths ?? {}

  // Process external docs
  const externalDocs = processExternalDocs(collection)
  if (externalDocs && (!isMergingIntoBase || !openapi.externalDocs)) {
    openapi.externalDocs = externalDocs
  }

  // Process authentication if present in the collection
  if (collection.auth) {
    const { securitySchemes, security } = processAuth(collection.auth)
    mergeSecuritySchemes(openapi, securitySchemes)
    if (security?.length) {
      if (isMergingIntoBase && openapi.security?.length) {
        openapi.security = [...openapi.security, ...security]
      } else {
        openapi.security = security
      }
    }
  }

  // Process each item in the collection and merge into OpenAPI spec
  const allServerUsage: Array<{
    serverUrl: string
    path: string
    method: 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'
  }> = []

  if (collection.item) {
    const usePathFilter = requestIndexPaths !== undefined

    if (usePathFilter) {
      const uniquePaths = dedupeIndexPaths(requestIndexPaths)
      const { tags, resolveTagName } = extractTagsForSelectedPaths(collection.item, uniquePaths, tagNamingStrategy)
      assignTagsFromPostman(openapi, tags, isMergingIntoBase)

      for (const path of uniquePaths) {
        const node = getNodeAtPath(collection.item, path)
        if (!node) {
          continue
        }

        const parentTags = collectParentTagSegments(collection.item, path)
        const {
          paths: itemPaths,
          components: itemComponents,
          serverUsage,
        } = processItem(node, DEFAULT_EXAMPLE_NAME, parentTags, '', mergeOperation, resolveTagName)

        allServerUsage.push(...serverUsage)

        for (const [pathKey, pathItem] of Object.entries(itemPaths)) {
          const normalizedPathKey = normalizePath(pathKey)

          if (!pathItem) {
            continue
          }

          mergePathItem(openapi.paths, normalizedPathKey, pathItem, mergeOperation)
        }

        if (itemComponents?.securitySchemes) {
          mergeSecuritySchemes(openapi, itemComponents.securitySchemes)
        }
      }
    } else {
      const { tags, resolveTagName } = extractTags(collection.item, tagNamingStrategy)
      assignTagsFromPostman(openapi, tags, isMergingIntoBase)

      collection.item.forEach((item) => {
        const {
          paths: itemPaths,
          components: itemComponents,
          serverUsage,
        } = processItem(item, DEFAULT_EXAMPLE_NAME, [], '', mergeOperation, resolveTagName)

        allServerUsage.push(...serverUsage)

        openapi.paths = openapi.paths || {}
        for (const [pathKey, pathItem] of Object.entries(itemPaths)) {
          const normalizedPathKey = normalizePath(pathKey)

          if (!pathItem) {
            continue
          }

          mergePathItem(openapi.paths, normalizedPathKey, pathItem, mergeOperation)
        }

        if (itemComponents?.securitySchemes) {
          mergeSecuritySchemes(openapi, itemComponents.securitySchemes)
        }
      })
    }
  }

  // Extract all unique paths from the document
  let canonicalPathByPath = new Map<string, string>()
  if (openapi.paths) {
    const unificationResult = unifyEquivalentPathParameters(openapi.paths)
    openapi.paths = unificationResult.paths
    canonicalPathByPath = unificationResult.canonicalPathByPath
  }

  const normalizedServerUsage = allServerUsage.map((usage) => {
    const normalizedUsagePath = normalizePath(usage.path)
    return {
      ...usage,
      path: canonicalPathByPath.get(normalizedUsagePath) ?? normalizedUsagePath,
    }
  })

  // Extract all unique paths from the document
  const allUniquePaths = new Set<string>()
  if (openapi.paths) {
    for (const pathKey of Object.keys(openapi.paths)) {
      allUniquePaths.add(pathKey)
    }
  }

  // Analyze server distribution and place servers at appropriate levels
  const serverPlacement = analyzeServerDistribution(normalizedServerUsage, allUniquePaths)

  // Add servers to document level
  if (serverPlacement.document.length > 0) {
    openapi.servers = isMergingIntoBase
      ? mergeServerLists(openapi.servers, serverPlacement.document)
      : serverPlacement.document
  }

  // Add servers to path items
  if (openapi.paths) {
    for (const [path, servers] of serverPlacement.pathItems.entries()) {
      const normalizedPathKey = normalizePath(path)
      const pathItem = openapi.paths[normalizedPathKey]
      if (pathItem) {
        pathItem.servers = isMergingIntoBase ? mergeServerLists(pathItem.servers, servers) : servers
      }
    }

    // Add servers to operations
    for (const [path, methods] of serverPlacement.operations.entries()) {
      const normalizedPathKey = normalizePath(path)
      const pathItem = openapi.paths[normalizedPathKey]
      if (!pathItem) {
        continue
      }
      for (const [method, servers] of methods.entries()) {
        if (method in pathItem) {
          const operation = pathItem[method as keyof typeof pathItem]
          if (operation && typeof operation === 'object' && 'responses' in operation) {
            operation.servers = isMergingIntoBase ? mergeServerLists(operation.servers, servers) : servers
          }
        }
      }
    }
  }

  // Clean up the generated paths
  if (openapi.paths) {
    cleanupOperations(openapi.paths)
  }

  // Remove empty components object
  if (Object.keys(openapi.components || {}).length === 0) {
    delete openapi.components
  }

  return pruneDocument(openapi)
}
