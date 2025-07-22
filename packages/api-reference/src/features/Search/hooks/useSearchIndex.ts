import type { createSidebar } from '@/features/sidebar'
import type { FuseResult } from 'fuse.js'
import { computed, ref, toValue, watch } from 'vue'
import { createFuseInstance } from '../helpers/create-fuse-instance'
import { createSearchIndex } from '../helpers/create-search-index'
import type { FuseData } from '../types'

const MAX_SEARCH_RESULTS = 25

/**
 * Creates the search index from an OpenAPI document.
 */
export function useSearchIndex(items: ReturnType<typeof createSidebar>['items']) {
  const fuse = createFuseInstance()

  const selectedIndex = ref<number>()

  // Keep the search searchIndex up to date.
  watch(
    items,
    () => {
      const { entries } = toValue(items)
      const newSearchIndex = createSearchIndex(entries)
      fuse.setCollection(newSearchIndex)
    },
    { immediate: true },
  )

  // Watch the search query to trigger a search.
  const query = ref<string>('')

  watch(query, (newValue) => {
    if (newValue.length) {
      _search()

      return
    }

    resetSearch()
  })

  /**
   * Resets the search state.
   */
  function resetSearch(): void {
    query.value = ''
    selectedIndex.value = undefined
    searchResults.value = []
  }

  /**
   * Actually search the index.
   */

  const searchResults = ref<FuseResult<FuseData>[]>([])
  const _search = (): void => {
    // Reset the selected index
    selectedIndex.value = 0

    // Let fuse search the index
    searchResults.value = fuse.search(query.value, {
      limit: MAX_SEARCH_RESULTS,
    })
  }

  /**
   * Returns the search results.
   *
   * But if the query is empty, it returns the first entries from the fuse index.
   */
  const searchResultsWithPlaceholderResults = computed<FuseResult<FuseData>[]>(() => {
    // Show the search results from fuse
    if (query.value.length !== 0) {
      return searchResults.value
    }

    // @ts-expect-error - _docs is a private property
    const allEntries = fuse._docs

    // Show a few entries as a placeholder
    return allEntries.slice(0, MAX_SEARCH_RESULTS).map((item: FuseData, index: number) => ({
      item,
      refIndex: index,
    }))
  })

  /**
   * The currently selected search result.
   */
  const selectedSearchResult = computed<FuseResult<FuseData> | undefined>(() =>
    typeof selectedIndex.value === 'number'
      ? searchResultsWithPlaceholderResults.value[selectedIndex.value]
      : undefined,
  )

  return {
    resetSearch,
    selectedIndex,
    selectedSearchResult,
    searchResultsWithPlaceholderResults,
    query,
  }
}
