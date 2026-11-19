import { isObject } from '@scalar/helpers/object/is-object'

/** Retain only upgrade bookkeeping needed by references that still load external resources. */
export const compactUpgradeMetadata = (document: Record<string, unknown>): void => {
  const metadata = document['x-scalar-upgrade']
  if (!isObject(metadata)) {
    return
  }

  const references: string[][] = []
  const visited = new WeakSet<object>()
  const visit = (value: unknown, path: string[]): void => {
    if (value === null || typeof value !== 'object' || visited.has(value)) {
      return
    }
    visited.add(value)
    if (isObject(value) && typeof value.$ref === 'string' && !value.$ref.startsWith('#')) {
      references.push(path)
    }
    for (const [key, child] of Object.entries(value)) {
      if (key !== 'x-scalar-upgrade' && key !== 'x-ext' && key !== 'x-ext-urls') {
        visit(child, [...path, key])
      }
    }
  }
  visit(document, [])
  if (references.length === 0) {
    delete document['x-scalar-upgrade']
    return
  }

  // External resources can refer back to relocated entry targets. Keep those mappings,
  // but descendants that follow the same prefix substitution need no separate entry.
  const mappings = new Map<string, readonly string[]>()
  if (Array.isArray(metadata.locations)) {
    // upgradeFragment records parents before visiting their children. Preserve that order:
    // descendant mappings can only be omitted after their inherited prefix is known.
    metadata.locations = metadata.locations.filter((location) => {
      if (!isObject(location) || !Array.isArray(location.source) || !Array.isArray(location.output)) {
        return false
      }
      const source = location.source as string[]
      const output = location.output as string[]
      const key = JSON.stringify(source)
      // Multiple media types can copy one source; the resolver uses its first destination.
      if (mappings.has(key)) {
        return false
      }
      mappings.set(key, output)
      for (let length = source.length - 1; length >= 0; length--) {
        const parent = mappings.get(JSON.stringify(source.slice(0, length)))
        if (parent) {
          if (JSON.stringify([...parent, ...source.slice(length)]) === JSON.stringify(output)) {
            return false
          }
          break
        }
      }
      return true
    })
  }
  if (Array.isArray(metadata.contexts)) {
    const contexts = metadata.contexts.filter((context) => {
      const prefix = isObject(context) ? context.path : undefined
      return Array.isArray(prefix) && references.some((path) => prefix.every((part, index) => path[index] === part))
    })
    if (contexts.length === 0) {
      delete metadata.contexts
    } else {
      metadata.contexts = contexts
    }
  }
}
