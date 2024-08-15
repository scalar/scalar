import { useWorkspace } from '@/store/workspace'
import type { Request } from '@scalar/oas-utils/entities/workspace/spec'
import Fuse, { type FuseResult } from 'fuse.js'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Hook for managing search functionality.
 * Provides search state, results, and methods for searching.
 */
export function useSearch() {
  const router = useRouter()
  const { activeWorkspaceRequests } = useWorkspace()

  type FuseData = {
    title: string
    description: string
    httpVerb: string
    id: string
    path: string
  }

  const fuseDataArray = ref<FuseData[]>([])
  const searchResults = ref<FuseResult<FuseData>[]>([])
  const selectedSearchResult = ref<number>(0)
  const searchText = ref<string>('')
  const searchInputRef = ref<HTMLInputElement | null>(null)

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

  const populateFuseDataArray = (requests: Request[]) => {
    fuseDataArray.value = requests.map((request: Request) => ({
      id: request.uid,
      title: request.summary ?? request.method,
      description: request.description ?? '',
      httpVerb: request.method,
      path: request.path,
    }))
    fuse.setCollection(fuseDataArray.value)
  }

  const fuseSearch = (): void => {
    selectedSearchResult.value = 0
    searchResults.value = fuse.search(searchText.value)
  }

  // Populate our fuseDataArray with the request items
  watch(
    activeWorkspaceRequests,
    (newRequests) => {
      populateFuseDataArray(newRequests)
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
  }
}
