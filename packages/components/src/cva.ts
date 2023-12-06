import { defineConfig } from 'cva'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Tailwind Merge Config
 *
 * By default tailwind merge only knows about the default tailwind clasess
 * this is because it does not load in the tailwind config at runtime (perf reasons)
 * we must specify any custom classes if they are getting overwritten
 *
 * https://github.com/dcastil/tailwind-merge/blob/v2.0.0/docs/configuration.md#class-groups
 */
const tw = extendTailwindMerge({})

/**
 * CVA Config
 *
 * https://beta.cva.style/api-reference/#defineconfig
 */
const { cva, cx, compose } = defineConfig({
  hooks: {
    onComplete: (className) => `${tw(className)} scalar-reset`,
  },
})

export { cva, cx, compose, tw }
