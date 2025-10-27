import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { FuseResult } from 'fuse.js'
import { type MaybeRefOrGetter, computed, ref, toValue } from 'vue'

import { createFuseInstance } from '../helpers/create-fuse-instance'
import { createSearchIndex } from '../helpers/create-search-index'
import type { FuseData } from '../types'

const MAX_SEARCH_RESULTS = 25

/**
 * Creates the search index from an OpenAPI document.
 */
export function useSearchIndex(document: MaybeRefOrGetter<OpenApiDocument | undefined>) {
  /** When the document changes we replace the search index */
  const fuse = computed(() => {
    const instance = createFuseInstance()
    instance.setCollection(createSearchIndex(toValue(document)))
    return instance
  })

  const query = ref<string>('')

  const results = computed(() => {
    if (query.value.length !== 0) {
      return fuse.value.search(query.value, {
        limit: MAX_SEARCH_RESULTS,
      })
    }

    // @ts-expect-error - _docs is a private property
    const allEntries: FuseData[] = fuse.value._docs

    // Show a few entries as a placeholder
    return allEntries.slice(0, MAX_SEARCH_RESULTS).map(
      (item: FuseData, index: number) =>
        ({
          item,
          refIndex: index,
        }) satisfies FuseResult<FuseData>,
    )
  })

  return {
    results,
    query,
  }
}
