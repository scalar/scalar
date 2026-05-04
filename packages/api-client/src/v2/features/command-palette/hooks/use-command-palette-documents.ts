import { type ComputedRef, type MaybeRefOrGetter, computed } from 'vue'

import type { AppState } from '@/v2/features/app'
import { useSidebarDocuments } from '@/v2/features/app/hooks/use-sidebar-documents'
import type { RegistryDocument } from '@/v2/types/configuration'

/**
 * A single option surfaced in the document selector of the command palette.
 *
 * `id` is always a workspace-store document name (the value the create flows
 * use to target a specific document), `label` is the user-facing title.
 */
export type CommandPaletteDocument = {
  /** Workspace store document name to target when this option is selected. */
  id: string
  /** Display label for the dropdown row. */
  label: string
}

/**
 * Builds the document option list rendered by the command palette's
 * "select document" dropdowns (used by `Create Request`, `Add Tag`,
 * `Add Example`, ...).
 *
 * The list is sourced from {@link useSidebarDocuments} so registry-backed
 * documents that share an OpenAPI title (different versions of the same
 * registry slug) collapse into a single entry, mirroring how they appear
 * in the sidebar. Each entry targets the registry group's currently
 * active version, which mirrors what the user has open in the workspace.
 *
 * Standalone (non-registry) workspace documents pass through unchanged.
 *
 * Registry entries that have no loaded version yet are intentionally
 * omitted — there is no `documentName` to write into when a version has
 * not been imported into the workspace store.
 */
export const useCommandPaletteDocuments = ({
  app,
  managedDocs,
}: {
  app: AppState
  managedDocs: MaybeRefOrGetter<RegistryDocument[]>
}): ComputedRef<CommandPaletteDocument[]> => {
  const { documents } = useSidebarDocuments({ app, managedDocs })

  return computed(() =>
    documents.value
      .filter((d): d is typeof d & { documentName: string } => Boolean(d.documentName))
      .map((d) => ({ id: d.documentName, label: d.title })),
  )
}
