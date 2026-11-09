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
import { upgrade } from '@scalar/openapi-upgrader'

import { deepClone } from './deep-clone'

const isThreeZero = (version: unknown): version is string => typeof version === 'string' && version.startsWith('3.0')

/** Upgrade complete documents immediately, and fragments only at their referring OpenAPI location. */
export const upgradeLoadedDocument = (data: unknown, entryVersion: unknown, path?: readonly string[]): unknown => {
  if (!isObject(data) || 'swagger' in data || 'asyncapi' in data) {
    return data
  }

  if (typeof data.openapi === 'string') {
    return isThreeZero(data.openapi) ? upgrade({ ...data }, '3.1') : data
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
    return getValueAtPath(upgrade(document, '3.1'), contextPath)
  }

  if ('paths' in data || 'components' in data || 'webhooks' in data) {
    const { openapi: _openapi, ...body } = upgrade({ openapi: entryVersion, ...data }, '3.1')
    return body
  }

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
  const fragments = new WeakSet<object>()
  const paths = new WeakMap<object, readonly string[]>()
  const convertedNodes = new WeakSet<object>()
  // Resolvers retain the originating resource and follow current objects after an upgrade replaces children.
  const resolvedReferences = new WeakMap<object, () => unknown>()
  const indexNodes = (value: unknown, path?: readonly string[]): void => {
    if (value === null || typeof value !== 'object' || paths.has(value) || (!path && fragments.has(value))) {
      return
    }
    if (path) {
      paths.set(value, path)
      upgradeTarget(resolvedReferences.get(value)?.(), path)
    } else {
      fragments.add(value)
    }
    for (const [key, child] of Object.entries(value)) {
      indexNodes(child, path ? [...path, key] : undefined)
    }
  }
  const upgradeTarget = (target: unknown, path: readonly string[]): void => {
    if (!isObject(target) || !fragments.has(target) || paths.has(target)) {
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
      if (convertedNodes.has(value)) {
        const token = Symbol()
        replacements.set(token, value)
        cloneCache.set(value, token)
        return
      }
      Object.values(value).forEach(protectConverted)
    }
    protectConverted(target)
    const input = replacements.size ? deepClone(target, cloneCache) : target
    const upgraded = upgradeLoadedDocument(input, entryVersion, path)
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
    convertedNodes.add(target)
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
          const data = upgradeLoadedDocument(input, entryVersion)
          const isFragment =
            isThreeZero(entryVersion) &&
            isObject(data) &&
            data === input &&
            !('openapi' in data || 'swagger' in data || 'asyncapi' in data)
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
      onBeforeNodeProcess: async (node, context): Promise<void> => {
        if (!isThreeZero(entryVersion) || typeof node.$ref !== 'string') {
          return
        }
        const reference = node.$ref
        const path = paths.get(node) ?? [...basePath, ...context.path]
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
          if (!file) {
            return context.resolveReference(reference)?.value
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
        upgradeTarget(await resolveTarget(), path)
      },
      onAfterNodeProcess: (node, context): void => {
        if (!isThreeZero(entryVersion) || typeof node.$ref !== 'string') {
          return
        }
        const reference = node.$ref
        const resolve = (): unknown => context.resolveReference(reference)?.value
        resolvedReferences.set(node, resolve)
        const path = paths.get(node) ?? [...basePath, ...context.path]
        if (path[0] !== 'x-ext') {
          upgradeTarget(resolve(), path)
        }
      },
    },
  ]
}
