import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

import { buildGenerateSdkUrl, useGenerateSdk } from './use-generate-sdk'

const uploadTempDocument = vi.hoisted(() => vi.fn())
vi.mock('@/helpers/upload-temp-document', () => ({ uploadTempDocument }))

const externalUrls = {
  dashboardUrl: 'https://dashboard.scalar.com',
  registryUrl: 'https://registry.scalar.com',
  proxyUrl: 'https://proxy.scalar.com',
  apiBaseUrl: 'https://api.scalar.com',
}

/** Pass `null` to simulate a workspace without an exportable document */
const createWorkspace = (document: string | null = '{"openapi":"3.1.0"}') =>
  ({ exportActiveDocument: vi.fn(() => document ?? undefined) }) as unknown as WorkspaceStore

describe('use-generate-sdk', () => {
  const windowOpen = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('open', windowOpen)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  describe('buildGenerateSdkUrl', () => {
    it('points at the dashboard register page with the createSDK flag', () => {
      const url = new URL(
        buildGenerateSdkUrl('https://dashboard.scalar.com', 'https://registry.scalar.com/share/apis/abc'),
      )

      expect(url.origin + url.pathname).toBe('https://dashboard.scalar.com/register')
      expect(url.searchParams.get('url')).toBe('https://registry.scalar.com/share/apis/abc')
      expect(url.searchParams.get('createSDK')).toBe('true')
    })
  })

  describe('generate', () => {
    it('opens the dashboard right away when the document already has a public URL', async () => {
      const workspace = createWorkspace()
      const { generate } = useGenerateSdk({
        workspace,
        externalUrls,
        documentUrl: 'https://example.com/openapi.json',
      })

      await expect(generate()).resolves.toEqual({ ok: true })

      expect(uploadTempDocument).not.toHaveBeenCalled()
      expect(workspace.exportActiveDocument).not.toHaveBeenCalled()
      expect(windowOpen).toHaveBeenCalledWith(
        buildGenerateSdkUrl(externalUrls.dashboardUrl, 'https://example.com/openapi.json'),
        '_blank',
      )
    })

    it('uploads the active document once and reuses the temporary URL', async () => {
      uploadTempDocument.mockResolvedValue('https://registry.scalar.com/share/apis/tmp')
      const workspace = createWorkspace()
      const { generate } = useGenerateSdk({ workspace, externalUrls })

      await expect(generate()).resolves.toEqual({ ok: true })
      await expect(generate()).resolves.toEqual({ ok: true })

      expect(uploadTempDocument).toHaveBeenCalledTimes(1)
      expect(uploadTempDocument).toHaveBeenCalledWith('{"openapi":"3.1.0"}', externalUrls)
      expect(windowOpen).toHaveBeenCalledTimes(2)
      expect(windowOpen).toHaveBeenLastCalledWith(
        buildGenerateSdkUrl(externalUrls.dashboardUrl, 'https://registry.scalar.com/share/apis/tmp'),
        '_blank',
      )
    })

    it('reports when the active document cannot be exported', async () => {
      const { generate } = useGenerateSdk({ workspace: createWorkspace(null), externalUrls })

      await expect(generate()).resolves.toEqual({ ok: false, reason: 'export-failed' })
      expect(windowOpen).not.toHaveBeenCalled()
    })

    it('reports upload failures with the error message and resets the loading state', async () => {
      uploadTempDocument.mockRejectedValue(new Error('Server responded with 500'))
      const { generate, isGenerating } = useGenerateSdk({ workspace: createWorkspace(), externalUrls })

      await expect(generate()).resolves.toEqual({
        ok: false,
        reason: 'upload-failed',
        message: 'Server responded with 500',
      })
      expect(isGenerating.value).toBe(false)
      expect(windowOpen).not.toHaveBeenCalled()
    })

    it('reads the external URLs lazily so configuration overrides apply', async () => {
      const urls = ref(externalUrls)
      const { generate } = useGenerateSdk({
        workspace: createWorkspace(),
        externalUrls: urls,
        documentUrl: 'https://example.com/openapi.json',
      })

      urls.value = { ...externalUrls, dashboardUrl: 'https://dashboard.example.com' }
      await generate()

      expect(windowOpen).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/dashboard\.example\.com\/register\?/),
        '_blank',
      )
    })
  })

  describe('enabled', () => {
    it('is only enabled on local URLs by default', () => {
      vi.stubGlobal('location', { href: 'https://docs.example.com/reference' })
      expect(useGenerateSdk({ workspace: createWorkspace(), externalUrls }).enabled.value).toBe(false)

      vi.stubGlobal('location', { href: 'http://localhost:5173/' })
      expect(useGenerateSdk({ workspace: createWorkspace(), externalUrls }).enabled.value).toBe(true)
    })

    it('respects an explicit override', () => {
      vi.stubGlobal('location', { href: 'http://localhost:5173/' })
      const { enabled } = useGenerateSdk({
        workspace: createWorkspace(),
        externalUrls,
        enabled: computed(() => false),
      })

      expect(enabled.value).toBe(false)
    })

    it('is disabled while the document already lists SDKs', () => {
      vi.stubGlobal('location', { href: 'http://localhost:5173/' })
      const hasSdk = ref(true)
      const { enabled } = useGenerateSdk({ workspace: createWorkspace(), externalUrls, hasSdk })

      expect(enabled.value).toBe(false)

      hasSdk.value = false
      expect(enabled.value).toBe(true)
    })

    it('stays disabled on deployed references without SDKs', () => {
      vi.stubGlobal('location', { href: 'https://docs.example.com/reference' })
      const { enabled } = useGenerateSdk({ workspace: createWorkspace(), externalUrls, hasSdk: () => false })

      expect(enabled.value).toBe(false)
    })
  })
})
