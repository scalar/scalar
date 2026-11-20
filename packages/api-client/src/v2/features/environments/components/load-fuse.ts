import type Fuse from 'fuse.js'
import { type ShallowRef, shallowRef } from 'vue'

type FuseConstructor = typeof Fuse

/**
 * fuse.js, once it has loaded.
 *
 * The environment-variable dropdown is the only place in the API Reference that needs fuzzy
 * matching outside of search, and only once someone opens it, so fuse.js stays out of the bundle
 * a page loads up front. Shared between dropdowns so it loads once.
 */
const fuse = shallowRef<FuseConstructor | null>(null)

let loading: Promise<void> | null = null

/** The fuse.js constructor, or `null` until {@link loadFuse} has resolved. */
export const useFuse = (): Readonly<ShallowRef<FuseConstructor | null>> => fuse

/**
 * Loads fuse.js. Concurrent calls share one import, and a failed import is retried on the next
 * call, so a dropdown keeps working (unfiltered) rather than breaking when the chunk fails to load.
 */
export const loadFuse = (): Promise<void> => {
  if (fuse.value) {
    return Promise.resolve()
  }

  loading ??= import('fuse.js').then(
    (module) => {
      fuse.value = module.default
    },
    () => {
      loading = null
    },
  )

  return loading
}
