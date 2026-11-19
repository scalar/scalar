import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'
import { isSchemaPath } from '@scalar/helpers/openapi/is-schema-path'
import { type LifecyclePlugin, resolveReferencePath } from '@scalar/json-magic/bundle'
import { getHash, uniqueValueGeneratorFactory } from '@scalar/json-magic/bundle/value-generator'
import { getValueByPath } from '@scalar/json-magic/helpers/get-value-by-path'
import { type FragmentKind, type FragmentLocation, upgradeFragment } from '@scalar/openapi-upgrader'

import { openApiDocument, resolveOpenApiDocument } from './openapi-document'

const metadataKey = 'x-scalar-upgrade'
type SourceVersion = '2.0' | '3.0'
type SourceDialect = SourceVersion | 'modern'
type UpgradeMetadata = { from: SourceVersion; locations: FragmentLocation[]; pointers: Map<string, readonly string[]> }

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

const metadataCache = new WeakMap<object, UpgradeMetadata | undefined>()

const metadata = (document: unknown): UpgradeMetadata | undefined => {
  if (!isObject(document) || !isObject(document[metadataKey])) {
    return undefined
  }
  const entry = document[metadataKey]
  if (metadataCache.has(entry)) {
    return metadataCache.get(entry)
  }
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
  const pointers = new Map<string, readonly string[]>()
  for (const location of locations ?? []) {
    const key = JSON.stringify(location.source)
    if (!pointers.has(key)) {
      pointers.set(key, location.output)
    }
  }
  const result = from && locations ? { from, locations, pointers } : undefined
  metadataCache.set(entry, result)
  return result
}

const pointerSegments = (fragment: string): string[] => {
  let decoded = fragment
  try {
    decoded = decodeURIComponent(fragment)
  } catch {
    /* Retain legacy literal percent characters. */
  }
  // The shared helper decodes URI escapes too; protect literal percent signs from a second decode.
  return decoded.startsWith('/') ? parseJsonPointerSegments(decoded.replaceAll('%', '%25')) : []
}

const atPath = (value: unknown, path: readonly string[]): unknown => getValueByPath(value, [...path]).value

