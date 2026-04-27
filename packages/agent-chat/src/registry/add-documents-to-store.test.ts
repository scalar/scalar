import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { Api } from '@/api'
import { loadDocument } from '@/registry/add-documents-to-store'

const apiMetadata = {
  id: 'doc-1',
  title: 'Test API',
  namespace: 'test-ns',
  currentVersion: '1.0.0',
  logoUrl: null,
  slug: 'test-slug',
}

const minimalOpenApiDoc = {
  openapi: '3.1.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
}

const createMockApi = () =>
  ({
    getDocument: vi.fn(async () => ({ success: true as const, data: apiMetadata })),
  }) as unknown as Api

const createMockWorkspaceStore = () =>
  ({
    addDocument: vi.fn(async () => {}),
    update: vi.fn(),
    auth: { load: vi.fn() },
  }) as unknown as WorkspaceStore

describe('add-documents-to-store', () => {
  describe('loadDocument', () => {
    let mockFetch: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockFetch = vi.fn(
        async () =>
          new Response(JSON.stringify(minimalOpenApiDoc), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      )
      vi.stubGlobal('fetch', mockFetch)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    })

    it('includes the x-scalar-auth header when getAccessToken returns a token', async () => {
      const token = 'platform-token-123'
      const registryUrl = 'https://registry.example.com'

      const result = await loadDocument({
        namespace: 'test-ns',
        slug: 'test-slug',
        workspaceStore: createMockWorkspaceStore(),
        registryDocuments: ref([]),
        getAccessToken: () => token,
        registryUrl,
        config: {},
        api: createMockApi(),
      })

      expect(result.success).toBe(true)

      const registryCall = mockFetch.mock.calls.find(([url]) => {
        try {
          return new URL(String(url)).origin === new URL(registryUrl).origin
        } catch {
          return false
        }
      })
      expect(registryCall).toBeDefined()
      const [calledUrl, calledOptions] = registryCall!
      expect(String(calledUrl)).toBe('https://registry.example.com/@test-ns/apis/test-slug/latest')
      expect(calledOptions?.headers).toMatchObject({ 'x-scalar-auth': token })
    })

    it('omits the x-scalar-auth header when getAccessToken is not provided', async () => {
      const registryUrl = 'https://registry.example.com'

      await loadDocument({
        namespace: 'test-ns',
        slug: 'test-slug',
        workspaceStore: createMockWorkspaceStore(),
        registryDocuments: ref([]),
        registryUrl,
        config: {},
        api: createMockApi(),
      })

      const registryCall = mockFetch.mock.calls.find(([url]) => {
        try {
          return new URL(String(url)).origin === new URL(registryUrl).origin
        } catch {
          return false
        }
      })
      expect(registryCall).toBeDefined()
      const [, calledOptions] = registryCall!
      // fetchUrls passes `headers: undefined` when no domain entry matches.
      expect(calledOptions?.headers).toBeUndefined()
    })

    it('omits the x-scalar-auth header when getAccessToken returns an empty string', async () => {
      const registryUrl = 'https://registry.example.com'

      await loadDocument({
        namespace: 'test-ns',
        slug: 'test-slug',
        workspaceStore: createMockWorkspaceStore(),
        registryDocuments: ref([]),
        getAccessToken: () => '',
        registryUrl,
        config: {},
        api: createMockApi(),
      })

      const registryCall = mockFetch.mock.calls.find(([url]) => String(url).startsWith(registryUrl))
      const [, calledOptions] = registryCall!
      expect(calledOptions?.headers).toBeUndefined()
    })
  })
})
