import type { TraversedDocument } from '@scalar/workspace-store/schemas/navigation'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import Fuse from 'fuse.js'
import { type MaybeRefOrGetter, computed, ref, toValue } from 'vue'

import type { AppState } from '@/features/app'
import { groupWorkspaceEntries } from '@/features/app/hooks/use-sidebar-documents/helpers/group-workspace-documents'
import {
  FILTER_NAMESPACE_ALL,
  type NamespaceFilterId,
  type NamespaceFilterOption,
  buildNamespaceFilterOptions,
  filterItemsByRegistryNamespace,
  resolveNamespaceFilterTriggerLabel,
  summarizeRegistryNamespaces,
} from '@/features/app/hooks/use-sidebar-documents/helpers/registry-namespace-filter'
import type { SidebarDocumentItem, WorkspaceDocumentEntry } from '@/features/app/hooks/use-sidebar-documents/types'
import type { RegistryDocument } from '@/types/configuration'

/**
 * Builds a unified list of sidebar documents.
 *
 * Behavior:
 *  - Local workspaces (`teamUid === 'local'`) only show workspace documents.
 *    Registry documents are not considered at all.
 *  - Team workspaces group workspace documents by `namespace + slug` from
 *    `x-scalar-registry-meta`. Each unique registry coordinate produces a
 *    single sidebar entry whose versions are exposed as `versions`. The
 *    `versions` array merges the registry-advertised versions with any
 *    loaded workspace counterparts (matched by `version`). Registry
 *    documents that have no loaded match are still surfaced as entries
 *    waiting to be fetched.
 *
 * Also owns the workspace document list filters: fuzzy title match on the
 * unpinned list plus optional registry namespace scope on team workspaces.
 */
export function useSidebarDocuments({
  app,
  managedDocs,
}: {
  app: AppState
  managedDocs: MaybeRefOrGetter<RegistryDocument[]>
}) {
  /** Raw workspace documents projected into the shape the grouping logic needs. */
  const workspaceEntries = computed<WorkspaceDocumentEntry[]>(() => {
    const store = app.store.value
    if (!store) {
      return []
    }

    return Object.entries(store.workspace.documents).map(([name, doc]) => {
      // Registry meta is workspace-store-managed and lives on both OpenAPI and
      // AsyncAPI documents — registry-backed AsyncAPI docs need to group with
      // their registry siblings just like OpenAPI ones do.
      const registry = doc?.['x-scalar-registry-meta']
      // Navigation tree is OpenAPI-specific, so keep it behind the guard.
      const navigation = isOpenApiDocument(doc)
        ? (doc['x-scalar-navigation'] as TraversedDocument | undefined)
        : undefined

      const title = navigation?.title || doc?.info?.title || 'Untitled'

      return {
        documentName: name,
        title,
        navigation,
        // TODO: we can implement this later
        isPinned: false,
        isDirty: doc?.['x-scalar-is-dirty'] === true,
        registry: registry
          ? {
              namespace: registry.namespace,
              slug: registry.slug,
              version: registry.version,
              commitHash: registry.commitHash,
              conflictCheckedAgainstHash: registry.conflictCheckedAgainstHash,
              hasConflict: registry.hasConflict,
            }
          : undefined,
      }
    })
  })

  const documents = computed<SidebarDocumentItem[]>(() =>
    groupWorkspaceEntries({
      isTeamWorkspace: app.workspace.isTeamWorkspace.value,
      workspaceEntries: workspaceEntries.value,
      activeDocumentSlug: app.activeEntities.documentSlug.value,
      registryDocuments: toValue(managedDocs),
    }),
  )

  const pinned = computed(() => documents.value.filter((d) => d.isPinned))
  const rest = computed(() => documents.value.filter((d) => !d.isPinned))

  const isEmpty = computed(() => rest.value.length === 0 && pinned.value.length === 0)

  // --- Title filter (Fuzzy, `rest` only; pinned is namespace-only)

  const isFilterVisible = ref(false)

  /** Toggle the visibility of the title filter. */
  const toggleFilter = () => {
    isFilterVisible.value = !isFilterVisible.value
    if (!isFilterVisible.value) {
      filterQuery.value = ''
      filterNamespaceId.value = FILTER_NAMESPACE_ALL
    }
  }

  const filterQuery = ref('')

  const titleFuse = computed(
    () =>
      new Fuse(rest.value, {
        keys: ['title'],
        threshold: 0.3,
        ignoreLocation: true,
      }),
  )

  const titleFilteredRest = computed(() => {
    const trimmed = filterQuery.value.trim()
    if (!trimmed) {
      return rest.value
    }
    return titleFuse.value.search(trimmed).map((result) => result.item)
  })

  // --- Registry namespace filter (team workspaces)
  const isTeamWorkspace = () => app.workspace.isTeamWorkspace.value
  const filterNamespaceId = ref<NamespaceFilterId>(FILTER_NAMESPACE_ALL)

  const namespaceFilterSummary = computed(() => {
    if (!isTeamWorkspace()) {
      return null
    }
    return summarizeRegistryNamespaces([...pinned.value, ...rest.value])
  })

  const namespaceFilterOptions = computed((): NamespaceFilterOption[] => {
    const summary = namespaceFilterSummary.value
    if (!summary) {
      return []
    }
    const totalDocs = pinned.value.length + rest.value.length
    return buildNamespaceFilterOptions(summary, totalDocs)
  })

  const showNamespaceFilterRow = computed(
    () => isFilterVisible.value && isTeamWorkspace() && namespaceFilterSummary.value !== null,
  )

  const namespaceFilterTriggerLabel = computed(() =>
    resolveNamespaceFilterTriggerLabel(filterNamespaceId.value, namespaceFilterOptions.value),
  )

  const displayRestDocuments = computed(() =>
    filterItemsByRegistryNamespace(titleFilteredRest.value, filterNamespaceId.value, isTeamWorkspace()),
  )

  const displayPinnedDocuments = computed(() =>
    filterItemsByRegistryNamespace(pinned.value, filterNamespaceId.value, isTeamWorkspace()),
  )

  return {
    isEmpty,
    documents,
    isFilterVisible,
    filterQuery,
    toggleFilter,
    filterNamespaceId,
    showNamespaceFilterRow,
    namespaceFilterOptions,
    namespaceFilterTriggerLabel,
    displayRestDocuments,
    displayPinnedDocuments,
  }
}
