import { createEmptySpecification } from '@/libs/openapi'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useDataSource } from './useDataSource'

// Mock the document fetcher
vi.mock('./useDocumentFetcher', () => ({
  useDocumentFetcher: () => ({
    originalDocument: ref(null),
  }),
}))

// Mock the sidebar hook
vi.mock('@/hooks/useSidebar', () => ({
  useSidebar: () => ({
    setParsedSpec: vi.fn(),
  }),
}))

describe('useDataSource', () => {
  const mockOpenApiDocument: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {},
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.only('uses provided original document when available', async () => {
    const { originalDocument } = useDataSource({
      originalDocument: JSON.stringify(mockOpenApiDocument),
    })

    await nextTick()

    expect(originalDocument.value).toBe(JSON.stringify(mockOpenApiDocument))
  })

  it.only('creates empty document when no document is provided', () => {
    const { dereferencedDocument, parsedDocument } = useDataSource({})

    expect(dereferencedDocument.value).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: '',
        version: '',
      },
      paths: {},
    })

    expect(parsedDocument.value).toMatchObject(createEmptySpecification())
  })

  it.only('creates workspace and active entities stores', () => {
    const { workspaceStore, activeEntitiesStore } = useDataSource({})

    expect(workspaceStore).toBeDefined()
    expect(activeEntitiesStore).toBeDefined()
  })

  it.only('updates parsed document when dereferenced document changes', async () => {
    const mockedDocument = ref(mockOpenApiDocument)
    const { parsedDocument } = useDataSource({
      dereferencedDocument: ref(mockOpenApiDocument),
    })

    expect(parsedDocument.value).toEqual(createEmptySpecification())

    // Simulate a document change
    mockedDocument.value = mockOpenApiDocument

    await nextTick()

    expect(parsedDocument.value).toBeDefined()
    // Note: We can't assert the exact content since parse() is mocked
    // but we can verify it's not the empty specification
    expect(parsedDocument.value).not.toEqual(createEmptySpecification())
  })
})
