import { isObject } from '@scalar/helpers/object/is-object'

import { unpackProxyShallow } from '../unpack-proxy'
import { deferSchemaResources } from './resources'

/** Nonreactive workspaces have no write hooks, so compare native sources at their next read. */
export const createNativeSchemaEditTracker = (): ((document: object) => boolean) => {
  const snapshots = new WeakMap<object, Map<object, string | undefined>>()
  return (document) => {
    const sources = new Map<object, string | undefined>()
    const seen = new WeakSet<object>()
    const visit = (value: unknown): void => {
      if (!isObject(value) && !Array.isArray(value)) return
      const node = unpackProxyShallow(value)
      if (seen.has(node)) return
      seen.add(node)
      if (isObject(node) && typeof node.schemaFormat === 'string' && deferSchemaResources(node.schemaFormat, '/')) {
        try {
          sources.set(node, JSON.stringify([node.schemaFormat, node.schema]))
        } catch {
          // Cyclic source already stays on the source-only path; removing its cycle changes this snapshot.
          sources.set(node, undefined)
        }
        return
      }
      for (const [key, child] of Object.entries(node)) {
        if (!key.startsWith('x-scalar-') && key !== 'x-ext-urls') visit(child)
      }
    }
    visit(document)
    const previous = snapshots.get(document)
    snapshots.set(document, sources)
    // New chunks can introduce more schemas without invalidating existing downloads or their budgets.
    return (
      previous !== undefined &&
      [...previous].some(([node, source]) => !sources.has(node) || sources.get(node) !== source)
    )
  }
}
