import type { TraversedDocument } from '@scalar/workspace-store/schemas/navigation'

import type { VersionStatus } from '@/features/app/helpers/compute-version-status'

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
  /**
   * True when this row is the canonical "latest" version of the group: the
   * first version the registry advertises. Drafts (locally-created versions
   * the registry has not seen yet) never get this flag, even when they are
   * surfaced ahead of the registry-advertised rows in the picker.
   */
  isLatest: boolean
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
export type WorkspaceDocumentEntry = {
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
