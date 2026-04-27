import type { AppState } from '@scalar/api-client/v2/features/app'
import type { TraversedDocument } from '@scalar/workspace-store/schemas/navigation'
import { type MaybeRefOrGetter, computed, toValue } from 'vue'

/**
 * A single "version" of a document grouped under a registry namespace + slug.
 * Only used on team workspaces, where multiple local documents may share the
 * same registry coordinates.
 */
export type SidebarDocumentVersion = {
  /** Stable key, matches the workspace document name */
  key: string
  /** User facing label for the version */
  title: string
  /** Name of the document inside the workspace store */
  documentName: string
  /** Traversal tree for the document (if it has been loaded) */
  navigation?: TraversedDocument
}

/**
 * A unified item for the top-level of our sidebar.
 *
 * It can represent one of three things:
 *  - A workspace document that only exists locally (no registry link)
 *  - A workspace document that was imported from the registry
 *  - A registry document that has not yet been imported into the store
 */
export type SidebarDocumentItem = {
  /** Stable key used for sidebar state keyed by `namespace/slug` or document name */
  key: string
  /** User facing title of the document */
  title: string
  /** Name of the document inside the workspace store (if loaded) */
  documentName?: string
  /** Registry metadata if available */
  registry?: { namespace: string; slug: string }
  /**
   * Traversal tree for the document if it has been loaded in the workspace store.
   * When `undefined` the document still needs to be fetched from the registry
   * before its nested content can be shown.
   */
  navigation?: TraversedDocument
  /** Whether the document is pinned (todo: derived from `x-scalar-pinned`) */
  isPinned?: boolean
  /**
   * TODO: implement versioning logic
   * Other loaded documents that share this item's `namespace + slug`. Only
   * populated on team workspaces where we collapse duplicates into a single
   * entry with multiple versions.
   */
  versions?: SidebarDocumentVersion[]
}

type WorkspaceDocumentEntry = SidebarDocumentItem & { documentName: string }

export type RegistryDocument = {
  namespace: string
  slug: string
  title: string
}

/**
 * Loading-aware wrapper for the registry documents prop.
 *
 * The sidebar uses the `status` to decide whether to render skeleton
 * placeholders while the registry is being fetched. `documents` is optional
 * during loading so callers can either render nothing or stream in cached
 * results while a refresh is still in flight.
 */
export type RegistryDocumentsState =
  | { status: 'loading'; documents?: RegistryDocument[] }
  | { status: 'success'; documents: RegistryDocument[] }

const registryKey = (namespace: string, slug: string) => `@${namespace}/${slug}`

/**
 * Builds a unified list of sidebar documents.
 *
 * Behavior:
 *  - Local workspaces (`teamUid === 'local'`) only show workspace documents.
 *    Registry documents are not considered at all.
 *  - Team workspaces group workspace documents by `namespace + slug` from
 *    `x-scalar-registry-meta`. Each unique registry coordinate produces a
 *    single sidebar entry whose additional matches are exposed as `versions`.
 *    Registry documents that have no loaded match are appended as entries
 *    waiting to be fetched.
 */
export function useSidebarDocuments({
  app,
  managedDocs,
}: {
  app: AppState
  managedDocs: MaybeRefOrGetter<RegistryDocument[]>
}) {
  const isTeamWorkspace = app.workspace.isTeamWorkspace

  /** Raw workspace documents mapped to sidebar entries (pre-grouping). */
  const workspaceEntries = computed<WorkspaceDocumentEntry[]>(() => {
    const store = app.store.value
    if (!store) {
      return []
    }

    return Object.entries(store.workspace.documents).map(([name, doc]) => {
      const registry = doc?.['x-scalar-registry-meta']
      const navigation = doc?.['x-scalar-navigation'] as TraversedDocument | undefined

      const title = navigation?.title || doc?.info?.title || 'Untitled'

      // On team workspaces we key by registry coordinates so entries with the
      // same `namespace/slug` can later be grouped into a single row with
      // versions. On local workspaces we always key by the workspace document
      // name, which is guaranteed to be unique because it is the map key in
      // `store.workspace.documents`. If we derived the key from registry meta
      // on local workspaces too, two documents sharing the same
      // `x-scalar-registry-meta` would produce duplicate Vue `:key`s in the
      // sidebar `v-for` and silently collide on re-render.
      const isTeam = isTeamWorkspace.value
      return {
        key: isTeam && registry ? registryKey(registry.namespace, registry.slug) : name,
        title,
        documentName: name,
        registry: isTeam && registry ? { namespace: registry.namespace, slug: registry.slug } : undefined,
        navigation,
        // TODO: we can implement this later
        isPinned: false,
      }
    })
  })
  const documents = computed<SidebarDocumentItem[]>(() => {
    // Local workspaces: show the workspace document list as-is, no registry
    // grouping and no registry document lookups.
    if (!isTeamWorkspace.value) {
      return workspaceEntries.value
    }

    const activeDocumentSlug = app.activeEntities.documentSlug.value

    // 1. Bucket workspace documents by their registry `namespace + slug`.
    //    Documents without registry meta remain standalone entries.
    const groups = new Map<string, WorkspaceDocumentEntry[]>()
    const standalone: WorkspaceDocumentEntry[] = []

    for (const entry of workspaceEntries.value) {
      if (!entry.registry) {
        standalone.push(entry)
        continue
      }
      const key = registryKey(entry.registry.namespace, entry.registry.slug)
      const bucket = groups.get(key)
      if (bucket) {
        bucket.push(entry)
      } else {
        groups.set(key, [entry])
      }
    }

    // 2. Collapse each group into a single sidebar entry. The active document
    //    is promoted to primary when possible so the visible entry matches
    //    what is currently being viewed. The remaining documents in the
    //    group become selectable versions.
    const grouped: SidebarDocumentItem[] = []
    for (const [, entries] of groups) {
      const activeIndex = entries.findIndex((e) => e.documentName === activeDocumentSlug)
      const primaryIndex = activeIndex === -1 ? 0 : activeIndex
      const primary = entries[primaryIndex]
      if (!primary) {
        continue
      }

      const versions = entries
        .filter((_, i) => i !== primaryIndex)
        .map<SidebarDocumentVersion>((e) => ({
          key: e.documentName,
          title: e.title,
          documentName: e.documentName,
          navigation: e.navigation,
        }))

      grouped.push({
        ...primary,
        isPinned: entries.some((e) => e.isPinned),
        versions: versions.length ? versions : undefined,
      })
    }

    // 3. Merge in registry documents that have no loaded counterpart yet.
    //    They render as placeholders until the user clicks to fetch them.
    const loadedKeys = new Set(groups.keys())
    const registryOnly = toValue(managedDocs)
      .filter((doc) => !loadedKeys.has(registryKey(doc.namespace, doc.slug)))
      .map<SidebarDocumentItem>((doc) => ({
        key: registryKey(doc.namespace, doc.slug),
        title: doc.title || doc.slug,
        registry: { namespace: doc.namespace, slug: doc.slug },
      }))

    return [...grouped, ...registryOnly, ...standalone]
  })

  const pinned = computed(() => documents.value.filter((d) => d.isPinned))
  const rest = computed(() => documents.value.filter((d) => !d.isPinned))

  return { documents, pinned, rest }
}
