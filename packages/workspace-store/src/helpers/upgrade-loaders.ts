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
type Relocations = Map<string, string[]>
type Fragment = { relocations: Relocations; path: string[] }
type BoundReference = { field: readonly string[]; reference: string }

const remapPointer = (pointer: readonly string[], relocations: Relocations): readonly string[] => {
  let remapped = pointer
  // The upgrader visits children first. Apply moves in that order so a
  // pointer below two moved ancestors follows both of them.
  for (let length = pointer.length; length > 0; length--) {
    const destination = relocations.get(JSON.stringify(pointer.slice(0, length)))
    if (destination) {
      remapped = [...destination, ...remapped.slice(length)]
    }
  }
  return remapped
}

const remapBundlePath = (root: object, path: readonly string[]): readonly string[] => {
  if (path[0] !== 'x-ext' || path.length < 3) {
    return path
  }
  const file = getValueAtPath(root, path.slice(0, 2))
  const relocations = isObject(file) ? pointerRemaps.get(unpackProxyShallow(file)) : undefined
  if (!relocations?.size || getValueAtPath(root, [...path]) !== undefined) {
    return path
  }
  const target = path.slice(2)
  const remapped = remapPointer(target, relocations)
  return remapped === target ? path : [...path.slice(0, 2), ...remapped]
}

