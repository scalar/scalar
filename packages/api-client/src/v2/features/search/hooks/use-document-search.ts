import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { FuseResult } from 'fuse.js'
import { type MaybeRefOrGetter, computed, ref, toValue } from 'vue'

import { createFuseInstance } from '../helpers/create-fuse-instance'
import { createSearchIndex } from '../helpers/create-search-index'
import type { FuseData } from '../types'

const MAX_SEARCH_RESULTS = 25

/**
 * Fuzzy search scoped to a single OpenAPI document.
 *
 * Mirrors the behaviour of the reference search modal (`@scalar/api-reference`)
 * but stays local to api-client so the two packages do not have a circular
 * dependency. The index is rebuilt whenever the source document changes.
 *
 * When the query is empty we surface the first `MAX_SEARCH_RESULTS` entries of
 * the index as a zero-state list, matching the reference UX.
 */
export function useDocumentSearch(document: MaybeRefOrGetter<OpenApiDocument | undefined>) {
  const searchIndex = computed<FuseData[]>(() => {
    const doc = toValue(document)
    return doc ? createSearchIndex([doc]) : []
  })

  const fuse = computed(() => {
    const instance = createFuseInstance()
    instance.setCollection(searchIndex.value)
    return instance
  })

  const query = ref<string>('')

  const results = computed<FuseResult<FuseData>[]>(() => {
    if (query.value.length !== 0) {
      return fuse.value.search(query.value, { limit: MAX_SEARCH_RESULTS })
    }

    return searchIndex.value.slice(0, MAX_SEARCH_RESULTS).map(
      (item, index) =>
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
