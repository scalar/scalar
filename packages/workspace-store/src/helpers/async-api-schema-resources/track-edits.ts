import { isAsyncApiDocument } from '@/schemas/type-guards'

import { unpackProxyShallow } from '../unpack-proxy'
import { deferSchemaResources } from './resources'
import { getInlineAsyncApiSchemaWrappers } from './schema-wrappers'

/** Nonreactive workspaces have no write hooks, so compare native sources at their next read. */
export const createNativeSchemaEditTracker = (): ((document: object) => boolean) => {
  const snapshots = new WeakMap<object, Map<object, string | undefined>>()
  return (document) => {
    if (!isAsyncApiDocument(document)) return false
    const sources = new Map<object, string | undefined>()
    for (const wrapper of getInlineAsyncApiSchemaWrappers(document)) {
      const node = unpackProxyShallow(wrapper)
      if (typeof wrapper.schemaFormat !== 'string' || !deferSchemaResources(wrapper.schemaFormat, '/')) continue
      try {
        sources.set(node, JSON.stringify([wrapper.schemaFormat, wrapper.schema]))
      } catch {
        // Cyclic source already stays on the source-only path; removing its cycle changes this snapshot.
        sources.set(node, undefined)
      }
    }
    const identity = unpackProxyShallow(document)
    const previous = snapshots.get(identity)
    snapshots.set(identity, sources)
    // New chunks can introduce more schemas without invalidating existing downloads or their budgets.
    return (
      previous !== undefined &&
      [...previous].some(([node, source]) => !sources.has(node) || sources.get(node) !== source)
    )
  }
}
