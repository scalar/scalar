import type Fuse from 'fuse.js'
import { type ShallowRef, shallowRef } from 'vue'

type FuseConstructor = typeof Fuse

/**
 * fuse.js, once it has loaded.
 *
 * The environment-variable dropdown only needs fuzzy matching once someone opens it, so it imports
 * fuse.js on demand. Search still imports fuse.js statically, so the API Reference and the API Client
 * load it up front today; this pays off once search loads it on demand too. Shared between dropdowns
 * so it loads once.
 */
const fuse = shallowRef<FuseConstructor | null>(null)

let loading: Promise<void> | null = null

/** The fuse.js constructor, or `null` until {@link loadFuse} has resolved. */
export const useFuse = (): Readonly<ShallowRef<FuseConstructor | null>> => fuse

/**
 * Loads fuse.js. Concurrent calls share one import, and a failed import is logged and retried on the
 * next call, so a dropdown keeps working (with plain substring matching) rather than breaking when the
 * chunk fails to load. Never rejects.
 */
export const loadFuse = (): Promise<void> => {
  if (fuse.value) {
    return Promise.resolve()
  }

  loading ??= import('fuse.js').then(
    (module) => {
      fuse.value = module.default
    },
    (error: unknown) => {
      console.warn('[loadFuse] Failed to load fuse.js, falling back to plain matching', error)
      loading = null
    },
  )

  return loading
}
