import { computed, type ComputedRef } from 'vue'

import type { AppState } from '@/v2/features/app/app-state'
import {
  useSidebarDocuments,
  type RegistryDocumentsState,
  type SidebarDocumentItem,
  type SidebarDocumentVersion,
} from '@/v2/features/app/hooks/use-sidebar-documents'

/**
 * Resolves everything UI surfaces need to know about the document the user
 * is currently viewing in a registry-backed workspace.
 *
 * The breadcrumb's version picker and the right-side sync indicator both
 * need the same data:
 *
 *  - the sidebar item for the active group (so titles match the registry),
 *  - the full version list for that group (used to render dropdown rows /
 *    feed `useVersionConflictCheck`),
 *  - and the currently active version (used for the picker selection and
 *    the standalone status icon).
 *
 * Pulling this into a composable keeps both surfaces aligned and avoids
 * duplicating the active-version selection rules — in particular the
 * fallback to the version declared on `x-scalar-registry-meta` when the
 * sidebar's notion of the active version has not caught up yet (e.g. during
 * a pending fetch).
 */
export const useActiveDocumentVersion = ({
  app,
  registryDocuments,
}: {
  app: AppState
  /** Reactive accessor — components pass a getter so the composable stays prop-driven. */
  registryDocuments: () => RegistryDocumentsState
}): {
  documents: ComputedRef<SidebarDocumentItem[]>
  activeRegistryMeta: ComputedRef<
    | {
        namespace: string
        slug: string
        version?: string
        commitHash?: string
        conflictCheckedAgainstHash?: string
        hasConflict?: boolean
      }
    | undefined
  >
  activeItem: ComputedRef<SidebarDocumentItem | undefined>
  versions: ComputedRef<SidebarDocumentVersion[]>
  activeVersion: ComputedRef<SidebarDocumentVersion | undefined>
} => {
  const { documents } = useSidebarDocuments({
    app,
    managedDocs: () => registryDocuments().documents ?? [],
  })

  /** Registry meta for the currently active document (if any). */
  const activeRegistryMeta = computed(() => {
    const doc = app.store.value?.workspace.activeDocument
    return doc?.['x-scalar-registry-meta']
  })

  /**
   * Sidebar item representing the currently active registry-backed document.
   * We match by `namespace + slug` because a single group can contain
   * several versions and the active document may be any of them.
   */
  const activeItem = computed(() => {
    const meta = activeRegistryMeta.value
    if (!meta) {
      return undefined
    }
    return documents.value.find(
      (item) => item.registry?.namespace === meta.namespace && item.registry?.slug === meta.slug,
    )
  })

  /** Versions for the active group, ordered with the latest first. */
  const versions = computed<SidebarDocumentVersion[]>(() => activeItem.value?.versions ?? [])

  /**
   * The version currently active on screen. Prefers matching the version
   * declared on the active document's registry meta so consumers always
   * reflect what the user is viewing, even when the sidebar's notion of the
   * active version has not caught up yet (e.g. during a pending fetch).
   */
  const activeVersion = computed<SidebarDocumentVersion | undefined>(() => {
    const meta = activeRegistryMeta.value
    const list = versions.value
    if (!meta) {
      return list[0]
    }
    return list.find((v) => v.version === meta.version) ?? list[0]
  })

  return {
    documents,
    activeRegistryMeta,
    activeItem,
    versions,
    activeVersion,
  }
}
