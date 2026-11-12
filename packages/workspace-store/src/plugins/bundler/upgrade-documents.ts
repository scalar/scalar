import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { isObject } from '@scalar/helpers/object/is-object'
import { isSchemaPath } from '@scalar/helpers/openapi/is-schema-path'
import { type LifecyclePlugin, resolveReferencePath } from '@scalar/json-magic/bundle'
import { getHash, uniqueValueGeneratorFactory } from '@scalar/json-magic/bundle/value-generator'
import { type FragmentKind, type FragmentLocation, upgradeFragment } from '@scalar/openapi-upgrader'

import { openApiDocument, resolveOpenApiDocument } from './openapi-document'

const metadataKey = 'x-scalar-upgrade'
type SourceVersion = '2.0' | '3.0'
type SourceDialect = SourceVersion | 'modern'
type UpgradeMetadata = { from: SourceVersion; locations: FragmentLocation[] }

const sourceVersion = (value: unknown): SourceVersion | undefined => {
  if (value === '2.0') {
    return '2.0'
  }
  if (value === '3.0') {
    return '3.0'
  }
  if (typeof value === 'string' && /^3\.0\.\d+$/.test(value)) {
    return '3.0'
  }
  return undefined
}

const metadata = (document: unknown): UpgradeMetadata | undefined => {
  if (!isObject(document) || !isObject(document[metadataKey])) {
    return undefined
  }
  const entry = document[metadataKey]
  const from = sourceVersion(entry.from)
  const locations = Array.isArray(entry.locations)
    ? entry.locations.filter(
        (location): location is FragmentLocation =>
          isObject(location) &&
          Array.isArray(location.source) &&
          Array.isArray(location.output) &&
          location.source.every((part) => typeof part === 'string') &&
          location.output.every((part) => typeof part === 'string'),
      )
    : undefined
  return from && locations ? { from, locations } : undefined
}

const pointerSegments = (fragment: string): string[] => {
  let decoded = fragment
  try {
    decoded = decodeURIComponent(fragment)
  } catch {
    /* Retain legacy literal percent characters. */
  }
  return decoded.startsWith('/') ? decoded.slice(1).split('/').map(unescapeJsonPointerSegment) : []
}

