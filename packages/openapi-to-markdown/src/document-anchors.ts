import { slugger } from '@scalar/helpers/string/slugger'
import type { Html } from 'mdast'

/** One export owns its destinations, so repeated titles and concurrent renders cannot collide. */
export const createDocumentAnchors = (): {
  get: (kind: string, identity: string, label?: string) => string
} => {
  const slugs = slugger()
  const ids = new Map<string, string>()
  const used = new Set<string>()
  return {
    get: (kind, identity, label = identity) => {
      const key = JSON.stringify([kind, identity])
      const previous = ids.get(key)
      if (previous !== undefined) {
        return previous
      }
      const base = `scalar-${kind}-${label}`
      let id = slugs.slug(base)
      // A literal suffix in a later name can collide with the slugger's numeric suffix.
      while (used.has(id)) {
        id = slugs.slug(base)
      }
      used.add(id)
      ids.set(key, id)
      return id
    },
  }
}

/** Explicit destinations do not depend on a Markdown viewer's heading slug rules. */
export const anchor = (id: string): Html => ({ type: 'html', value: `<a id="${id}"></a>` })
