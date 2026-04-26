import type { AppState } from '@scalar/api-client/v2/features/app'
import type { TraversedDocument } from '@scalar/workspace-store/schemas/navigation'
import { type MaybeRefOrGetter, computed, toValue } from 'vue'

import { computeVersionStatus, type VersionStatus } from '@/v2/features/app/helpers/compute-version-status'

export type { VersionStatus }

/**
 * A single version of a registry-backed document.
 *
 * On team workspaces, a registry document can advertise multiple versions and
 * each one may or may not have been imported into the local workspace store.
 * Loaded versions surface their `documentName` and traversal `navigation`,
 * unloaded versions are placeholders the sidebar can fetch on demand.
 */
export type SidebarDocumentVersion = {
  /** Stable key: workspace `documentName` when loaded, otherwise `${namespace}/${slug}@${version}`. */
  key: string
  /** Version identifier as advertised by the registry. */
  version: string
  /** User-facing label for the version row. */
  title: string
  /** Workspace store document name when this version is loaded locally. */
  documentName?: string
  /**
   * Commit hash recorded on the locally loaded workspace document, if any.
   * Undefined when the version has not been imported into the workspace
   * store or when the loaded document does not carry a hash.
   */
  commitHash?: string
  /**
   * Commit hash advertised by the registry for this version, if any.
   * Compared against `commitHash` to derive `status`.
   */
  registryCommitHash?: string
  /**
   * Sync status surfaced for the version row. Derived from the local /
   * registry commit hashes, the document's dirty flag and the cached
   * conflict-check result on `x-scalar-registry-meta`. `unknown` is used
   * for versions that are not loaded into the workspace store yet.
   */
  status: VersionStatus
  /** Traversal tree for this version. Populated only when the version is loaded into the workspace store. */
  navigation?: TraversedDocument
}

/**
 * A unified item for the top-level of our sidebar.
 *
 * It can represent one of three things:
 *  - A workspace document that only exists locally (no registry link)
 *  - A workspace document that was imported from the registry
 *  - A registry document that has not yet been imported into the store
 *
 * For registry-backed entries, the parent fields (`navigation`, `documentName`)
 * mirror the active version so the sidebar template can render a single tree
 * without having to look up the active version itself. The full version list
 * lives in `versions`.
 */
export type SidebarDocumentItem = {
  /** Stable key used for sidebar state: `@namespace/slug` for registry-backed entries, document name otherwise. */
  key: string
  /**
   * User-facing title of the document. Registry-backed entries always surface
   * the registry's title so the sidebar matches what the registry advertises,
   * even when a locally loaded copy has been renamed. Standalone entries use
   * the workspace document title.
   */
  title: string
  /** Name of the document inside the workspace store (mirrors the active version on registry-backed entries). */
  documentName?: string
  /** Registry coordinates for the document group (without the version, which lives on `versions[]`). */
  registry?: { namespace: string; slug: string }
  /** Traversal tree of the active version (or the lone document for standalone entries). */
  navigation?: TraversedDocument
  /** Whether the document is pinned (todo: derived from `x-scalar-pinned`) */
  isPinned?: boolean
  /**
   * All known versions of the document, ordered with the registry's ordering
   * preserved (latest first by convention). Loaded versions surface their
   * workspace `documentName` and `navigation`, unloaded ones act as
   * placeholders the sidebar can fetch on demand. Undefined for standalone
   * entries that have no registry coordinates.
   */
  versions?: SidebarDocumentVersion[]
  /** Key of the version currently surfaced at the parent level (matches a `versions[].key`). */
  activeVersionKey?: string
}

/** Internal projection of a workspace document used during grouping. */
type WorkspaceDocumentEntry = {
  documentName: string
  title: string
  navigation?: TraversedDocument
  isPinned?: boolean
  /** Whether the workspace document has uncommitted local edits. */
  isDirty?: boolean
  registry?: {
    namespace: string
    slug: string
    version?: string
    commitHash?: string
    /** Last registry hash the conflict cache was computed against. */
    conflictCheckedAgainstHash?: string
    /** Cached conflict-check outcome for `conflictCheckedAgainstHash`. */
    hasConflict?: boolean
  }
}

type RegistryDocumentVersion = {
  version: string
  commitHash?: string
}

