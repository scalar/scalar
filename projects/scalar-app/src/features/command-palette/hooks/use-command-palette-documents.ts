import { type ComputedRef, type MaybeRefOrGetter, computed } from 'vue'

import type { RegistryDocument } from '@/types/configuration'
import type { AppState } from '@/features/app'
import { useSidebarDocuments } from '@/features/app/hooks/use-sidebar-documents'

/**
 * A loaded version of a registry-grouped document, surfaced inside a
 * {@link CommandPaletteDocument} so consumers can render a secondary
 * dropdown for picking the target version.
 *
 * Only versions that have been imported into the workspace store are
 * represented — `id` is always a real workspace document name we can
 * write into. Versions advertised by the registry but not loaded locally
 * are intentionally omitted.
 */
export type CommandPaletteDocumentVersion = {
  /** Workspace store document name to target when this version is selected. */
  id: string
  /** Display label, the registry version string (e.g. `1.0.0`). */
  label: string
}

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
  /**
   * Loaded versions of this document group, ordered with the registry's
   * ordering preserved (latest first). Only present when the option groups
   * more than one loaded version, so consumers can decide whether to render
   * a version selector at all. The version whose `id` matches the
   * top-level `id` is the option's currently active version.
   */
  versions?: CommandPaletteDocumentVersion[]
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
 * active version, which mirrors what the user has open in the workspace,
 * and exposes its loaded versions on `versions` so the consumer can
 * render a follow-up version picker.
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
      .map((d) => {
        // Only surface versions we can actually target. Registry-advertised
        // rows without a `documentName` are placeholders the sidebar can
        // load on demand, but the command palette has no way to write into
        // them, so they would dead-end the version picker.
        const loadedVersions = (d.versions ?? [])
          .filter((v): v is typeof v & { documentName: string } => Boolean(v.documentName))
          .map<CommandPaletteDocumentVersion>((v) => ({ id: v.documentName, label: v.version }))

        const option: CommandPaletteDocument = { id: d.documentName, label: d.title }

        // A single-version group has nothing to choose from, so we skip the
        // `versions` field entirely. Consumers treat the absence of the
        // field as "no version picker", which keeps the form layout clean
        // for standalone documents and freshly imported registry docs.
        if (loadedVersions.length > 1) {
          option.versions = loadedVersions
        }

        return option
      }),
  )
}
