import { Buffer } from 'node:buffer'

import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'

/** Maximum size of a group of components normally consumed by the same parent. */
const GROUP_MAX_BYTES = 64 * 1024

/** Groups components with the same referring parents, bounding incidental model-page transfer. */
export const asyncApiChunkGroups = (document: Record<string, unknown>): Map<string, string> => {
  const parents = new Map<string, Set<string>>()
  const components = document.components as Record<string, Record<string, unknown>> | undefined
  const collections: Record<string, Record<string, unknown>> = {
    channels: (document.channels ?? {}) as Record<string, unknown>,
    operations: (document.operations ?? {}) as Record<string, unknown>,
    ...Object.fromEntries(
      Object.entries(components ?? {})
        .filter(([, value]) => value && typeof value === 'object')
        .map(([type, entries]) => [`components-${type}`, entries]),
    ),
  }
  const walk = (value: unknown, source: string): void => {
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      if (key === '$ref' && typeof child === 'string' && child.startsWith('#/')) {
        const [collection, typeOrName, name] = parseJsonPointerSegments(child.slice(1))
        const target = collection === 'components' ? `components-${typeOrName}/${name}` : `${collection}/${typeOrName}`
        if (target !== source) {
          const references = parents.get(target) ?? new Set<string>()
          references.add(source)
          parents.set(target, references)
        }
      } else walk(child, source)
    }
  }
  for (const [section, entries] of Object.entries(collections)) {
    for (const [name, value] of Object.entries(entries)) walk(value, `${section}/${name}`)
  }
  const groups = new Map<string, string>()
  for (const [section, entries] of Object.entries(collections)) {
    const buckets = new Map<string, { id: string; bytes: number }>()
    let group = 0
    for (const [name, value] of Object.entries(entries)) {
      if (!section.startsWith('components-')) continue
      const sources = parents.get(`${section}/${name}`)
      const signature = sources?.size ? `parents:${JSON.stringify([...sources].sort())}` : `orphan:${name}`
      const bytes = Buffer.byteLength(JSON.stringify({ [name]: value })) + 1
      const previous = buckets.get(signature)
      const bucket =
        previous && previous.bytes + bytes <= GROUP_MAX_BYTES ? previous : { id: `group-${group++}`, bytes: 0 }
      bucket.bytes += bytes
      buckets.set(signature, bucket)
      groups.set(`${section}/${name}`, bucket.id)
    }
  }
  return groups
}
