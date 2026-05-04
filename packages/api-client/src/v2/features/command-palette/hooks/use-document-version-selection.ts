import { type ComputedRef, type Ref, computed, ref, watch } from 'vue'

import type { CommandPaletteDocument, CommandPaletteDocumentVersion } from './use-command-palette-documents'

/**
 * Tracks the version a consumer is targeting alongside the selected
 * document.
 *
 * The hook keeps the version in sync with the document: when the document
 * changes, the version resets to whichever entry matches the new
 * document's `id` (the active version), or the first loaded version when
 * no exact match is found. Documents without a `versions` list yield an
 * `undefined` selection — `targetDocumentName` then falls through to the
 * document's own `id`, which keeps the standalone-document flow unchanged.
 *
 * Callers can pass `initialDocumentName` to override the version
 * preselection on the very first render. This is how a caller pins the
 * picker to a specific version (for example when the palette is opened
 * from a context menu that was anchored to a non-active version): if the
 * name matches one of the document's versions, that version wins over the
 * "use the active version" default.
 */
export const useDocumentVersionSelection = (
  selectedDocument: Ref<CommandPaletteDocument | undefined>,
  initialDocumentName?: string,
): {
  selectedVersion: Ref<CommandPaletteDocumentVersion | undefined>
  targetDocumentName: ComputedRef<string | undefined>
} => {
  /** Pick the active version for `doc`, or `undefined` when `doc` has no version list. */
  const findActiveVersion = (doc: CommandPaletteDocument | undefined): CommandPaletteDocumentVersion | undefined => {
    const versions = doc?.versions
    if (!versions?.length) {
      return undefined
    }
    return versions.find((v) => v.id === doc?.id) ?? versions[0]
  }

  // Honour `initialDocumentName` as a one-shot preselection. The watch
  // below only triggers on subsequent document changes, so it never
  // re-applies the initial pin once the user has switched documents.
  const initialVersion =
    selectedDocument.value?.versions?.find((v) => v.id === initialDocumentName) ??
    findActiveVersion(selectedDocument.value)

  const selectedVersion = ref<CommandPaletteDocumentVersion | undefined>(initialVersion)

  watch(selectedDocument, (doc) => {
    selectedVersion.value = findActiveVersion(doc)
  })

  /**
   * Document name to target on submit. Picks the version when a version
   * picker is in play, otherwise falls back to the document id (the
   * active version on registry-grouped entries, the document name on
   * standalone entries).
   */
  const targetDocumentName = computed<string | undefined>(() => selectedVersion.value?.id ?? selectedDocument.value?.id)

  return { selectedVersion, targetDocumentName }
}
