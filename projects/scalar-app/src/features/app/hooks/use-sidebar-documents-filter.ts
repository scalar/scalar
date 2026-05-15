import { type MaybeRefOrGetter, computed, ref, toValue, useId, watch } from 'vue'

import { useDocumentFilter } from '@/features/app/hooks/use-document-filter'
import type { SidebarDocumentItem } from '@/features/app/hooks/use-sidebar-documents'

/** Sentinel: include every registry namespace in the document list. */
export const FILTER_NAMESPACE_ALL = 'all' as const
/** Sentinel: only workspace-only rows (no registry coordinates). */
export const FILTER_NAMESPACE_LOCAL = '__local__' as const

export type NamespaceFilterId = typeof FILTER_NAMESPACE_ALL | typeof FILTER_NAMESPACE_LOCAL | string

export type NamespaceFilterOption = {
  id: NamespaceFilterId
  label: string
  /** Optional hint (e.g. native `title` on dropdown rows). */
  description?: string
  count: number
}

type UseSidebarDocumentsFilterArgs = {
  pinned: MaybeRefOrGetter<SidebarDocumentItem[]>
  rest: MaybeRefOrGetter<SidebarDocumentItem[]>
  isTeamWorkspace: MaybeRefOrGetter<boolean>
}

/**
 * Title fuzzy filter plus optional registry namespace scope for the app
 * sidebar document list (team workspaces only for the namespace UI).
 */
export const useSidebarDocumentsFilter = ({ pinned, rest, isTeamWorkspace }: UseSidebarDocumentsFilterArgs) => {
  const {
    isVisible: isFilterVisible,
    query: filterQuery,
    filteredItems: filteredRest,
    toggle: toggleFilter,
  } = useDocumentFilter(rest)

  const filterNamespaceId = ref<NamespaceFilterId>(FILTER_NAMESPACE_ALL)

  const namespaceFilterSummary = computed(() => {
    if (!toValue(isTeamWorkspace)) {
      return null
    }
    const docs = [...toValue(pinned), ...toValue(rest)]
    const counts = new Map<string, number>()
    let localCount = 0
    for (const doc of docs) {
      const ns = doc.registry?.namespace
      if (ns) {
        counts.set(ns, (counts.get(ns) ?? 0) + 1)
      } else {
        localCount++
      }
    }
    if (counts.size === 0 && localCount === 0) {
      return null
    }
    const namespaces = [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, count]) => ({ id, label: id, count }))
    return { localCount, namespaces }
  })

  const showNamespaceFilterRow = computed(
    () => isFilterVisible.value && toValue(isTeamWorkspace) && namespaceFilterSummary.value !== null,
  )

  const namespaceFilterOptions = computed((): NamespaceFilterOption[] => {
    const summary = namespaceFilterSummary.value
    if (!summary) {
      return []
    }
    const totalDocs = toValue(pinned).length + toValue(rest).length
    const options: NamespaceFilterOption[] = [{ id: FILTER_NAMESPACE_ALL, label: 'All namespaces', count: totalDocs }]
    for (const ns of summary.namespaces) {
      options.push({ id: ns.id, label: ns.label, count: ns.count })
    }
    if (summary.localCount > 0) {
      options.push({
        id: FILTER_NAMESPACE_LOCAL,
        label: 'Workspace only',
        description: 'Drafts and docs without a registry link',
        count: summary.localCount,
      })
    }
    return options
  })

  const namespaceFilterTriggerLabel = computed(() => {
    const id = filterNamespaceId.value
    const match = namespaceFilterOptions.value.find((o) => o.id === id)
    return match?.label ?? 'All namespaces'
  })

  const applyNamespaceFilter = (items: SidebarDocumentItem[]): SidebarDocumentItem[] => {
    if (!toValue(isTeamWorkspace) || filterNamespaceId.value === FILTER_NAMESPACE_ALL) {
      return items
    }
    if (filterNamespaceId.value === FILTER_NAMESPACE_LOCAL) {
      return items.filter((item) => !item.registry)
    }
    return items.filter((item) => item.registry?.namespace === filterNamespaceId.value)
  }

  const displayRestDocuments = computed(() => applyNamespaceFilter(filteredRest.value))

  const displayPinnedDocuments = computed(() => applyNamespaceFilter(toValue(pinned)))

  watch(isFilterVisible, (open) => {
    if (!open) {
      filterNamespaceId.value = FILTER_NAMESPACE_ALL
    }
  })

  const registryScopeLabelId = useId()

  return {
    registryScopeLabelId,
    isFilterVisible,
    filterQuery,
    toggleFilter,
    filterNamespaceId,
    namespaceFilterSummary,
    showNamespaceFilterRow,
    namespaceFilterOptions,
    namespaceFilterTriggerLabel,
    displayRestDocuments,
    displayPinnedDocuments,
  }
}
