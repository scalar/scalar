import { defineConfig } from 'cva'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Tailwind Merge Config
 *
 * By default tailwind merge only knows about the default tailwind classes
 * this is because it does not load in the tailwind config at runtime (perf reasons)
 * we must specify any custom classes if they are getting overwritten
 *
 * https://github.com/dcastil/tailwind-merge/blob/v3.4.0/docs/configuration.md#class-groups
 */
const tw = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': ['text-3xs', 'text-xxs'],
      'font-weight': ['font-sidebar', 'font-sidebar-active'],
      // Without this `inset-shadow-border` reads as a color, so `inset-shadow-none` cannot replace it
      'inset-shadow': [{ 'inset-shadow': ['border'] }],
      'max-w': [{ 'max-w': [(value: any) => Boolean(value)] }],
      'w': [{ 'w': [(value: any) => Boolean(value)] }],
    },
  },
})

/**
 * CVA Config
 *
 * https://beta.cva.style/api-reference/#defineconfig
 */
const { cva, cx, compose } = defineConfig({
  hooks: {
    onComplete: (className) => tw(className),
  },
})

export { compose, cva, cx, tw }
