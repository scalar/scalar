import type { Spec } from '@scalar/types/legacy'
import type { FuseResult } from 'fuse.js'
import { type Ref, computed, ref, watch } from 'vue'
import { createFuseInstance } from '../helpers/create-fuse-instance'
import { createSearchIndex } from '../helpers/create-search-index'
import type { FuseData } from '../types'

const MAX_SEARCH_RESULTS = 25

/**
 * Creates the search index from an OpenAPI document.
 */
export function useSearchIndex({
  specification,
}: {
  specification: Ref<Spec>
}) {
  const fuseDataArray = ref<FuseData[]>([])
  const searchResults = ref<FuseResult<FuseData>[]>([])
  const selectedSearchIndex = ref<number>()
  const searchText = ref<string>('')

  const fuse = createFuseInstance()

  // Keep the index up to date
  watch(
    specification,
    (newSpec) => {
      // TODO: Add actual data here
      const index = createSearchIndex([])

      fuse.setCollection(index)
    },
    { immediate: true },
  )

  const fuseSearch = (): void => {
    selectedSearchIndex.value = 0
    searchResults.value = fuse.search(searchText.value)
  }

  watch(searchText, (newValue) => {
    if (newValue.length) {
      fuseSearch()
    } else {
      searchResults.value = []
    }
  })

  function resetSearch(): void {
    searchText.value = ''
    selectedSearchIndex.value = undefined
    searchResults.value = []
  }

  const searchResultsWithPlaceholderResults = computed<FuseResult<FuseData>[]>((): FuseResult<FuseData>[] => {
    if (searchText.value.length === 0) {
      // Show a few results before we query fuse
      return fuseDataArray.value.slice(0, MAX_SEARCH_RESULTS).map((item) => {
        return {
          item: item,
        } as FuseResult<FuseData>
      })
    }

    return searchResults.value.slice(0, MAX_SEARCH_RESULTS)
  })

  const selectedSearchResult = computed<FuseResult<FuseData> | undefined>(() =>
    typeof selectedSearchIndex.value === 'number'
      ? searchResultsWithPlaceholderResults.value[selectedSearchIndex.value]
      : undefined,
  )

  return {
    resetSearch,
    fuseSearch,
    selectedSearchIndex,
    selectedSearchResult,
    searchResultsWithPlaceholderResults,
    searchText,
  }
}
