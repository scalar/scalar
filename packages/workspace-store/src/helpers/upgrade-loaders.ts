import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { isObject, isObjectLike } from '@scalar/helpers/object/is-object'
import { isPollutionKey } from '@scalar/helpers/object/prevent-pollution'
import { setValueAtPath } from '@scalar/helpers/object/set-value-at-path'
import {
  type LoaderPlugin,
  type Plugin,
  type ResolveResult,
  childReferenceContext,
  decodeUriFragment,
  isReferenceContext,
  resolveReferencePath,
} from '@scalar/json-magic/bundle'
import { upgradeFromThreeToThreeOne } from '@scalar/openapi-upgrader/3.0-to-3.1'

import { deepClone } from './deep-clone'
import { retargetExternalReferences, trackExternalReference } from './external-reference-bindings'
import { unpackProxyShallow } from './unpack-proxy'

/** Whether the source uses the OpenAPI 3.0 schema dialect. */
export const isOpenApiThreeZero = (version: unknown): version is string =>
  typeof version === 'string' && version.startsWith('3.0')

const schemaArrayKeywords = new Set(['allOf', 'anyOf', 'oneOf', 'prefixItems'])
const literalDataKeywords = new Set([
  'example',
  'examples',
  'default',
  'enum',
  'const',
  'value',
  'dataValue',
  'serializedValue',
])
type ReferenceContext = Parameters<typeof childReferenceContext>[0]
const classifyPath = (path: readonly string[]): { context: ReferenceContext; literal: boolean } => {
  let context: ReferenceContext = 'object'
  for (const [index, key] of path.entries()) {
    const parent = path[index - 1]
    // Composition arrays inherit the schema context at each index.
    if (context === 'schema' && parent && schemaArrayKeywords.has(parent) && /^\d+$/.test(key)) {
      continue
    }
    context = childReferenceContext(context, key, false)
    if (context === 'data') {
      // An extension can contain schemas reached by explicit pointers. Its unknown
      // context does not make it a literal instance value.
      return { context, literal: literalDataKeywords.has(key) }
    }
  }
  return { context, literal: false }
}
const isReferencePath = (path: readonly string[]): boolean => isReferenceContext(classifyPath(path).context)

const versionHeaders = ['swagger', 'asyncapi', 'openapi'] as const
const getVersionHeader = (data: Record<string, unknown>): (typeof versionHeaders)[number] | undefined =>
  versionHeaders.find((key) => typeof data[key] === 'string')

