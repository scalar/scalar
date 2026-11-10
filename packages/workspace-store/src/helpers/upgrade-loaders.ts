import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { isObject } from '@scalar/helpers/object/is-object'
import { isPollutionKey } from '@scalar/helpers/object/prevent-pollution'
import { setValueAtPath } from '@scalar/helpers/object/set-value-at-path'
import {
  type LoaderPlugin,
  type Plugin,
  type ResolveResult,
  decodeUriFragment,
  resolveReferencePath,
} from '@scalar/json-magic/bundle'
import { upgradeFromThreeToThreeOne } from '@scalar/openapi-upgrader/3.0-to-3.1'

import { deepClone } from './deep-clone'
import { unpackProxyShallow } from './unpack-proxy'

const isThreeZero = (version: unknown): version is string => typeof version === 'string' && version.startsWith('3.0')

const versionHeaders = ['swagger', 'asyncapi', 'openapi'] as const
const getVersionHeader = (data: Record<string, unknown>): (typeof versionHeaders)[number] | undefined =>
  versionHeaders.find((key) => typeof data[key] === 'string')

type RecordRelocation = (from: string[], to: string[]) => void
type RemapPointer = (pointer: readonly string[]) => readonly string[]

// A lazy bundle can reuse files loaded by an earlier call. Use raw object identity because
// the client can expose those same nodes through proxies after they enter the workspace.
const fragments = new WeakSet<object>()
const convertedNodes = new WeakSet<object>()
const deferredReferences = new WeakMap<object, () => unknown>()
const pointerRemaps = new WeakMap<object, RemapPointer>()
const fragmentLocations = new WeakMap<object, { document: object; path: string[] }>()
const fragmentMoves = new WeakMap<object, Map<string, string[]>>()
const bundledReferences = new WeakMap<object, Set<Record<string, unknown>>>()

const remap = (pointer: readonly string[], moves: Map<string, string[]>): readonly string[] => {
  let remapped = pointer
  for (let length = pointer.length; length > 0; length--) {
    const destination = moves.get(JSON.stringify(pointer.slice(0, length)))
    if (destination) {
      remapped = [...destination, ...remapped.slice(length)]
    }
  }
  return remapped
}

/** Upgrade versioned documents immediately, and headerless files only at their referring OpenAPI location. */
export const upgradeLoadedDocument = (
  data: unknown,
  entryVersion: unknown,
  path?: readonly string[],
  recordRelocation?: RecordRelocation,
): unknown => {
  if (!isObject(data)) {
    return data
  }

  const versionHeader = getVersionHeader(data)
  if (versionHeader) {
    return versionHeader === 'openapi' && isThreeZero(data.openapi)
      ? upgradeFromThreeToThreeOne({ ...data }, recordRelocation)
      : data
  }

  if (!isThreeZero(entryVersion)) {
    return data
  }

  if (path?.length) {
    // The upgrader distinguishes schema examples from Parameter/Media Type examples and literal
    // Example Object payloads by their path. A synthetic schema would lose that distinction.
    // Only OpenAPI keywords matter here. Substitute user-defined names that the safe setter
    // rejects or skips in this temporary wrapper, without changing the actual document's keys.
    const contextPath = path.map((key) => (!key || isPollutionKey(key) ? 'fragment' : key))
    const document: Record<string, unknown> = { openapi: entryVersion }
    setValueAtPath(document, contextPath, data)
    return getValueAtPath(
      upgradeFromThreeToThreeOne(document, (from, to) =>
        recordRelocation?.(from.slice(contextPath.length), to.slice(contextPath.length)),
      ),
      contextPath,
    )
  }

  // A shared schema map can contain names such as `components` or `paths`. Without a
  // version header, wait for a reference to establish the target's OpenAPI object kind.
  return data
}

/**
 * Wrap loaders and prepare referenced fragments before the bundler indexes them.
 *
 * Bare files inherit the entry version, but their object kind comes from each referencing location.
 * Cache loader results so preparing a reference does not fetch it again during bundling.
 * Swagger 2.0 documents retain their original structure and JSON pointers.
 *
 * @param basePath - The selected subtree's path when bundling part of a document lazily.
 */
