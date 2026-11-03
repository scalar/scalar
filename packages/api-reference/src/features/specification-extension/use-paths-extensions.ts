import { type ComputedRef, computed } from 'vue'

import { getXKeysFromObject } from './helpers'

const extensionsByPaths = new WeakMap<Record<string, unknown>, ComputedRef<Record<string, unknown>>>()

/** Share reactive extension extraction across operations without retaining discarded documents. */
export const usePathsExtensions = (
  getPaths: () => Record<string, unknown> | undefined,
): ComputedRef<Record<string, unknown>> =>
  computed(() => {
    const paths = getPaths()
    if (!paths) {
      return {}
    }
    const cached = extensionsByPaths.get(paths)
    if (cached) {
      return cached.value
    }
    const extensions = computed(() => getXKeysFromObject(paths))
    extensionsByPaths.set(paths, extensions)
    return extensions.value
  })
