import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { type MaybeRefOrGetter, computed, ref, toValue } from 'vue'

import { createFuseInstance } from '../helpers/create-fuse-instance'
import { createSearchIndex } from '../helpers/create-search-index'

const MAX_SEARCH_RESULTS = 25

/**
 * Creates the search index from an OpenAPI document.
 */
export function useSearchIndex(documents: MaybeRefOrGetter<OpenApiDocument[]>) {
  /** When the document changes we replace the search index */
  const fuse = computed(() => {
    const instance = createFuseInstance()
    instance.setCollection(createSearchIndex(toValue(documents)))
    return instance
  })

  const query = ref<string>('')

  const results = computed(() => {
    if (query.value.length !== 0) {
      return fuse.value.search(query.value, {
        limit: MAX_SEARCH_RESULTS,
      })
    }

    return null
  })

  return {
    results,
    query,
  }
}
