import { useMagicKeys, whenever } from '@vueuse/core'
import type { FuseResult } from 'fuse.js'
import { type Ref, computed } from 'vue'

import type { FuseData } from './useSearchIndex'

/**
 * Use keyboard navigation for search results
 */
export function useKeyboardNavigation({
  active,
  selectedSearchResult,
  searchResultsWithPlaceholderResults,
  onSearchResultClick,
}: {
  active: Ref<boolean>
  selectedSearchResult: Ref<number>
  searchResultsWithPlaceholderResults: Ref<FuseResult<FuseData>[]>
  onSearchResultClick: (entry: FuseResult<FuseData>) => void
}) {
  const keys = useMagicKeys()

  const selectedEntry = computed<FuseResult<FuseData>>(
    () => searchResultsWithPlaceholderResults.value[selectedSearchResult.value],
  )

  // Select
  whenever(keys.enter, () => {
    if (!active) {
      return
    }

    if (!window) {
      return
    }

    onSearchResultClick(selectedEntry.value)
    window.location.hash = selectedEntry.value.item.href
  })

  // Up
  whenever(keys.ArrowDown, () => {
    if (!active) {
      return
    }

    if (!window) {
      return
    }

    if (
      selectedSearchResult.value <
      searchResultsWithPlaceholderResults.value.length - 1
    ) {
      selectedSearchResult.value++
    } else {
      selectedSearchResult.value = 0
    }

    document.getElementById(selectedEntry.value.item.href)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  })

  // Down
  whenever(keys.ArrowUp, () => {
    if (!active) {
      return
    }

    if (!window) {
      return
    }

    if (selectedSearchResult.value > 0) {
      selectedSearchResult.value--
    } else {
      selectedSearchResult.value =
        searchResultsWithPlaceholderResults.value.length - 1
    }

    document.getElementById(selectedEntry.value.item.href)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  })
}
