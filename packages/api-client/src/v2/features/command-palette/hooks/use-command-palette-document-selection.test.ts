import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import { useCommandPaletteDocumentSelection } from './use-command-palette-document-selection'
import type { CommandPaletteDocument } from './use-command-palette-documents'

describe('use-command-palette-document-selection', () => {
  const createMockWorkspaceStore = async (documents: Record<string, Record<string, unknown>> = {}) => {
    const store = createWorkspaceStore()
    for (const [name, docPayload] of Object.entries(documents)) {
      await store.addDocument({ name, document: docPayload })
    }
    return store
  }

  const createMockDocument = (overrides: Partial<OpenApiDocument> = {}) => ({
    openapi: '3.1.0',
    info: {
      title: 'Test Document',
      version: '1.0.0',
    },
    ...overrides,
  })

  const mountComposable = (args: {
    workspaceStore: Awaited<ReturnType<typeof createMockWorkspaceStore>>
    documents?: CommandPaletteDocument[]
    documentName?: string
    activeDocumentName?: string
  }) => {
    const Root = defineComponent({
      setup() {
        return useCommandPaletteDocumentSelection({
          workspaceStore: args.workspaceStore,
          documents: () => args.documents,
          documentName: () => args.documentName,
          activeDocumentName: () => args.activeDocumentName,
        })
      },
      template: '<div />',
    })

    return mount(Root)
  }

  it('lists workspace documents when the documents prop is omitted', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'doc-a': createMockDocument({ info: { title: 'A', version: '1' } }),
      'doc-b': createMockDocument({ info: { title: 'B', version: '1' } }),
    })

    const wrapper = mountComposable({ workspaceStore })

    expect(wrapper.vm.availableDocuments).toStrictEqual([
      { id: 'doc-a', label: 'A' },
      { id: 'doc-b', label: 'B' },
    ])
    expect(wrapper.vm.selectedDocumentName).toBe('doc-a')
  })

  it('uses the documents prop instead of the workspace store when provided', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'doc-a': createMockDocument({ info: { title: 'A', version: '1' } }),
      'doc-b': createMockDocument({ info: { title: 'B', version: '1' } }),
    })

    const documents: CommandPaletteDocument[] = [{ id: 'doc-b', label: 'Grouped B' }]
    const wrapper = mountComposable({ workspaceStore, documents })

    expect(wrapper.vm.availableDocuments).toStrictEqual(documents)
    expect(wrapper.vm.selectedDocumentName).toBe('doc-b')
  })

  it('preselects documentName when it names a version row', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'acme-v1': createMockDocument(),
      'acme-v0': createMockDocument(),
    })

    const documents: CommandPaletteDocument[] = [
      {
        id: 'acme-v1',
        label: 'Acme API',
        versions: [
          { id: 'acme-v1', label: '1.0.0' },
          { id: 'acme-v0', label: '0.9.0' },
        ],
      },
    ]

    const wrapper = mountComposable({
      workspaceStore,
      documents,
      documentName: 'acme-v0',
    })

    expect(wrapper.vm.selectedDocumentName).toBe('acme-v0')
  })

  it('preselects activeDocumentName when documentName is omitted', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'doc-a': createMockDocument({ info: { title: 'A', version: '1' } }),
      'doc-b': createMockDocument({ info: { title: 'B', version: '1' } }),
    })

    const wrapper = mountComposable({
      workspaceStore,
      activeDocumentName: 'doc-b',
    })

    expect(wrapper.vm.selectedDocumentName).toBe('doc-b')
  })

  it('prefers documentName over activeDocumentName', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'doc-a': createMockDocument({ info: { title: 'A', version: '1' } }),
      'doc-b': createMockDocument({ info: { title: 'B', version: '1' } }),
    })

    const wrapper = mountComposable({
      workspaceStore,
      documentName: 'doc-a',
      activeDocumentName: 'doc-b',
    })

    expect(wrapper.vm.selectedDocumentName).toBe('doc-a')
  })

  it('falls back to the first listed document when the preferred name is not available', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'doc-a': createMockDocument({ info: { title: 'A', version: '1' } }),
    })

    const wrapper = mountComposable({
      workspaceStore,
      documentName: 'missing',
      activeDocumentName: 'also-missing',
    })

    expect(wrapper.vm.selectedDocumentName).toBe('doc-a')
  })
})