// A lazy bundle can reuse files loaded by an earlier call. Use raw object identity because
// the client can expose those same nodes through proxies after they enter the workspace.
const fragments = new WeakMap<object, Fragment>()
const convertedNodes = new WeakSet<object>()
const deferredReferences = new WeakMap<object, readonly string[]>()
const pointerRemaps = new WeakMap<object, Relocations>()
const boundReferences = new WeakMap<object, Map<string, BoundReference>>()

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
    const upgraded = upgradeFromThreeToThreeOne(document, (from, to) => {
      recordRelocation?.(from.slice(contextPath.length), to.slice(contextPath.length))
    })
    return getValueAtPath(upgraded, contextPath)
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
  const paths = new WeakMap<object, readonly string[]>()
  let movedFragments = false
  // Resolvers retain the originating resource and follow current objects after an upgrade replaces children.
  const resolvedReferences = new WeakMap<object, () => unknown>()
  const indexNodes = (value: unknown, path: readonly string[], root?: object): void => {
    if (value === null || typeof value !== 'object') {
      return
    }
    const raw = unpackProxyShallow(value)
    if (paths.has(raw)) {
      return
    }
    paths.set(raw, path)
    if (root) {
      const deferred = deferredReferences.get(raw)
      deferredReferences.delete(raw)
      const resolved =
        resolvedReferences.get(raw)?.() ??
        (deferred ? getValueAtPath(root, [...remapBundlePath(root, deferred)]) : undefined)
      upgradeTarget(resolved, path, root)
    }
    for (const [key, child] of Object.entries(value)) {
      indexNodes(child, [...path, key], root)
    }
  }
  const indexFragment = (value: unknown, fragment: Fragment): void => {
    if (value === null || typeof value !== 'object' || fragments.has(value)) {
      return
    }
    fragments.set(value, fragment)
    for (const [key, child] of Object.entries(value)) {
      indexFragment(child, { relocations: fragment.relocations, path: [...fragment.path, key] })
    }
  }
  const upgradeTarget = (target: unknown, path: readonly string[], root: object): void => {
    if (!isObject(target)) {
      return
    }
    const raw = unpackProxyShallow(target)
    const fragment = fragments.get(raw)
    if (!fragment || paths.has(raw) || convertedNodes.has(raw)) {
      return
    }
    // Mark the path before following cached edges so cyclic references terminate. Walk the existing
    // children first: their resolver callbacks would otherwise be lost when the upgrader clones them.
    indexNodes(target, path, root)
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
    const upgraded = upgradeLoadedDocument(input, entryVersion, path, (from, to) => {
      fragment.relocations.set(JSON.stringify([...fragment.path, ...from]), [...fragment.path, ...to])
      movedFragments = true
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
    for (const key of Object.keys(target)) {
      delete target[key]
    }
    Object.assign(target, upgraded)
    convertedNodes.add(raw)
    for (const [key, child] of Object.entries(target)) {
      indexNodes(child, [...path, key], root)
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
          const relocations: Relocations = new Map()
          const data = upgradeLoadedDocument(input, entryVersion, undefined, (from, to) => {
            relocations.set(JSON.stringify(from), to)
          })
          const isFragment = isThreeZero(entryVersion) && isObject(data) && !getVersionHeader(data)
          if (isObject(data) && (isFragment || relocations.size)) {
            pointerRemaps.set(data, relocations)
          }
          if (isFragment) {
            indexFragment(data, { relocations, path: [] })
          } else {
            indexNodes(data, [])
          }
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
        const relocations = isObject(document) ? pointerRemaps.get(unpackProxyShallow(document)) : undefined
        return relocations
          ? { baseUri: retrievalUri, remapPointer: (pointer) => remapPointer(pointer, relocations) }
          : undefined
      },
      onBeforeNodeProcess: async (node, context): Promise<void> => {
        if (!isThreeZero(entryVersion) || typeof node.$ref !== 'string') {
          return
        }
        const reference = node.$ref
        const source = context.path[0] === 'x-ext' ? context.path : [...basePath, ...context.path]
        const path = paths.get(unpackProxyShallow(node)) ?? source
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
          return getValueAtPath(result.data, targetPath)
        }
        upgradeTarget(await resolveTarget(), path, context.rootNode)
      },
      onAfterNodeProcess: (node, context): void => {
        if (
          !isThreeZero(entryVersion) ||
          (typeof node.$ref !== 'string' && !(context.path.length === 0 && movedFragments))
        ) {
          return
        }
        const root = unpackProxyShallow(context.rootNode)
        const bindings = boundReferences.get(root) ?? new Map<string, BoundReference>()
        if (typeof node.$ref === 'string') {
          const reference = node.$ref
          const resolve = (): unknown => context.resolveReference(reference)?.value
          const raw = unpackProxyShallow(node)
          resolvedReferences.set(raw, resolve)
          const source = context.path[0] === 'x-ext' ? context.path : [...basePath, ...context.path]
          const path = paths.get(raw) ?? source
          const resolved = context.resolveReference(reference)
          if (path[0] !== 'x-ext') {
            upgradeTarget(resolved?.value, path, context.rootNode)
          } else if (fragments.has(raw) && resolved?.value !== undefined) {
            deferredReferences.set(raw, resolved.path)
          }
          const [, fragment] = reference.split('#', 2)
          if (fragment?.startsWith('/x-ext/')) {
            const field = [...source, '$ref']
            bindings.set(JSON.stringify(field), { field, reference })
            boundReferences.set(root, bindings)
          }
        }
        if (context.path.length === 0 && movedFragments) {
          // Earlier edges may already point into the pre-upgrade layout. Rewrite only
          // reference fields the bundler processed, including edges from prior lazy calls.
          for (const [key, { field, reference }] of [...bindings]) {
            const currentField = remapBundlePath(root, field)
            const owner = getValueAtPath(root, currentField.slice(0, -1))
            bindings.delete(key)
            if (!isObject(owner) || owner.$ref !== reference) {
              continue
            }
            const [uri, authoredFragment = ''] = reference.split('#', 2)
            const pointer = decodeUriFragment(authoredFragment).slice(1).split('/').map(unescapeJsonPointerSegment)
            const target = remapBundlePath(root, pointer)
            const updatedReference =
              target === pointer
                ? reference
                : `${uri}#/${target.map((key) => encodeURIComponent(escapeJsonPointer(key))).join('/')}`
            if (updatedReference !== reference) {
              owner.$ref = updatedReference
            }
            bindings.set(JSON.stringify(currentField), { field: currentField, reference: updatedReference })
          }
        }
      },
    },
  ]
}