export const upgradeLoaders = (
  loaders: LoaderPlugin[],
  entryVersion: unknown,
  basePath: readonly string[] = [],
): Plugin[] => {
  let bundleRoot: Record<string, unknown> | undefined
  const paths = new WeakMap<object, readonly string[]>()
  // Resolvers retain the originating resource and follow current objects after an upgrade replaces children.
  const resolvedReferences = new WeakMap<object, () => unknown>()
  const indexNodes = (value: unknown, path?: readonly string[]): void => {
    if (value === null || typeof value !== 'object') {
      return
    }
    const raw = unpackProxyShallow(value)
    if (paths.has(raw) || (!path && fragments.has(raw))) {
      return
    }
    if (path) {
      paths.set(raw, path)
      const resolve = resolvedReferences.get(raw) ?? deferredReferences.get(raw)
      deferredReferences.delete(raw)
      upgradeTarget(resolve?.(), path)
    } else {
      fragments.add(raw)
    }
    for (const [key, child] of Object.entries(value)) {
      indexNodes(child, path ? [...path, key] : undefined)
    }
  }
  const upgradeTarget = (target: unknown, path: readonly string[]): void => {
    if (!isObject(target)) {
      return
    }
    const raw = unpackProxyShallow(target)
    if (!fragments.has(raw) || paths.has(raw) || convertedNodes.has(raw)) {
      return
    }
    // Mark the path before following cached edges so cyclic references terminate. Walk the existing
    // children first: their resolver callbacks would otherwise be lost when the upgrader clones them.
    indexNodes(target, path)
    // A descendant may already have been referenced and converted independently. Hide converted
    // subtrees behind opaque tokens so the recursive 3.0 upgrader cannot reinterpret their 3.1 data.
    // Restore their original identities afterward to retain the bundler's cached reference targets.
    const replacements = new Map<symbol, object>()
    const cloneCache = new WeakMap<object, unknown>()
    const visited = new WeakSet<object>()
    const protectConverted = (value: unknown): void => {
      if (value === null || typeof value !== 'object' || visited.has(value)) {
        return
      }
      visited.add(value)
      if (convertedNodes.has(unpackProxyShallow(value))) {
        const token = Symbol()
        replacements.set(token, value)
        cloneCache.set(value, token)
        return
      }
      Object.values(value).forEach(protectConverted)
    }
    protectConverted(target)
    const input = replacements.size ? deepClone(target, cloneCache) : target
    const moves = new Map<string, string[]>()
    const upgraded = upgradeLoadedDocument(input, entryVersion, path, (from, to) => {
      moves.set(JSON.stringify(from), to)
    })
    if (!isObject(upgraded) || upgraded === target) {
      return
    }
    const restoreConverted = (value: unknown): unknown => {
      if (typeof value === 'symbol' && replacements.has(value)) {
        return replacements.get(value)
      }
      if (value === null || typeof value !== 'object' || convertedNodes.has(value)) {
        return value
      }
      convertedNodes.add(value)
      for (const [key, child] of Object.entries(value)) {
        Object.defineProperty(value, key, {
          value: restoreConverted(child),
          enumerable: true,
          configurable: true,
          writable: true,
        })
      }
      return value
    }
    restoreConverted(upgraded)
    const references = bundleRoot && bundledReferences.get(unpackProxyShallow(bundleRoot))
    if (references?.size) {
      const visited = new WeakSet<object>()
      const transfer = (value: unknown, path: string[]): void => {
        if (typeof value !== 'object' || value === null || visited.has(value)) {
          return
        }
        visited.add(value)
        if (path.length && isObject(value) && references.has(unpackProxyShallow(value))) {
          const replacement = getValueAtPath(upgraded, [...remap(path, moves)])
          if (isObject(replacement) && typeof replacement.$ref === 'string') {
            references.add(unpackProxyShallow(replacement))
          } else if (isObject(replacement) && Array.isArray(replacement.anyOf)) {
            const arm = replacement.anyOf[0]
            if (isObject(arm) && typeof value.$ref === 'string' && arm.$ref === value.$ref) {
              references.add(unpackProxyShallow(arm))
            }
          }
        }
        for (const [key, child] of Object.entries(value)) {
          transfer(child, [...path, key])
        }
      }
      transfer(target, [])
    }
    for (const key of Object.keys(target)) {
      delete target[key]
    }
    Object.assign(target, upgraded)
    convertedNodes.add(raw)
    const location = fragmentLocations.get(raw)
    const documentMoves = location && fragmentMoves.get(location.document)
    if (location && documentMoves && moves.size) {
      for (const [from, to] of moves) {
        const segments = JSON.parse(from) as string[]
        documentMoves.set(JSON.stringify([...location.path, ...segments]), [...location.path, ...to])
      }
      // References bundled before this ancestor was upgraded already point into x-ext.
      const external = bundleRoot?.['x-ext']
      const key = isObject(external)
        ? Object.keys(external).find((name) => unpackProxyShallow(external[name]) === location.document)
        : undefined
      if (key !== undefined && references) {
        const prefix = ['x-ext', key, ...location.path]
        for (const node of references) {
          if (typeof node.$ref !== 'string' || !node.$ref.startsWith('#/x-ext/')) {
            continue
          }
          const pointer = decodeUriFragment(node.$ref.slice(1)).slice(1).split('/').map(unescapeJsonPointerSegment)
          if (prefix.every((segment, index) => pointer[index] === segment)) {
            const relative = pointer.slice(prefix.length)
            const relocated = remap(relative, moves)
            if (relative !== relocated) {
              node.$ref =
                '#/' +
                [...prefix, ...relocated].map((segment) => encodeURIComponent(escapeJsonPointer(segment))).join('/')
            }
          }
        }
      }
    }
    for (const [key, child] of Object.entries(target)) {
      indexNodes(child, [...path, key])
    }
  }
  const wrapped: LoaderPlugin[] = loaders.map((loader) => {
    const cache = new Map<string, Promise<ResolveResult>>()
    return {
      ...loader,
      exec: (value): Promise<ResolveResult> => {
        const existing = cache.get(value)
        if (existing) {
          return existing
        }
        const pending = loader.exec(value).then((result): ResolveResult => {
          if (!result.ok) {
            return result
          }
          const input = deepClone(result.data)
          const relocations = new Map<string, string[]>()
          const data = upgradeLoadedDocument(input, entryVersion, undefined, (from, to) => {
            relocations.set(JSON.stringify(from), to)
          })
          if (isObject(data) && relocations.size) {
            pointerRemaps.set(data, (pointer) => remap(pointer, relocations))
          }
          const isFragment = isThreeZero(entryVersion) && isObject(data) && !getVersionHeader(data)
          if (isFragment) {
            fragmentMoves.set(data, relocations)
            pointerRemaps.set(data, (pointer) => remap(pointer, relocations))
            const indexLocations = (value: unknown, path: string[]): void => {
              if (typeof value !== 'object' || value === null || fragmentLocations.has(value)) {
                return
              }
              fragmentLocations.set(value, { document: data, path })
              for (const [key, child] of Object.entries(value)) {
                indexLocations(child, [...path, key])
              }
            }
            indexLocations(data, [])
          }
          indexNodes(data, isFragment ? undefined : [])
          return { ...result, data }
        })
        cache.set(value, pending)
        return pending
      },
    }
  })

  return [
    ...wrapped,
    {
      type: 'lifecycle',
      resolveDocument: (document, retrievalUri) => {
        const remapPointer = isObject(document) ? pointerRemaps.get(unpackProxyShallow(document)) : undefined
        return remapPointer ? { baseUri: retrievalUri, remapPointer } : undefined
      },
      onBeforeNodeProcess: async (node, context): Promise<void> => {
        if (!isThreeZero(entryVersion) || typeof node.$ref !== 'string') {
          return
        }
        bundleRoot = context.rootNode
        const reference = node.$ref
        const path = paths.get(unpackProxyShallow(node)) ?? [...basePath, ...context.path]
        // Unreferenced portions of a bare file have no known OpenAPI object kind yet.
        if (path[0] === 'x-ext') {
          return
        }
        const [file, authoredFragment = ''] = reference.split('#')
        const fragment = decodeUriFragment(authoredFragment)
        if (fragment && !fragment.startsWith('/')) {
          return
        }
        const resolveTarget = async (): Promise<unknown> => {
          // Absolute and relative document URIs can already resolve in the bundler's registry.
          // Reuse them before invoking a loader, just as we do for fragment-only references.
          const resolved = context.resolveReference(reference)
          if (resolved || !file) {
            return resolved?.value
          }
          const url = resolveReferencePath(context.origin, file)
          const loader = wrapped.find((candidate) => candidate.validate(url))
          const result = await loader?.exec(url)
          if (!result?.ok) {
            return undefined
          }
          const targetPath = fragment ? fragment.slice(1).split('/').map(unescapeJsonPointerSegment) : []
          return getValueAtPath(
            result.data,
            isObject(result.data) ? [...(pointerRemaps.get(result.data)?.(targetPath) ?? targetPath)] : targetPath,
          )
        }
        upgradeTarget(await resolveTarget(), path)
      },
      onAfterNodeProcess: (node, context): void => {
        if (!isThreeZero(entryVersion) || typeof node.$ref !== 'string') {
          return
        }
        const reference = node.$ref
        const resolve = (): unknown => context.resolveReference(reference)?.value
        const raw = unpackProxyShallow(node)
        if (reference.startsWith('#/x-ext/')) {
          const root = unpackProxyShallow(context.rootNode)
          let references = bundledReferences.get(root)
          if (!references) {
            references = new Set()
            bundledReferences.set(root, references)
          }
          references.add(raw)
        }
        resolvedReferences.set(raw, resolve)
        const path = paths.get(raw) ?? [...basePath, ...context.path]
        if (path[0] !== 'x-ext') {
          upgradeTarget(resolve(), path)
        } else if (fragments.has(raw)) {
          deferredReferences.set(raw, resolve)
        }
      },
    },
  ]
}
