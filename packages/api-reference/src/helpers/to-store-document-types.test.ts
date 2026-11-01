import type { PluginDocumentType } from '@scalar/types/api-reference'
import { describe, expect, it, vi } from 'vitest'

import { toStoreDocumentTypes } from './to-store-document-types'

const documentType = (overrides: Partial<PluginDocumentType> = {}): PluginDocumentType => ({
  type: 'arazzo',
  detect: () => true,
  traverse: () => [],
  content: { component: {} },
  ...overrides,
})

describe('to-store-document-types', () => {
  it('passes detection, ingestion and bundling through unchanged', () => {
    const detect = vi.fn(() => true)
    const ingest = vi.fn((document: Record<string, unknown>) => document)

    const [definition] = toStoreDocumentTypes([documentType({ detect, ingest, bundle: true })])

    expect(definition).toMatchObject({ type: 'arazzo', detect, ingest, bundle: true })
  })

  it('tags navigation entries and their children as plugin entries of the type', () => {
    const [definition] = toStoreDocumentTypes([
      documentType({
        traverse: ({ documentId }) => [
          {
            id: `${documentId}/workflow/adopt`,
            title: 'Adopt',
            kind: 'workflow',
            children: [{ id: `${documentId}/workflow/adopt/step/find`, title: 'Find', kind: 'step' }],
          },
        ],
      }),
    ])

    expect(
      definition?.traverse({ documentName: 'pets', documentId: 'pets', document: { info: {} } as never }),
    ).toStrictEqual([
      {
        id: 'pets/workflow/adopt',
        title: 'Adopt',
        kind: 'workflow',
        type: 'plugin',
        documentType: 'arazzo',
        children: [
          { id: 'pets/workflow/adopt/step/find', title: 'Find', kind: 'step', type: 'plugin', documentType: 'arazzo' },
        ],
      },
    ])
  })
})
