import { isObject } from '@scalar/helpers/object/is-object'

import { isAsyncApiDocument } from '@/schemas/type-guards'

import { unpackProxyShallow } from '../unpack-proxy'
import { deferSchemaResources } from './resources'
import { getInlineAsyncApiSchemaWrappers } from './schema-wrappers'

/** Compare effective native sources at stable locations while allowing newly loaded chunks. */
export const createNativeSchemaEditTracker = (): ((document: object) => boolean) => {
  const snapshots = new WeakMap<object, Map<string, string | undefined>>()
  return (document) => {
    if (!isAsyncApiDocument(document)) return false
    const sources = new Map<string, string | undefined>()
    for (const { node: wrapper, path } of getInlineAsyncApiSchemaWrappers(document)) {
      const position = JSON.stringify(path)
      if (typeof wrapper.schemaFormat !== 'string' || !deferSchemaResources(wrapper.schemaFormat, '/')) continue
      const resources = wrapper['x-scalar-schema-resources']
      const origin = isObject(resources) && typeof resources.origin === 'string' ? resources.origin : undefined
      try {
        sources.set(position, JSON.stringify([wrapper.schemaFormat, wrapper.schema, origin]))
      } catch {
        // Cyclic source already stays on the source-only path; removing its cycle changes this snapshot.
        sources.set(position, undefined)
      }
    }
    const identity = unpackProxyShallow(document)
    const previous = snapshots.get(identity)
    snapshots.set(identity, sources)
    // New chunks can introduce more schemas without invalidating existing downloads or their budgets.
    return (
      previous !== undefined &&
      [...previous].some(([position, source]) => !sources.has(position) || sources.get(position) !== source)
    )
  }
}
