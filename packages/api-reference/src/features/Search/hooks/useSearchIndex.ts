import type { AsyncApiDocument } from '@scalar/workspace-store/schemas/asyncapi/asyncapi-document'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { FuseResult } from 'fuse.js'
import { type MaybeRefOrGetter, computed, ref, toValue } from 'vue'

import { createFuseInstance } from '../helpers/create-fuse-instance'
import { createSearchIndex } from '../helpers/create-search-index'
import type { FuseData } from '../types'

const MAX_SEARCH_RESULTS = 25

/**
 * Creates the search index for the active workspace document. Both OpenAPI
 * and AsyncAPI documents are accepted — the indexer reads `x-scalar-navigation`
 * from either and only touches OpenAPI-specific shapes (paths, schemas) when
 * the navigation entry is an OpenAPI one.
 */
export function useSearchIndex(document: MaybeRefOrGetter<OpenApiDocument | AsyncApiDocument | undefined>) {
  const searchIndex = computed<FuseData[]>(() => createSearchIndex(toValue(document)))

  /** When the document changes we replace the search index */
  const fuse = computed(() => {
    const instance = createFuseInstance()
    instance.setCollection(searchIndex.value)
    return instance
  })

  const query = ref<string>('')

  const results = computed(() => {
    if (query.value.length !== 0) {
      return fuse.value.search(query.value, {
        limit: MAX_SEARCH_RESULTS,
      })
    }

    // Show a few entries as a placeholder
    return searchIndex.value.slice(0, MAX_SEARCH_RESULTS).map(
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
