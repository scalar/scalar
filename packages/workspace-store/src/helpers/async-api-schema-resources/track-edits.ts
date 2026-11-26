import { isObject } from '@scalar/helpers/object/is-object'

import { isAsyncApiDocument } from '@/schemas/type-guards'

import { isOverridesProxyObject, unpackOverridesProxy } from '../overrides-proxy'
import { unpackProxyShallow } from '../unpack-proxy'
import { deferSchemaResources } from './resources'
import { getInlineAsyncApiSchemaWrappers } from './schema-wrappers'

/** Cyclic source remains on the source-only path until the cycle is removed. */
const sourceSnapshot = (wrapper: Record<string, unknown>): string | undefined => {
  const resources = wrapper['x-scalar-schema-resources']
  const origin = isObject(resources) && typeof resources.origin === 'string' ? resources.origin : undefined
  try {
    return JSON.stringify([wrapper.schemaFormat, wrapper.schema, origin])
  } catch {
    return undefined
  }
}

/** Compare effective native sources at stable locations while allowing newly loaded chunks. */
export const createNativeSchemaEditTracker = (): ((document: object) => boolean) => {
  const snapshots = new WeakMap<object, Map<string, string | undefined>>()
  return (document) => {
    if (!isAsyncApiDocument(document)) return false
    const identity = unpackProxyShallow(document)
    const previous = snapshots.get(identity)
    const sources = new Map<string, string | undefined>()
    let overriddenNewSource = false
    for (const { node: wrapper, path } of getInlineAsyncApiSchemaWrappers(document)) {
      if (typeof wrapper.schemaFormat !== 'string' || !deferSchemaResources(wrapper.schemaFormat, '/')) continue
      const position = JSON.stringify(path)
      const source = sourceSnapshot(wrapper)
      sources.set(position, source)
      // A new chunk may already have overrides; its prepared files describe the original source.
      if (
        !previous?.has(position) &&
        isOverridesProxyObject(wrapper) &&
        source !== sourceSnapshot(unpackOverridesProxy(wrapper))
      )
        overriddenNewSource = true
    }
    snapshots.set(identity, sources)
    // New chunks can introduce unchanged schemas without invalidating shared downloads or budgets.
    return (
      overriddenNewSource ||
      (previous !== undefined &&
        [...previous].some(([position, source]) => !sources.has(position) || sources.get(position) !== source))
    )
  }
}