export type RegistryDocument = {
  namespace: string
  slug: string
  title: string
  versions: RegistryDocumentVersion[]
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

const versionKey = (namespace: string, slug: string, version: string) =>
  `${registryKey(namespace, slug)}@${version}`

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
 */
export function useSidebarDocuments({
  app,
  managedDocs,
}: {
  app: AppState
  managedDocs: MaybeRefOrGetter<RegistryDocument[]>
}) {
  const isTeamWorkspace = app.workspace.isTeamWorkspace

  /** Raw workspace documents projected into the shape the grouping logic needs. */
  const workspaceEntries = computed<WorkspaceDocumentEntry[]>(() => {
    const store = app.store.value
    if (!store) {
      return []
    }

    return Object.entries(store.workspace.documents).map(([name, doc]) => {
      const registry = doc?.['x-scalar-registry-meta']
      const navigation = doc?.['x-scalar-navigation'] as TraversedDocument | undefined

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

  const documents = computed<SidebarDocumentItem[]>(() => {
    // Local workspaces: show the workspace document list as-is, no registry
    // grouping and no registry document lookups. The sidebar key is derived
    // from the workspace document name (which is guaranteed unique because
    // it is the map key in `store.workspace.documents`). If we keyed by
    // registry coordinates instead, two local documents sharing the same
    // `x-scalar-registry-meta` would produce duplicate Vue `:key`s in the
    // sidebar `v-for` and silently collide on re-render.
    if (!isTeamWorkspace.value) {
      return workspaceEntries.value.map<SidebarDocumentItem>((entry) => ({
        key: entry.documentName,
        title: entry.title,
        documentName: entry.documentName,
        registry: undefined,
        navigation: entry.navigation,
        isPinned: entry.isPinned ?? false,
      }))
    }

    const activeDocumentSlug = app.activeEntities.documentSlug.value

    // 1. Bucket workspace documents by their registry `namespace + slug`.
    //    Documents without registry meta remain standalone entries.
    const workspaceByRegistry = new Map<string, WorkspaceDocumentEntry[]>()
    const standalone: WorkspaceDocumentEntry[] = []

    for (const entry of workspaceEntries.value) {
      if (!entry.registry) {
        standalone.push(entry)
        continue
      }
      const key = registryKey(entry.registry.namespace, entry.registry.slug)
      const bucket = workspaceByRegistry.get(key)
      if (bucket) {
        bucket.push(entry)
      } else {
        workspaceByRegistry.set(key, [entry])
      }
    }

    // 2. Build entries from the registry, merging in any loaded workspace
    //    counterparts. The registry's version order is preserved so the
    //    "first" version on each entry is the latest one advertised.
    const grouped: SidebarDocumentItem[] = []
    const consumedRegistryKeys = new Set<string>()

    for (const doc of toValue(managedDocs)) {
      const key = registryKey(doc.namespace, doc.slug)
      consumedRegistryKeys.add(key)
      const loaded = workspaceByRegistry.get(key) ?? []
      const item = buildRegistryItem({ key, registry: doc, loaded, activeDocumentSlug })
      if (item) {
        grouped.push(item)
      }
    }

    // 3. Workspace docs that point at a registry coordinate the registry has
    //    not advertised (yet) still need to appear in the sidebar so the user
    //    is not stranded without an entry to click.
    for (const [key, loaded] of workspaceByRegistry) {
      if (consumedRegistryKeys.has(key)) {
        continue
      }
      const first = loaded[0]?.registry
      if (!first) {
        continue
      }
      const item = buildRegistryItem({
        key,
        registry: {
          namespace: first.namespace,
          slug: first.slug,
          title: loaded[0]?.title ?? first.slug,
          versions: [],
        },
        loaded,
        activeDocumentSlug,
      })
      if (item) {
        grouped.push(item)
      }
    }

    return [...grouped, ...standalone.map(toStandaloneItem)]
  })

  const pinned = computed(() => documents.value.filter((d) => d.isPinned))
  const rest = computed(() => documents.value.filter((d) => !d.isPinned))

  return { documents, pinned, rest }
}

/** Project a standalone (non-registry) workspace entry into a sidebar item. */
const toStandaloneItem = (entry: WorkspaceDocumentEntry): SidebarDocumentItem => ({
  key: entry.documentName,
  title: entry.title,
  documentName: entry.documentName,
  registry: undefined,
  navigation: entry.navigation,
  isPinned: entry.isPinned ?? false,
})

/**
 * Build a single registry-backed sidebar item. The version list is assembled
 * by walking the registry's advertised versions in order and pairing them
 * with any loaded workspace document that claims the same `version` string.
 * Loaded versions that the registry has not advertised are appended at the
 * end so they stay visible until the registry catches up.
 */
const buildRegistryItem = ({
  key,
  registry,
  loaded,
  activeDocumentSlug,
}: {
  key: string
  registry: RegistryDocument
  loaded: WorkspaceDocumentEntry[]
  activeDocumentSlug: string | undefined
}): SidebarDocumentItem | undefined => {
  // Index loaded workspace docs by the version they claim. A workspace doc
  // that does not declare a `version` is treated as an orphan and pushed to
  // the bottom of the version list — it still belongs to the group but we
  // cannot reconcile it with the registry.
  const loadedByVersion = new Map<string, WorkspaceDocumentEntry>()
  const orphans: WorkspaceDocumentEntry[] = []

  for (const entry of loaded) {
    const version = entry.registry?.version
    if (!version) {
      orphans.push(entry)
      continue
    }
    if (loadedByVersion.has(version)) {
      // Multiple workspace docs claim the same version; keep the first one
      // (registry order wins) and surface the rest as orphans so they remain
      // visible instead of silently disappearing.
      orphans.push(entry)
      continue
    }
    loadedByVersion.set(version, entry)
  }

  const versions: SidebarDocumentVersion[] = []

  // Registry-backed rows always surface the registry title so the sidebar
  // matches what the registry advertises. Local renames are intentionally
  // ignored here; the slug is the last-resort fallback so the row always has
  // something to render.
  const groupTitle = registry.title || registry.slug

  for (const v of registry.versions) {
    const match = loadedByVersion.get(v.version)
    loadedByVersion.delete(v.version)
    const localHash = match?.registry?.commitHash
    const registryHash = v.commitHash
    versions.push({
      key: match ? match.documentName : versionKey(registry.namespace, registry.slug, v.version),
      version: v.version,
      title: groupTitle,
      documentName: match?.documentName,
      commitHash: localHash,
      registryCommitHash: registryHash,
      status: computeVersionStatus({
        isLoaded: Boolean(match),
        localHash,
        registryHash,
        isDirty: match?.isDirty,
        conflictCheckedAgainstHash: match?.registry?.conflictCheckedAgainstHash,
        hasConflict: match?.registry?.hasConflict,
      }),
      navigation: match?.navigation,
    })
  }

  // Loaded versions the registry has not advertised yet (e.g. local edits or
  // a stale registry response). They keep their declared `version` string.
  // The registry has no opinion on these so we cannot infer drift.
  for (const [version, match] of loadedByVersion) {
    versions.push({
      key: match.documentName,
      version,
      title: groupTitle,
      documentName: match.documentName,
      commitHash: match.registry?.commitHash,
      registryCommitHash: undefined,
      status: computeVersionStatus({
        isLoaded: true,
        localHash: match.registry?.commitHash,
        registryHash: undefined,
        isDirty: match.isDirty,
      }),
      navigation: match.navigation,
    })
  }

  // Loaded docs that did not declare a version at all.
  for (const orphan of orphans) {
    versions.push({
      key: orphan.documentName,
      version: orphan.registry?.version ?? '',
      title: groupTitle,
      documentName: orphan.documentName,
      commitHash: orphan.registry?.commitHash,
      registryCommitHash: undefined,
      status: computeVersionStatus({
        isLoaded: true,
        localHash: orphan.registry?.commitHash,
        registryHash: undefined,
        isDirty: orphan.isDirty,
      }),
      navigation: orphan.navigation,
    })
  }

  if (versions.length === 0) {
    return undefined
  }

  // Pick the active version: prefer a loaded match against the active
  // document slug, then any loaded version, then fall back to the first
  // version (the latest advertised by the registry).
  const activeVersion =
    versions.find((v) => v.documentName !== undefined && v.documentName === activeDocumentSlug) ??
    versions.find((v) => v.documentName !== undefined) ??
    versions[0]!

  return {
    key,
    title: groupTitle,
    documentName: activeVersion.documentName,
    registry: { namespace: registry.namespace, slug: registry.slug },
    navigation: activeVersion.navigation,
    isPinned: loaded.some((e) => e.isPinned),
    versions,
    activeVersionKey: activeVersion.key,
  }
}
