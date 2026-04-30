import { type SlugifyOptions, slugify } from './slugify'

/**
 * Creates a stateful slug generator that tracks previously seen slugs and
 * appends an incrementing numeric suffix to avoid collisions, mirroring the
 * behaviour of `github-slugger`.
 *
 * @example
 * const { slug, reset } = createSlugger()
 * slug('Hello World') // 'hello-world'
 * slug('Hello World') // 'hello-world-1'
 * slug('Hello World') // 'hello-world-2'
 * reset() // Clears the seen slugs
 * slug('Hello World') // 'hello-world'
 */
export const slugger = (options: SlugifyOptions = {}) => {
  const seen = new Map<string, number>()

  return {
    slug(v: string): string {
      const base = slugify(v, options)
      const count = seen.get(base)

      if (count === undefined) {
        seen.set(base, 0)
        return base
      }

      const next = count + 1
      seen.set(base, next)
      return `${base}-${next}`
    },

    reset() {
      seen.clear()
    },
  }
}
