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

type RegistryNamespaceSummary = {
  localCount: number
  namespaces: { id: string; label: string; count: number }[]
}

type RegistryNamespaceDoc = {
  registry?: { namespace: string }
}

/**
 * Counts registry namespaces and workspace-only rows across the combined
 * pinned + rest lists. Returns `null` when there is nothing to filter.
 */
export const summarizeRegistryNamespaces = <T extends RegistryNamespaceDoc>(
  docs: T[],
): RegistryNamespaceSummary | null => {
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
}

export const buildNamespaceFilterOptions = (
  summary: RegistryNamespaceSummary,
  totalDocs: number,
): NamespaceFilterOption[] => {
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
}

export const resolveNamespaceFilterTriggerLabel = (
  filterNamespaceId: NamespaceFilterId,
  options: NamespaceFilterOption[],
): string => options.find((o) => o.id === filterNamespaceId)?.label ?? 'All namespaces'

/**
 * Narrows a list by the selected registry namespace scope. No-ops when the
 * workspace is not a team workspace or the sentinel is "all".
 */
export const filterItemsByRegistryNamespace = <T extends RegistryNamespaceDoc>(
  items: T[],
  filterNamespaceId: NamespaceFilterId,
  isTeamWorkspace: boolean,
): T[] => {
  if (!isTeamWorkspace || filterNamespaceId === FILTER_NAMESPACE_ALL) {
    return items
  }
  if (filterNamespaceId === FILTER_NAMESPACE_LOCAL) {
    return items.filter((item) => !item.registry)
  }
  return items.filter((item) => item.registry?.namespace === filterNamespaceId)
}
