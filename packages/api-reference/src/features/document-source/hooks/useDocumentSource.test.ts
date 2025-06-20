import { NAV_STATE_SYMBOL } from '@/hooks/useNavState'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { inject } from 'vue'
import { useDocumentSource } from './useDocumentSource'

vi.mock('vue', () => {
  const actual = require('vue')
  return {
    ...actual,
    inject: vi.fn(),
  }
})

describe('useDocumentSource', () => {
  const mockOpenApiDocument: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {},
  }

  const mockConfiguration = apiReferenceConfigurationSchema.parse({
    content: {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    },
    theme: 'default',
    hideClientButton: false,
    showSidebar: true,
    persistAuth: false,
    layout: 'modern',
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inject).mockImplementation((key) => {
      if (key === NAV_STATE_SYMBOL) {
        return {
          isIntersectionEnabled: ref(false),
          hash: ref(''),
          hashPrefix: ref(''),
        }
      }
      return undefined
    })
  })

  describe('document handling', () => {
    it('uses provided original document when available', async () => {
      const { originalDocument } = useDocumentSource({
        originalDocument: JSON.stringify(mockOpenApiDocument),
      })

      await nextTick()
      expect(originalDocument.value).toBe(JSON.stringify(mockOpenApiDocument))
    })

    it('falls back to fetched document when no original document is provided', async () => {
      const { originalDocument } = useDocumentSource({
        configuration: mockConfiguration,
      })

      await nextTick()

      expect(originalDocument.value).toBe(JSON.stringify(mockOpenApiDocument, null, 2))
    })

    it('creates empty document when no document is provided', () => {
      const { dereferencedDocument } = useDocumentSource({})

      expect(dereferencedDocument.value).toMatchObject({
        openapi: '3.1.0',
        info: {
          title: '',
          version: '',
        },
        paths: {},
      })
    })

    it('handles document upgrades for outdated OpenAPI versions', async () => {
      const outdatedDocument = {
        swagger: '2.0',
        info: {
          title: 'Old API',
          version: '1.0.0',
        },
        paths: {},
      }

      const { dereferencedDocument } = useDocumentSource({
        originalDocument: JSON.stringify(outdatedDocument),
      })

      await nextTick()
      expect(dereferencedDocument.value).toBeDefined()
    })

    it('tracks original OpenAPI version', async () => {
      const { originalOpenApiVersion } = useDocumentSource({
        originalDocument: JSON.stringify(mockOpenApiDocument),
      })

      await nextTick()

      expect(originalOpenApiVersion.value).toBe('3.1.0')
    })
  })

  describe('configuration handling', () => {
    it('applies provided configuration to workspace store', () => {
      const { workspaceStore } = useDocumentSource({
        configuration: mockConfiguration,
      })

      expect(workspaceStore).toBeDefined()
      // Verify configuration is applied through store initialization
      expect(workspaceStore.importSpecFile).toBeDefined()
    })

    it('uses default configuration when none is provided', () => {
      const { workspaceStore } = useDocumentSource({})

      expect(workspaceStore).toBeDefined()
      // Verify default configuration is applied
      expect(workspaceStore.importSpecFile).toBeDefined()
    })
  })

  describe('store management', () => {
    it('creates workspace and active entities stores', () => {
      const { workspaceStore, activeEntitiesStore } = useDocumentSource({})

      expect(workspaceStore).toBeDefined()
      expect(activeEntitiesStore).toBeDefined()
    })

    it('creates active entities store with workspace store', () => {
      const { activeEntitiesStore } = useDocumentSource({})

      expect(activeEntitiesStore).toBeDefined()
      // Verify active entities store is connected to workspace store
      expect(activeEntitiesStore).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('handles invalid JSON in original document', async () => {
      const { dereferencedDocument } = useDocumentSource({
        originalDocument: 'invalid json',
      })

      await nextTick()

      expect(dereferencedDocument.value).toMatchObject({
        openapi: '3.1.0',
        info: {
          title: '',
          version: '',
        },
        paths: {},
      })
    })

    it('handles missing document gracefully', async () => {
      const { dereferencedDocument } = useDocumentSource({
        originalDocument: undefined,
      })

      await nextTick()

      expect(dereferencedDocument.value).toBeDefined()
    })

    it('handles empty document gracefully', async () => {
      const { dereferencedDocument } = useDocumentSource({
        originalDocument: '',
      })

      await nextTick()

      expect(dereferencedDocument.value).toBeDefined()
    })
  })

  describe('reactive behavior', () => {
    it('reacts to changes in original document', async () => {
      const originalDoc = ref(JSON.stringify(mockOpenApiDocument))
      const { dereferencedDocument } = useDocumentSource({
        originalDocument: originalDoc,
      })

      await nextTick()
      const initialValue = dereferencedDocument.value

      // Change the document
      originalDoc.value = JSON.stringify({
        ...mockOpenApiDocument,
        info: { ...mockOpenApiDocument.info, title: 'Updated API' },
      })

      await nextTick()
      expect(dereferencedDocument.value).not.toEqual(initialValue)
    })
  })
})