const atPath = (value: unknown, path: readonly string[]): unknown => {
  let current = value
  for (const key of path) {
    if (!isObject(current) && !Array.isArray(current)) {
      return undefined
    }
    if (!Object.hasOwn(current, key)) {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

const fragmentKind = (path: readonly string[]): FragmentKind | undefined => {
  if (isSchemaPath([...path])) {
    return 'schema'
  }
  if (path.at(-2) === 'callbacks') {
    return 'callback'
  }
  if (path.at(-3) === 'callbacks') {
    return 'path-item'
  }
  if (path.at(-2) === 'parameters') {
    return 'parameter'
  }
  if (path.at(-2) === 'headers') {
    return 'header'
  }
  if (path.at(-2) === 'responses') {
    return 'response'
  }
  if (path.at(-1) === 'requestBody' || path.at(-2) === 'requestBodies') {
    return 'request-body'
  }
  if (path.at(-2) === 'paths' || path.at(-2) === 'pathItems' || path.at(-2) === 'webhooks') {
    return 'path-item'
  }
  return undefined
}

/** Upgrade loaded resources at their source locations, before bundling hides them under x-ext. */
export const upgradeDocuments = (entryVersion?: unknown): LifecyclePlugin => {
  const sources = new Map<string, { document: unknown; version?: SourceDialect }>()
  let entryUri: string | undefined
  const resolvers = new Map<string, (ref: string) => Promise<unknown>>()
  const converted = new WeakSet<object>()
  const transformedReferences = new WeakSet<object>()
  const originalReferences = openApiDocument({ preserveOriginalRefs: true })
  const markConverted = (value: unknown): void => {
    if (value === null || typeof value !== 'object' || converted.has(value)) {
      return
    }
    converted.add(value)
    Object.values(value).forEach(markConverted)
  }
  return {
    type: 'lifecycle',
    onBeforeNodeProcess: originalReferences.onBeforeNodeProcess,
    onAfterNodeProcess: (node, context) => {
      if (transformedReferences.has(node)) {
        return originalReferences.onAfterNodeProcess?.(node, context)
      }
    },
    onDocumentLoaded: async (document, { uri, loadDocument }) => {
      entryUri ??= uri
      const from = isObject(document) ? sourceVersion(document.swagger ?? document.openapi) : undefined
      const version =
        from ??
        metadata(document)?.from ??
        (isObject(document)
          ? (sourceVersion(document['x-original-oas-version']) ??
            (typeof document.openapi === 'string' || typeof document.swagger === 'string' ? 'modern' : undefined))
          : undefined)
      sources.set(uri, { document: structuredClone(document), version })
      const resolveSource = async (ref: string, origin = uri, visited = new Set<string>()): Promise<unknown> => {
        const absolute = resolveReferencePath(origin, ref)
        if (visited.has(absolute)) {
          throw new Error(`Cyclic parameter reference: ${absolute}`)
        }
        visited.add(absolute)
        const [resource, fragment = ''] = absolute.split('#', 2)
        const loaded = resource === uri ? { ok: true, data: document } : await loadDocument(resource!)
        if (!loaded.ok) {
          throw new Error(`Cannot upgrade referenced parameter: ${absolute}`)
        }
        const target = atPath(loaded.data, pointerSegments(fragment))
        if (isObject(target) && typeof target.$ref === 'string') {
          return resolveSource(target.$ref, resource, visited)
        }
        // The operation may inline a referenced body/form parameter. Rebase its schema refs
        // before moving it out of its resource; example/default payloads remain literal data.
        const rebase = (value: unknown, kind: 'object' | 'schema' | 'map' = 'object'): unknown => {
          if (Array.isArray(value)) {
            return value.map((entry) => rebase(entry, kind))
          }
          if (!isObject(value)) {
            return value
          }
          return Object.fromEntries(
            Object.entries(value).map(([key, child]) => {
              if (key === '$ref' && typeof child === 'string') {
                return [key, resolveReferencePath(resource!, child)]
              }
              if (['example', 'examples', 'default', 'enum', 'const'].includes(key) && kind !== 'map') {
                return [key, structuredClone(child)]
              }
              if (key.startsWith('x-') && kind !== 'map') {
                return [key, structuredClone(child)]
              }
              return [
                key,
                rebase(
                  child,
                  key === 'properties' || key === 'definitions'
                    ? 'map'
                    : key === 'schema' || kind === 'map'
                      ? 'schema'
                      : kind,
                ),
              ]
            }),
          )
        }
        return rebase(target)
      }
      resolvers.set(uri, resolveSource)
      if (!from || metadata(document)) {
        return document
      }
      const result = await upgradeFragment(document, { from, to: '3.1', kind: 'document', resolveSource })
      if (!isObject(result.value)) {
        return result.value
      }
      const locations = result.locations.filter(
        ({ source, output }) => JSON.stringify(source) !== JSON.stringify(output),
      )
      const keepMetadata = uri !== entryUri || locations.length > 0 || result.contexts.length > 0
      const upgraded = {
        ...result.value,
        ...(keepMetadata ? { [metadataKey]: { from, locations, contexts: result.contexts } } : {}),
        ...(uri === entryUri && isObject(document) && !document['x-original-oas-version']
          ? { 'x-original-oas-version': document.swagger ?? document.openapi }
          : {}),
      }
      markConverted(upgraded)
      return upgraded
    },
    resolveDocument: (document, uri) => {
      const upgrade = metadata(document)
      if (!upgrade) {
        return isObject(document) && !document.openapi && !document.swagger && !document.asyncapi
          ? { baseUri: uri, visitReferencedSubtrees: true }
          : undefined
      }
      const identity = resolveOpenApiDocument(document, uri)
      return {
        ...identity,
        baseUri: identity?.baseUri ?? uri,
        remapPointer: (pointer) => {
          const matches = upgrade.locations.filter(({ source }) =>
            source.every((part, index) => part === pointer[index]),
          )
          const match = matches.sort((a, b) => b.source.length - a.source.length)[0]
          return match ? [...match.output, ...pointer.slice(match.source.length)] : pointer
        },
      }
    },
    onBeforeTargetProcess: async (target, context) => {
      if (!isObject(target) || context.path[0] === metadataKey) {
        return undefined
      }
      const source = sources.get(context.uri)
      const document = context.document
      // Complete versioned resources were converted at load time. Saved resources carry
      // the same information so lazy resolution after serialization cannot upgrade twice.
      const referenceNode = atPath(context.referenceSource.document, context.referenceSource.path)
      if (isObject(document) && (document.openapi || document.swagger || metadata(document))) {
        if (metadata(document) && document !== context.referencedFrom.rootNode && isObject(referenceNode)) {
          transformedReferences.add(referenceNode)
        }
        return undefined
      }
      if (converted.has(target)) {
        return undefined
      }
      const referring = sources.get(context.referenceSource.uri)
      const storedPath = context.referenceSource.path
      const variant =
        storedPath[0] === metadataKey && storedPath[1] === 'variants'
          ? atPath(context.referenceSource.document, storedPath.slice(0, 3))
          : undefined
      const inherited = isObject(variant) ? sourceVersion(variant.from) : undefined
      const from = inherited ?? referring?.version ?? sourceVersion(entryVersion)
      if (!from || from === 'modern' || typeof target.$schema === 'string') {
        return undefined
      }
      const path =
        isObject(variant) && Array.isArray(variant.semanticPath)
          ? [...variant.semanticPath, ...storedPath.slice(4)]
          : storedPath
      const kind = fragmentKind(path)
      if (!kind || !isObject(document)) {
        return undefined
      }
      if (isObject(referenceNode)) {
        transformedReferences.add(referenceNode)
      }
      // Saved API descriptions restore external refs and discard bundled resources. Keep
      // the original entry dialect so bare targets are interpreted the same way on reload.
      const entryDialect = entryUri === undefined ? undefined : sources.get(entryUri)?.version
      if (entryDialect && entryDialect !== 'modern' && !metadata(context.referencedFrom.rootNode)) {
        context.referencedFrom.rootNode[metadataKey] = { from: entryDialect, locations: [] }
      }
      const originalValue = atPath(source?.document ?? document, context.path) ?? target
      const original =
        context.path.length === 0 && isObject(originalValue)
          ? Object.fromEntries(Object.entries(originalValue).filter(([key]) => key !== metadataKey))
          : originalValue
      const owner = referring?.document
      const operation = path[0] === 'paths' ? atPath(owner, path.slice(0, 3)) : undefined
      const savedContexts = atPath(owner, [metadataKey, 'contexts'])
      const saved = Array.isArray(savedContexts)
        ? savedContexts
            .filter(
              (item) =>
                isObject(item) &&
                Array.isArray(item.path) &&
                item.path.every((segment, index) => segment === path[index]),
            )
            .sort((a, b) => b.path.length - a.path.length)[0]
        : undefined
      const consumes =
        isObject(variant) && Array.isArray(variant.consumes)
          ? variant.consumes
          : isObject(operation) && Array.isArray(operation.consumes)
            ? operation.consumes
            : isObject(owner) && Array.isArray(owner.consumes)
              ? owner.consumes
              : saved?.consumes
      const produces =
        isObject(variant) && Array.isArray(variant.produces)
          ? variant.produces
          : isObject(operation) && Array.isArray(operation.produces)
            ? operation.produces
            : isObject(owner) && Array.isArray(owner.produces)
              ? owner.produces
              : saved?.produces
      const storage = isObject(document[metadataKey]) ? document[metadataKey] : {}
      const mappings = isObject(storage.mappings) ? (storage.mappings as Record<string, string>) : {}
      const { generate } = uniqueValueGeneratorFactory(getHash, mappings)
      const key = await generate(JSON.stringify([context.path, from, kind, consumes, produces]))
      storage.mappings = mappings
      document[metadataKey] = storage
      const variantPath = [metadataKey, 'variants', key, 'value']
      const cached = atPath(document, variantPath)
      if (cached !== undefined) {
        return { value: cached, path: variantPath }
      }
      const result = await upgradeFragment(original, {
        from,
        to: '3.1',
        kind,
        consumes,
        produces,
        resolveSource: resolvers.get(context.uri),
      })
      markConverted(result.value)
      const variants = isObject(storage.variants) ? storage.variants : {}
      variants[key] = { from, semanticPath: path, consumes, produces, value: result.value }
      storage.variants = variants
      document[metadataKey] = storage
      return { value: result.value, path: variantPath }
    },
  }
}