type RecordRelocation = (from: string[], to: string[]) => void
type Relocations = Map<string, string[]>
type FragmentFile = { relocations: Relocations; key?: string }
type Fragment = { file: FragmentFile; path: string[] }
type ReferenceTarget = { value: unknown; path: readonly string[] }
type DeferredReference = { target: readonly string[]; source: readonly string[] }

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
  const relocations = isObjectLike(file) ? pointerRemaps.get(unpackProxyShallow(file)) : undefined
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
const deferredReferences = new WeakMap<object, DeferredReference>()
const pointerRemaps = new WeakMap<object, Relocations>()

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
    return versionHeader === 'openapi' && isOpenApiThreeZero(data.openapi)
      ? upgradeFromThreeToThreeOne({ ...data }, recordRelocation)
      : data
  }

  if (!isOpenApiThreeZero(entryVersion)) {
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
 * @param onLiteralData - Report literal data roots so coercion can copy them without virtual reference fields.
 */
export const upgradeLoaders = (
  loaders: LoaderPlugin[],
  entryVersion: unknown,
  basePath: readonly string[] = [],
  onLiteralData?: (node: object) => void,
): Plugin[] => {
  const paths = new WeakMap<object, readonly string[]>()
  const movedFiles = new Set<FragmentFile>()
  // Resolvers retain the originating resource and follow current objects after an upgrade replaces children.
  const resolvedReferences = new WeakMap<
    object,
    { resolve: () => ReferenceTarget | undefined; source: readonly string[] }
  >()
  const indexNodes = (value: unknown, path: readonly string[], root?: object, alreadyConverted = false): void => {
    if (value === null || typeof value !== 'object') {
      return
    }
    const raw = unpackProxyShallow(value)
    if (paths.has(raw)) {
      return
    }
    paths.set(raw, path)
    if (alreadyConverted) {
      convertedNodes.add(raw)
    }
    if (root && isObject(value) && typeof value.$ref === 'string' && isReferencePath(path)) {
      const deferred = deferredReferences.get(raw)
      deferredReferences.delete(raw)
      const cached = resolvedReferences.get(raw)
      const fragment = fragments.get(raw)
      const source =
        cached?.source ??
        deferred?.source ??
        (fragment?.file.key !== undefined ? ['x-ext', fragment.file.key, ...fragment.path] : undefined)
      if (source) {
        trackExternalReference(unpackProxyShallow(root), [...source, '$ref'], value.$ref)
      }
      const deferredPath = deferred && remapBundlePath(root, deferred.target)
      const resolved =
        cached?.resolve() ??
        (deferredPath ? { value: getValueAtPath(root, [...deferredPath]), path: deferredPath } : undefined)
      applyReferenceContext(resolved, path, root, value.$global === true)
    }
    for (const [key, child] of Object.entries(raw)) {
      indexNodes(child, [...path, key], root, alreadyConverted)
    }
  }
  const indexFragment = (value: unknown, fragment: Fragment): void => {
    if (value === null || typeof value !== 'object' || fragments.has(value)) {
      return
    }
    fragments.set(value, fragment)
    for (const [key, child] of Object.entries(value)) {
      indexFragment(child, { file: fragment.file, path: [...fragment.path, key] })
    }
  }
  const upgradeTarget = (target: unknown, path: readonly string[], root: object, isChunk = false): void => {
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
    // Server chunks already use 3.1. Their nested external files still need the authored dialect.
    indexNodes(raw, path, root, isChunk)
    if (isChunk) {
      return
    }
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
    // Reading a magic proxy would also copy its virtual `$ref-value` into literal data.
    protectConverted(raw)
    const input = replacements.size ? deepClone(raw, cloneCache) : raw
    const upgraded = upgradeLoadedDocument(input, entryVersion, path, (from, to) => {
      fragment.file.relocations.set(JSON.stringify([...fragment.path, ...from]), [...fragment.path, ...to])
      movedFiles.add(fragment.file)
    })
    if (!isObject(upgraded) || upgraded === raw) {
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
    for (const key of Object.keys(raw)) {
      delete target[key]
    }
    Object.assign(target, upgraded)
    convertedNodes.add(raw)
    for (const [key, child] of Object.entries(target)) {
      indexNodes(child, [...path, key], root)
    }
  }
  const applyReferenceContext = (
    target: ReferenceTarget | undefined,
    path: readonly string[],
    root: object,
    isChunk: boolean,
  ): void => {
    if (!target) {
      return
    }
    if (isObject(target.value) && typeof target.value.$ref === 'string') {
      const raw = unpackProxyShallow(target.value)
      const location = classifyPath(target.path)
      if (!fragments.has(raw) && !paths.has(raw) && location.context === 'data' && !location.literal) {
        // An explicitly referenced extension alias inherits its referring object's kind.
        indexNodes(raw, path, root)
      }
    }
    upgradeTarget(target.value, path, root, isChunk)
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
          if (!result.ok || !(isObject(result.data) || Array.isArray(result.data))) {
            return result
          }
          const header = isObject(result.data) ? getVersionHeader(result.data) : undefined
          const isFragment = !header && isOpenApiThreeZero(entryVersion)
          const upgradesDocument =
            header === 'openapi' && isObject(result.data) && isOpenApiThreeZero(result.data.openapi)
          if (!isFragment && !upgradesDocument) {
            if (isOpenApiThreeZero(entryVersion)) {
              indexNodes(result.data, [])
            }
            return result
          }
          const input = deepClone(result.data)
          const relocations: Relocations = new Map()
          const data = upgradeLoadedDocument(input, entryVersion, undefined, (from, to) => {
            relocations.set(JSON.stringify(from), to)
          })
          if (isObjectLike(data) && (isFragment || relocations.size)) {
            pointerRemaps.set(data, relocations)
          }
          if (isFragment) {
            indexFragment(data, { file: { relocations }, path: [] })
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
        if (!isObjectLike(document)) {
          return undefined
        }
        const raw = unpackProxyShallow(document)
        const relocations = pointerRemaps.get(raw)
        if (!relocations) {
          return undefined
        }
        return {
          baseUri: retrievalUri,
          remapPointer: (pointer) => remapPointer(pointer, relocations),
          visitReferencedSubtrees: fragments.has(raw),
        }
      },
      shouldProcessNode: (node, context) => {
        const raw = unpackProxyShallow(node)
        const indexed = paths.get(raw)
        if (!indexed && !isOpenApiThreeZero(entryVersion)) {
          return true
        }
        const source = context.pathRelativeToInput ? [...basePath, ...context.path] : context.path
        const path = indexed ?? source
        // Unknown portions of shared files can be exposed as schemas by later references.
        const literal = path[0] !== 'x-ext' && classifyPath(path).literal
        if (literal) {
          onLiteralData?.(raw)
        }
        return !literal
      },
      onBeforeNodeProcess: async (node, context): Promise<void> => {
        if (!isOpenApiThreeZero(entryVersion)) {
          return
        }
        const raw = unpackProxyShallow(node)
        const source = context.pathRelativeToInput ? [...basePath, ...context.path] : context.path
        if (source[0] === 'x-ext') {
          const fragment = fragments.get(raw)
          if (fragment && fragment.file.key === undefined) {
            fragment.file.key = source[1]
          }
        }
        if (typeof node.$ref !== 'string') {
          return
        }
        const reference = node.$ref
        const path = paths.get(raw) ?? source
        // Unreferenced portions of a bare file have no known OpenAPI object kind yet.
        if (path[0] === 'x-ext' || !isReferencePath(path)) {
          return
        }
        const [file, authoredFragment = ''] = reference.split('#')
        const fragment = decodeUriFragment(authoredFragment)
        if (fragment && !fragment.startsWith('/')) {
          return
        }
        const resolveTarget = async (): Promise<ReferenceTarget | undefined> => {
          // Absolute and relative document URIs can already resolve in the bundler's registry.
          // Reuse them before invoking a loader, just as we do for fragment-only references.
          const resolved = context.resolveReference(reference)
          if (resolved || !file) {
            return resolved
          }
          const url = resolveReferencePath(context.origin, file)
          const loader = wrapped.find((candidate) => candidate.validate(url))
          const result = await loader?.exec(url)
          if (!result?.ok) {
            return undefined
          }
          const targetPath = fragment ? fragment.slice(1).split('/').map(unescapeJsonPointerSegment) : []
          return { value: getValueAtPath(result.data, targetPath), path: targetPath }
        }
        applyReferenceContext(await resolveTarget(), path, context.rootNode, node.$global === true)
      },
      onAfterNodeProcess: (node, context): void => {
        if (!isOpenApiThreeZero(entryVersion)) {
          return
        }
        const finishedInput = context.pathRelativeToInput && context.path.length === 0
        if (typeof node.$ref !== 'string' && !(finishedInput && movedFiles.size)) {
          return
        }
        const root = unpackProxyShallow(context.rootNode)
        if (typeof node.$ref === 'string') {
          const reference = node.$ref
          const resolve = (): ReferenceTarget | undefined => context.resolveReference(reference)
          const raw = unpackProxyShallow(node)
          const source = context.pathRelativeToInput ? [...basePath, ...context.path] : context.path
          resolvedReferences.set(raw, { resolve, source })
          const path = paths.get(raw) ?? source
          const resolved = resolve()
          if (path[0] !== 'x-ext' && isReferencePath(path)) {
            applyReferenceContext(resolved, path, context.rootNode, node.$global === true)
            trackExternalReference(root, [...source, '$ref'], reference)
          } else if (resolved?.value !== undefined) {
            const location = classifyPath(path)
            if ((path[0] === 'x-ext' && fragments.has(raw)) || (location.context === 'data' && !location.literal)) {
              deferredReferences.set(raw, { target: resolved.path, source })
            }
          }
        }
        if (finishedInput && movedFiles.size) {
          const keys = [...movedFiles].flatMap(({ key }) => (key === undefined ? [] : [key]))
          retargetExternalReferences(root, keys, (path) => remapBundlePath(root, path))
        }
      },
    },
  ]
}
