import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type ComputedRef, type MaybeRefOrGetter, type Ref, computed, ref, toValue } from 'vue'

import type { CommandPaletteDocument } from './use-command-palette-documents'

type UseCommandPaletteDocumentSelectionArgs = {
  workspaceStore: WorkspaceStore
  /** When set, overrides the flat workspace-store listing (registry grouping). */
  documents: MaybeRefOrGetter<CommandPaletteDocument[] | undefined>
  /** Explicit palette payload target; wins over `activeDocumentName`. */
  documentName: MaybeRefOrGetter<string | undefined>
  /** Current route / UI document for default targeting when `documentName` is unset. */
  activeDocumentName: MaybeRefOrGetter<string | undefined>
}

/**
 * Shared document dropdown state for document-aware command palette forms.
 *
 * Keeps `availableDocuments`, name validation against grouped registry rows,
 * and the initial `selectedDocumentName` in one place so Create Request, Add
 * Tag, and Add Example stay aligned when the selection rules change.
 */
export const useCommandPaletteDocumentSelection = ({
  workspaceStore,
  documents,
  documentName,
  activeDocumentName,
}: UseCommandPaletteDocumentSelectionArgs): {
  availableDocuments: ComputedRef<CommandPaletteDocument[]>
  selectedDocumentName: Ref<string | undefined>
} => {
  /**
   * All available documents (collections) for the dropdown. Prefers the
   * explicit `documents` prop (which already groups registry-backed docs by
   * the sidebar's grouping logic) and falls back to a flat workspace-store
   * listing when the prop is omitted.
   */
  const availableDocuments = computed<CommandPaletteDocument[]>(() => {
    const docs = toValue(documents)
    if (docs) {
      return docs
    }

    return Object.entries(workspaceStore.workspace.documents).map(([name, document]) => ({
      id: name,
      label: document.info.title || name,
    }))
  })

  /**
   * Returns true when `name` exists somewhere in `availableDocuments` —
   * either as a top-level document id (the active version on a registry
   * group) or inside a group's loaded `versions` list. Both shapes are
   * valid create targets, so we accept either.
   */
  const isAvailableDocumentName = (name: string): boolean =>
    availableDocuments.value.some((doc) => doc.id === name || doc.versions?.some((v) => v.id === name))

  /**
   * Initial document target. The explicit `documentName` prop wins (set when
   * the palette is opened from a sidebar context menu), falling back to the
   * active document so a Cmd+K-triggered create flow defaults to whatever
   * document the user is currently viewing.
   */
  const preferredName = toValue(documentName) ?? toValue(activeDocumentName)

  const selectedDocumentName = ref<string | undefined>(
    preferredName && isAvailableDocumentName(preferredName)
      ? preferredName
      : (availableDocuments.value[0]?.id ?? undefined),
  )

  return {
    availableDocuments,
    selectedDocumentName,
  }
}