const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((part) => typeof part === 'string')

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
  const originalReferences = openApiDocument({ preserveOriginalRefs: true, useContextPath: true })
  const markConverted = (value: unknown): void => {
    if (value === null || typeof value !== 'object' || converted.has(value)) {
      return
    }
    converted.add(value)
    Object.values(value).forEach(markConverted)
  }
  return {
    type: 'lifecycle',
    onAfterNodeProcess: (node, context) => {
      if (transformedReferences.has(node)) {
        return originalReferences.onAfterNodeProcess?.(node, context)
      }
    },
    onDocumentLoaded: async (document, { uri, loadDocument, stored }) => {
      entryUri ??= uri
      const from = !stored && isObject(document) ? sourceVersion(document.swagger ?? document.openapi) : undefined
      const version =
        from ??
        metadata(document)?.from ??
        (isObject(document)
          ? (sourceVersion(document['x-original-oas-version']) ??
            (typeof document.openapi === 'string' || typeof document.swagger === 'string' ? 'modern' : undefined))
          : undefined)
      // Retain source context only when a complete legacy resource will be replaced.
      // Lazy resolves of an already upgraded root must not copy the whole API description.
      sources.set(uri, { document: from && !metadata(document) ? structuredClone(document) : document, version })
      const resolveSource = async (ref: string, origin = uri, visited = new Set<string>()): Promise<unknown> => {
        const [prefix, fragment = ''] = ref.split('#', 2)
        const resource = prefix ? resolveReferencePath(origin, prefix) : origin
        const absolute = `${resource}#${fragment}`
        if (visited.has(absolute)) {
          throw new Error(`Cyclic parameter reference: ${absolute}`)
        }
        visited.add(absolute)
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
        const rebased = new WeakMap<object, unknown>()
        const rebase = (value: unknown, kind: 'object' | 'schema' | 'map' = 'object'): unknown => {
          if (value === null || typeof value !== 'object') {
            return value
          }
          if (rebased.has(value)) {
            return rebased.get(value)
          }
          if (Array.isArray(value)) {
            const result: unknown[] = []
            rebased.set(value, result)
            result.push(...value.map((entry) => rebase(entry, kind)))
            return result
          }
          const result = Object.create(null) as Record<string, unknown>
          rebased.set(value, result)
          for (const [key, child] of Object.entries(value)) {
            const [name, entry] = (() => {
              if (key === '$ref' && typeof child === 'string') {
                const [relative, pointer] = child.split('#', 2)
                const targetResource = relative ? resolveReferencePath(resource, relative) : resource
                const base = targetResource === uri ? '' : targetResource
                return [key, `${base}${pointer === undefined ? '' : `#${pointer}`}`] as const
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
              ] as const
            })()
            result[name] = entry
          }
          return result
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
      // Keep only prefix substitutions that cannot be inherited from a relocated parent.
      const prefixes = new Map<string, readonly string[]>()
      const locations = result.locations.filter(({ source, output }) => {
        const key = JSON.stringify(source)
        if (prefixes.has(key)) {
          return false
        }
        prefixes.set(key, output)
        for (let length = source.length - 1; length >= 0; length--) {
          const parent = prefixes.get(JSON.stringify(source.slice(0, length)))
          if (parent) {
            return JSON.stringify([...parent, ...source.slice(length)]) !== JSON.stringify(output)
          }
        }
        return JSON.stringify(source) !== JSON.stringify(output)
      })
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
          for (let length = pointer.length; length >= 0; length--) {
            const output = upgrade.pointers.get(JSON.stringify(pointer.slice(0, length)))
            if (output) {
              return [...output, ...pointer.slice(length)]
            }
          }
          return pointer
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
          originalReferences.onBeforeNodeProcess?.(referenceNode, {
            ...context.referencedFrom,
            path:
              context.referenceSource.document === context.referencedFrom.rootNode
                ? [...context.referenceSource.path]
                : context.referencedFrom.path,
          })
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
        isObject(variant) && stringArray(variant.semanticPath)
          ? [...variant.semanticPath, ...storedPath.slice(4)]
          : storedPath
      const kind = fragmentKind(path)
      if (!kind || !isObject(document)) {
        return undefined
      }
      if (isObject(referenceNode)) {
        originalReferences.onBeforeNodeProcess?.(referenceNode, {
          ...context.referencedFrom,
          path:
            context.referenceSource.document === context.referencedFrom.rootNode
              ? [...context.referenceSource.path]
              : context.referencedFrom.path,
        })
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
                stringArray(item.consumes) &&
                stringArray(item.produces) &&
                stringArray(item.path) &&
                item.path.every((segment, index) => segment === path[index]),
            )
            .sort((a, b) => b.path.length - a.path.length)[0]
        : undefined
      const consumes =
        isObject(variant) && stringArray(variant.consumes)
          ? variant.consumes
          : isObject(operation) && stringArray(operation.consumes)
            ? operation.consumes
            : isObject(owner) && stringArray(owner.consumes)
              ? owner.consumes
              : saved?.consumes
      const produces =
        isObject(variant) && stringArray(variant.produces)
          ? variant.produces
          : isObject(operation) && stringArray(operation.produces)
            ? operation.produces
            : isObject(owner) && stringArray(owner.produces)
              ? owner.produces
              : saved?.produces
      const storage = Object.assign(Object.create(null), isObject(document[metadataKey]) ? document[metadataKey] : {})
      const mappings = Object.assign(
        Object.create(null),
        Object.fromEntries(
          Object.entries(isObject(storage.mappings) ? storage.mappings : {}).filter(
            ([key, value]) => !['__proto__', 'prototype', 'constructor'].includes(key) && typeof value === 'string',
          ),
        ),
      ) as Record<string, string>
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
      const variants: Record<string, unknown> = Object.assign(
        Object.create(null),
        isObject(storage.variants) ? storage.variants : {},
      )
      variants[key] = { from, semanticPath: path, consumes, produces, value: result.value }
      storage.variants = variants
      document[metadataKey] = storage
      return { value: result.value, path: variantPath }
    },
  }
}
