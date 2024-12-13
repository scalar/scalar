import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import type { Request } from '@scalar/oas-utils/entities/spec'
import Fuse, { type FuseResult } from 'fuse.js'
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Hook for managing search functionality.
 * Provides search state, results, and methods for searching.
 */
export function useSearch() {
  const router = useRouter()
  const { activeWorkspace, activeWorkspaceRequests } = useActiveEntities()
  const { requests } = useWorkspace()

  type FuseData = {
    title: string
    description: string
    httpVerb: string
    id: string
    path: string
    link: string
  }

  const fuseDataArray = ref<FuseData[]>([])
  const searchResults = ref<FuseResult<FuseData>[]>([])
  const selectedSearchResult = ref<number>(0)
  const searchText = ref<string>('')
  const searchInputRef = ref<HTMLInputElement | null>(null)
  const searchResultRefs = ref<HTMLElement[]>([])

  const fuse = new Fuse(fuseDataArray.value, {
    keys: ['title', 'description', 'body'],
  })

  const resetSearch = () => {
    searchText.value = ''
    selectedSearchResult.value = 0
    searchResults.value = []
    if (searchInputRef.value instanceof HTMLInputElement) {
      searchInputRef.value.blur()
    }
  }

  const populateFuseDataArray = (items: Request[]) => {
    fuseDataArray.value = items.map((request: Request) => ({
      id: request.uid,
      title: request.summary ?? request.method,
      description: request.description ?? '',
      httpVerb: request.method,
      path: request.path,
      // TODO: Use router instead
      link: `/workspace/${activeWorkspace.value?.uid}/request/${request.uid}`,
    }))
    fuse.setCollection(fuseDataArray.value)
  }

  const fuseSearch = (): void => {
    selectedSearchResult.value = 0
    searchResults.value = fuse.search(searchText.value)
  }

  watch(searchText, (newValue) => {
    if (newValue.length) {
      fuseSearch()
    } else {
      searchResults.value = []
    }
  })

  const navigateSearchResults = (direction: 'up' | 'down') => {
    const offset = direction === 'up' ? -1 : 1
    const length = searchResultsWithPlaceholderResults.value.length

    // Ensures we loop around the array by using the remainder
    selectedSearchResult.value =
      (selectedSearchResult.value + offset + length) % length

    // Scroll the selected item into view
    nextTick(() => {
      const element = searchResultRefs.value[selectedSearchResult.value]
      if (element instanceof HTMLElement) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    })
  }

  const selectSearchResult = () => {
    if (selectedSearchResult.value >= 0) {
      const selectedResult =
        searchResultsWithPlaceholderResults.value[selectedSearchResult.value]
      if (selectedResult) {
        onSearchResultClick(selectedResult)
      }
    }
  }

  const validRequests = computed(() =>
    activeWorkspaceRequests.value
      .map((uid) => requests[uid])
      .filter((request) => request !== undefined),
  )

  // Populate our fuseDataArray with the request items
  watch(
    activeWorkspaceRequests,
    () => {
      populateFuseDataArray(validRequests.value)
    },
    { immediate: true },
  )

  const onSearchResultClick = (entry: FuseResult<FuseData>) => {
    router.push(entry.item.id)
    resetSearch()
  }

  const searchResultsWithPlaceholderResults = computed(
    (): FuseResult<FuseData>[] => {
      if (searchText.value.length === 0) {
        return fuseDataArray.value.map((item) => {
          return {
            item: item,
          } as FuseResult<FuseData>
        })
      }

      return searchResults.value
    },
  )

  return {
    searchText,
    searchResultsWithPlaceholderResults,
    selectedSearchResult,
    onSearchResultClick,
    fuseSearch,
    searchInputRef,
    searchResultRefs,
    navigateSearchResults,
    selectSearchResult,
  }
}
