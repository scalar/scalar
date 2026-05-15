import { type ComputedRef, type MaybeRefOrGetter, type Ref, computed, toValue } from 'vue'

import type {
  NamespaceFilterId,
  NamespaceFilterOption,
} from '@/features/app/hooks/use-registry-namespace-document-filter'

/**
 * Slice returned by {@link useTitleDocumentFilter} for composition with other
 * filters without coupling merge logic to that hook's implementation.
 */
export type TitleDocumentFilterSlice<T> = {
  isVisible: Ref<boolean>
  query: Ref<string>
  filteredItems: ComputedRef<T[]>
  toggle: () => void
  reset: () => void
}

/**
 * Slice returned by {@link useRegistryNamespaceDocumentFilter} for merging
 * with a title filter (or any other primary filter that drives visibility).
 */
export type RegistryNamespaceFilterSlice<T> = {
  registryScopeLabelId: string
  filterNamespaceId: Ref<NamespaceFilterId>
  namespaceFilterSummary: ComputedRef<{
    localCount: number
    namespaces: { id: string; label: string; count: number }[]
  } | null>
  showNamespaceFilterRow: ComputedRef<boolean>
  namespaceFilterOptions: ComputedRef<NamespaceFilterOption[]>
  namespaceFilterTriggerLabel: ComputedRef<string>
  applyNamespaceFilter: (items: T[]) => T[]
}

type UseMergeDocumentFilterOutputsArgs<T> = {
  titleFilter: TitleDocumentFilterSlice<T>
  namespaceFilter: RegistryNamespaceFilterSlice<T>
  pinned: MaybeRefOrGetter<T[]>
  /** Usually `titleFilter.filteredItems` when the title pass runs on `rest` only. */
  titleFilteredRest: ComputedRef<T[]>
}

/**
 * Merges a title filter slice with a registry-namespace slice into the shape
 * the sidebar template expects: shared visibility/query controls, namespace
 * dropdown state, and pinned/rest lists after both passes.
 */
export const useMergeDocumentFilterOutputs = <T>({
  titleFilter,
  namespaceFilter,
  pinned,
  titleFilteredRest,
}: UseMergeDocumentFilterOutputsArgs<T>) => {
  const displayRestDocuments = computed(() => namespaceFilter.applyNamespaceFilter(titleFilteredRest.value))

  const displayPinnedDocuments = computed(() => namespaceFilter.applyNamespaceFilter(toValue(pinned)))

  return {
    registryScopeLabelId: namespaceFilter.registryScopeLabelId,
    isFilterVisible: titleFilter.isVisible,
    filterQuery: titleFilter.query,
    toggleFilter: titleFilter.toggle,
    filterNamespaceId: namespaceFilter.filterNamespaceId,
    namespaceFilterSummary: namespaceFilter.namespaceFilterSummary,
    showNamespaceFilterRow: namespaceFilter.showNamespaceFilterRow,
    namespaceFilterOptions: namespaceFilter.namespaceFilterOptions,
    namespaceFilterTriggerLabel: namespaceFilter.namespaceFilterTriggerLabel,
    displayRestDocuments,
    displayPinnedDocuments,
  }
}
