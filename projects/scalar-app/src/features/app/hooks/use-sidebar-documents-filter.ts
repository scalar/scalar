import type { MaybeRefOrGetter } from 'vue'

import { useMergeDocumentFilterOutputs } from '@/features/app/hooks/use-merge-document-filters'
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
 * Implemented as {@link useTitleDocumentFilter} +
 * {@link useRegistryNamespaceDocumentFilter} composed by
 * {@link useMergeDocumentFilterOutputs}.
 */
export const useSidebarDocumentsFilter = ({ pinned, rest, isTeamWorkspace }: UseSidebarDocumentsFilterArgs) => {
  const titleFilter = useTitleDocumentFilter(rest)
  const namespaceFilter = useRegistryNamespaceDocumentFilter({
    pinned,
    rest,
    isTeamWorkspace,
    titleFilterVisible: () => titleFilter.isVisible.value,
  })

  return useMergeDocumentFilterOutputs({
    titleFilter,
    namespaceFilter,
    pinned,
    titleFilteredRest: titleFilter.filteredItems,
  })
}
