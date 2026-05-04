import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'

import type { CommandPaletteDocument } from './use-command-palette-documents'
import { useDocumentVersionSelection } from './use-document-version-selection'

const grouped: CommandPaletteDocument = {
  id: 'acme-api-v1',
  label: 'Acme API',
  versions: [
    { id: 'acme-api-v1', label: '1.0.0' },
    { id: 'acme-api-v0', label: '0.9.0' },
  ],
}

const standalone: CommandPaletteDocument = {
  id: 'standalone',
  label: 'Standalone',
}

describe('useDocumentVersionSelection', () => {
  it('initialises the selection to the document active version', () => {
    const selectedDocument = ref<CommandPaletteDocument | undefined>(grouped)

    const { selectedVersion, targetDocumentName } = useDocumentVersionSelection(selectedDocument)

    expect(selectedVersion.value).toEqual({ id: 'acme-api-v1', label: '1.0.0' })
    expect(targetDocumentName.value).toBe('acme-api-v1')
  })

  it('honours initialDocumentName when it points at a non-active version', () => {
    const selectedDocument = ref<CommandPaletteDocument | undefined>(grouped)

    const { selectedVersion, targetDocumentName } = useDocumentVersionSelection(selectedDocument, 'acme-api-v0')

    expect(selectedVersion.value).toEqual({ id: 'acme-api-v0', label: '0.9.0' })
    expect(targetDocumentName.value).toBe('acme-api-v0')
  })

  it('falls back to the active version when initialDocumentName does not match a known version', () => {
    const selectedDocument = ref<CommandPaletteDocument | undefined>(grouped)

    const { selectedVersion } = useDocumentVersionSelection(selectedDocument, 'unknown')

    expect(selectedVersion.value).toEqual({ id: 'acme-api-v1', label: '1.0.0' })
  })

  it('leaves the version undefined for documents without a versions list', () => {
    const selectedDocument = ref<CommandPaletteDocument | undefined>(standalone)

    const { selectedVersion, targetDocumentName } = useDocumentVersionSelection(selectedDocument)

    expect(selectedVersion.value).toBeUndefined()
    expect(targetDocumentName.value).toBe('standalone')
  })

  it('resets the version to the new document active version when the document changes', async () => {
    const selectedDocument = ref<CommandPaletteDocument | undefined>(grouped)

    const { selectedVersion, targetDocumentName } = useDocumentVersionSelection(selectedDocument, 'acme-api-v0')

    expect(selectedVersion.value?.id).toBe('acme-api-v0')

    selectedDocument.value = standalone
    await nextTick()

    expect(selectedVersion.value).toBeUndefined()
    expect(targetDocumentName.value).toBe('standalone')

    selectedDocument.value = grouped
    await nextTick()

    expect(selectedVersion.value).toEqual({ id: 'acme-api-v1', label: '1.0.0' })
    expect(targetDocumentName.value).toBe('acme-api-v1')
  })

  it('targetDocumentName falls back to the document id when no version is selected', () => {
    const selectedDocument = ref<CommandPaletteDocument | undefined>(undefined)

    const { targetDocumentName } = useDocumentVersionSelection(selectedDocument)

    expect(targetDocumentName.value).toBeUndefined()

    selectedDocument.value = standalone

    expect(targetDocumentName.value).toBe('standalone')
  })
})
