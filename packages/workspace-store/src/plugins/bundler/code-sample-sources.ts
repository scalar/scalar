import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'
import {
  type LifecyclePlugin,
  type LoaderPlugin,
  type ResolveResult,
  resolveReferencePath,
} from '@scalar/json-magic/bundle'

import { forEachPathItemOperation } from '@/helpers/for-each-path-item-operation'
import { resolveOpenApiDocument } from '@/plugins/bundler/openapi-document'
import type { PathItemObject } from '@/schemas/v3.2/strict/path-item'

/** Recognize operations, including callbacks, without interpreting similarly named literal data. */
const isOperationPath = (path: readonly string[]): boolean => {
  const start =
    (path[0] === 'paths' && !path[1]?.startsWith('x-')) || path[0] === 'webhooks'
      ? 2
      : path[0] === 'components' && path[1] === 'pathItems'
        ? 3
        : path[0] === 'components' && path[1] === 'callbacks'
          ? 4
          : undefined
  if (start === undefined) {
    return false
  }

  const operation = (index: number): boolean => {
    const method = path[index]
    const end = method === 'additionalOperations' ? index + 2 : index + 1
    if (method !== 'additionalOperations' && (!method || !isHttpMethod(method) || method !== method.toLowerCase())) {
      return false
    }
    if (end === path.length) {
      return true
    }
    return path[end] === 'callbacks' && end + 3 < path.length && operation(end + 3)
  }
  return operation(start)
}

/**
 * Resolve the two Redocly code-file extensions at operation nodes. Their contents remain opaque
 * to document traversal: a `$ref` written inside the downloaded code is never another reference.
 * `path` identifies the selected subtree during lazy resolution.
 */
export const codeSampleSources = (path: readonly string[] = []): LifecyclePlugin => {
  const loadSources = createSourceLoader()
  const locations = new Map<string, { target: string[]; source: string[] }[]>()
  return {
    type: 'lifecycle',
    resolveDocument: (document, retrievalUri) => {
      const identity = resolveOpenApiDocument(document, retrievalUri)
      const entries = locations.get(retrievalUri)
      if (identity && entries) {
        // Fragment locations are discovered at retrieval URLs, but node hooks use the declared identity.
        locations.set(identity.baseUri, entries)
      }
      // Run before openApiDocument so its identity resolver still owns document registration.
      return undefined
    },
    onBeforeNodeProcess: async (node, context) => {
      const external = context.path[0] === 'x-ext'
      const localPath = external ? context.path.slice(2) : context.path
      const location = locations
        .get(context.origin)
        ?.find(({ target }) => target.every((segment, index) => localPath[index] === segment))
      const operationPath = location
        ? [...location.source, ...localPath.slice(location.target.length)]
        : external
          ? [...path, ...(context.referencedFromPath ?? []), ...localPath]
          : [...path, ...localPath]
      // A referenced fragment can live under an arbitrary key in its file. Carry the referring
      // operation/path-item/callback location across each hop instead of mistaking that key for an OAS field.
      if (
        typeof node.$ref === 'string' &&
        [operationPath, [...operationPath, 'get'], [...operationPath, '{}', 'get']].some(isOperationPath)
      ) {
        const [file, fragment = ''] = node.$ref.split('#')
        if (!fragment || fragment.startsWith('/')) {
          try {
            const url = resolveReferencePath(context.origin, file ?? '')
            const target = parseJsonPointerSegments(decodeURIComponent(fragment))
            const entries = locations.get(url) ?? []
            entries.push({ target, source: operationPath })
            entries.sort((a, b) => b.target.length - a.target.length)
            locations.set(url, entries)
          } catch {
            // The regular reference resolver reports invalid reference URIs.
          }
        }
      }
      if (isOperationPath(operationPath) || (external && isOperationPath(localPath))) {
        await loadSources(node, context.origin, context.loaders)
      }
    },
  }
}

type SourceLoader = (node: Record<string, unknown>, origin: string, loaders: LoaderPlugin[]) => Promise<void>

const createSourceLoader = (): SourceLoader => {
  // Keep raw text separate from the bundler's parsed-document cache, even for the same URL.
  const cache = new Map<string, Promise<ResolveResult>>()
  return async (node: Record<string, unknown>, origin: string, loaders: LoaderPlugin[]): Promise<void> => {
    for (const key of ['x-codeSamples', 'x-code-samples']) {
      const samples = node[key]
      if (!Array.isArray(samples)) {
        continue
      }
      for (const sample of samples) {
        if (!isObject(sample) || !isObject(sample.source) || typeof sample.source.$ref !== 'string') {
          continue
        }
        const reference = sample.source.$ref
        // This convention includes whole code files, not JSON Pointer targets or arbitrary objects.
        if (!reference || reference.includes('#')) {
          continue
        }
        if (origin === '/' && !/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(reference)) {
          continue
        }
        try {
          const url = resolveReferencePath(origin, reference)
          const loader = loaders.find((candidate) => candidate.validate(url))
          // Keep the source's origin when an operation is moved into a server chunk or x-ext bucket.
          sample.source.$ref = url
          if (!loader) {
            continue
          }
          if (!cache.has(url)) {
            cache.set(url, loader.exec(url, { parseAs: 'text' }))
          }
          const result = await cache.get(url)
          if (result?.ok) {
            sample.source = result.raw
          } else {
            console.warn(`Unable to load code sample from "${url}"`)
          }
        } catch {
          // Retaining the reference keeps a failed download distinct from an authored empty sample.
          console.warn(`Unable to load code sample from "${reference}"`)
        }
      }
    }
  }
}

/** Load inline operations on the server without eagerly resolving its deferred OpenAPI references. */
export const loadCodeSampleSources = async (
  document: Record<string, unknown>,
  origin: string,
  loaders: LoaderPlugin[],
): Promise<void> => {
  const loadSources = createSourceLoader()
  const visited = new WeakSet<object>()
  const visitPathItems = async (items: unknown, extensions: boolean): Promise<void> => {
    if (!isObject(items)) {
      return
    }
    for (const [key, pathItem] of Object.entries(items)) {
      if ((extensions && key.startsWith('x-')) || !isObject(pathItem) || visited.has(pathItem)) {
        continue
      }
      visited.add(pathItem)
      const operations: unknown[] = []
      forEachPathItemOperation(pathItem as PathItemObject, (_, operation) => operations.push(operation))
      for (const operation of operations) {
        if (!isObject(operation)) {
          continue
        }
        await loadSources(operation, origin, loaders)
        if (isObject(operation.callbacks)) {
          for (const callback of Object.values(operation.callbacks)) {
            await visitPathItems(callback, true)
          }
        }
      }
    }
  }
  await visitPathItems(document.paths, true)
  await visitPathItems(document.webhooks, false)
  if (isObject(document.components)) {
    await visitPathItems(document.components.pathItems, false)
    if (isObject(document.components.callbacks)) {
      for (const callback of Object.values(document.components.callbacks)) {
        await visitPathItems(callback, true)
      }
    }
  }
}
