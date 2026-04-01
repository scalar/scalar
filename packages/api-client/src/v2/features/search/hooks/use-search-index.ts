import type { Item } from '@scalar/sidebar'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { type MaybeRefOrGetter, computed, ref, shallowRef, toValue, watch } from 'vue'

import { createFuseInstance } from '../helpers/create-fuse-instance'
import { createSearchIndex } from '../helpers/create-search-index'

const MAX_SEARCH_RESULTS = 25

/**
 * Creates the search index from multiple OpenAPI documents
 */
export const useSearchIndex = (
  documents: MaybeRefOrGetter<OpenApiDocument[]>,
  enabled: MaybeRefOrGetter<boolean> = true,
) => {
  const fuse = shallowRef<ReturnType<typeof createFuseInstance> | null>(null)

  watch(
    [() => toValue(documents), () => toValue(enabled)],
    async ([nextDocuments, isEnabled]) => {
      if (!isEnabled) {
        return
      }

      if (!fuse.value) {
        const { default: Fuse } = await import('fuse.js')
        fuse.value = createFuseInstance(Fuse)
      }

      fuse.value.setCollection(createSearchIndex(nextDocuments))
    },
    { immediate: true },
  )

  const query = ref<string>('')

  const results = computed<Item[] | null>(() => {
    if (!fuse.value) {
      return null
    }

    if (query.value.length !== 0) {
      const fuseResults = fuse.value.search(query.value, {
        limit: MAX_SEARCH_RESULTS,
      })

      // Lets only show operations for now to match previous behavior
      return fuseResults.flatMap((result) => {
        if (result.item.entry.type !== 'operation') {
          return []
        }

        return result.item.entry
      })
    }

    return null
  })

  return {
    results,
    query,
  }
}
