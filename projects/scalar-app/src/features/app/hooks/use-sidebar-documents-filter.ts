import { type MaybeRefOrGetter, computed, toValue } from 'vue'

import { useRegistryNamespaceDocumentFilter } from '@/features/app/hooks/use-registry-namespace-document-filter'
import type { SidebarDocumentItem } from '@/features/app/hooks/use-sidebar-documents'
import { useTitleDocumentFilter } from '@/features/app/hooks/use-title-document-filter'

type UseSidebarDocumentsFilterArgs = {
  pinned: MaybeRefOrGetter<SidebarDocumentItem[]>
  rest: MaybeRefOrGetter<SidebarDocumentItem[]>
  isTeamWorkspace: MaybeRefOrGetter<boolean>
}

/**
 * Title fuzzy filter plus optional registry namespace scope for the app
 * sidebar document list (team workspaces only for the namespace UI).
 *
 * Composes {@link useTitleDocumentFilter} with
 * {@link useRegistryNamespaceDocumentFilter} and merges their outputs for the
 * sidebar template.
 */
export const useSidebarDocumentsFilter = ({ pinned, rest, isTeamWorkspace }: UseSidebarDocumentsFilterArgs) => {
  const titleFilter = useTitleDocumentFilter(rest)
  const namespaceFilter = useRegistryNamespaceDocumentFilter({
    pinned,
    rest,
    isTeamWorkspace,
    titleFilterVisible: () => titleFilter.isVisible.value,
  })

  const displayRestDocuments = computed(() => namespaceFilter.applyNamespaceFilter(titleFilter.filteredItems.value))
  const displayPinnedDocuments = computed(() => namespaceFilter.applyNamespaceFilter(toValue(pinned)))

  return {
    registryScopeLabelId: namespaceFilter.registryScopeLabelId,
    isFilterVisible: titleFilter.isVisible,
    filterQuery: titleFilter.query,
    toggleFilter: titleFilter.toggle,
    filterNamespaceId: namespaceFilter.filterNamespaceId,
    showNamespaceFilterRow: namespaceFilter.showNamespaceFilterRow,
    namespaceFilterOptions: namespaceFilter.namespaceFilterOptions,
    namespaceFilterTriggerLabel: namespaceFilter.namespaceFilterTriggerLabel,
    displayRestDocuments,
    displayPinnedDocuments,
  }
}
