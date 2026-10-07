import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { createRegisterUrl, useRegisterLink } from './use-register-link'

const { toastMock, uploadMock } = vi.hoisted(() => ({
  toastMock: vi.fn(),
  uploadMock: vi.fn(),
}))

vi.mock('@scalar/use-toasts', () => ({
  useToasts: () => ({ toast: toastMock }),
}))

vi.mock('@/helpers/upload-temp-document', () => ({
  uploadTempDocument: uploadMock,
}))

enableAutoUnmount(afterEach)

const externalUrls: ExternalUrls = {
  dashboardUrl: 'https://dash.acme.io',
  registryUrl: 'https://registry.acme.io',
  proxyUrl: 'https://proxy.acme.io',
  apiBaseUrl: 'https://api.acme.io',
}

type FakeTab = { opener: unknown; location: { href: string }; close: ReturnType<typeof vi.fn> }

const createTab = (): FakeTab => ({ opener: {}, location: { href: '' }, close: vi.fn() })

const createWorkspace = (exported: string | undefined = '{"openapi":"3.1.0"}') =>
  ({ exportActiveDocument: vi.fn(() => exported) }) as unknown as WorkspaceStore

/** A store whose active document cannot be exported (passing `undefined` above would hit the default) */
const createEmptyWorkspace = () => ({ exportActiveDocument: vi.fn(() => undefined) }) as unknown as WorkspaceStore

/** Composables need a component instance for `inject`, so each hook runs inside a throwaway setup */
const withSetup = <T>(composable: () => T): T => {
  let result: T | undefined
  mount(
    defineComponent({
      setup() {
        result = composable()
        return () => h('div')
      },
    }),
  )
  if (!result) {
    throw new Error('Composable did not return')
  }
  return result
}

const stubLocation = (href: string) => {
  vi.stubGlobal('location', { href, origin: new URL(href).origin, toString: () => href })
}

beforeEach(() => {
  stubLocation('https://docs.acme.io/')
  vi.stubGlobal('open', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('use-register-link', () => {
  describe('createRegisterUrl', () => {
    it('builds the register link and encodes the document url', () => {
      expect(createRegisterUrl('https://dashboard.scalar.com', 'https://example.com/openapi.json')).toBe(
        'https://dashboard.scalar.com/register?url=https%3A%2F%2Fexample.com%2Fopenapi.json',
      )
    })

    it('keeps a path prefix and strips a trailing slash from the dashboard url', () => {
      expect(createRegisterUrl('https://acme.io/dash/', 'https://example.com/openapi.json')).toBe(
        'https://acme.io/dash/register?url=https%3A%2F%2Fexample.com%2Fopenapi.json',
      )
    })

    it('appends extra params for the MCP flow', () => {
      expect(createRegisterUrl('https://dash.acme.io', 'https://example.com/openapi.json', { createMcp: 'true' })).toBe(
        'https://dash.acme.io/register?url=https%3A%2F%2Fexample.com%2Fopenapi.json&createMcp=true',
      )
    })
  })

  describe('href', () => {
    it('exposes an href for a public absolute document url', () => {
      const { href } = withSetup(() =>
        useRegisterLink({ externalUrls, url: 'https://api.acme.io/openapi.json', workspace: createWorkspace() }),
      )

      expect(href.value).toBe('https://dash.acme.io/register?url=https%3A%2F%2Fapi.acme.io%2Fopenapi.json')
    })

    it('makes a relative document url absolute before deciding', () => {
      const { href } = withSetup(() =>
        useRegisterLink({ externalUrls, url: '/openapi.json', workspace: createWorkspace() }),
      )

      expect(href.value).toBe('https://dash.acme.io/register?url=https%3A%2F%2Fdocs.acme.io%2Fopenapi.json')
    })

    it('has no href for inline documents until an upload happened', async () => {
      uploadMock.mockResolvedValue('https://tmp.acme.io/doc.json')
      vi.stubGlobal(
        'open',
        vi.fn(() => createTab()),
      )
      const { href, open } = withSetup(() =>
        useRegisterLink({ externalUrls, url: undefined, workspace: createWorkspace() }),
      )

      expect(href.value).toBeUndefined()

      await open()

      expect(href.value).toBe('https://dash.acme.io/register?url=https%3A%2F%2Ftmp.acme.io%2Fdoc.json')
    })

    it('treats localhost document urls as needing an upload', () => {
      const { href } = withSetup(() =>
        useRegisterLink({ externalUrls, url: 'http://localhost:3000/openapi.json', workspace: createWorkspace() }),
      )

      expect(href.value).toBeUndefined()
    })
  })

  describe('open', () => {
    it('opens the register link in a new tab for a public document url', async () => {
      const openMock = vi.fn()
      vi.stubGlobal('open', openMock)
      const { open } = withSetup(() =>
        useRegisterLink({ externalUrls, url: 'https://api.acme.io/openapi.json', workspace: createWorkspace() }),
      )

      await open({ createMcp: 'true' })

      expect(openMock).toHaveBeenCalledWith(
        'https://dash.acme.io/register?url=https%3A%2F%2Fapi.acme.io%2Fopenapi.json&createMcp=true',
        '_blank',
        'noopener',
      )
      expect(uploadMock).not.toHaveBeenCalled()
    })

    it('opens a blank tab before uploading and navigates it afterwards', async () => {
      const tab = createTab()
      const openMock = vi.fn(() => tab)
      vi.stubGlobal('open', openMock)
      uploadMock.mockImplementation(() => {
        // The tab must already exist while the upload is pending
        expect(openMock).toHaveBeenCalledWith('about:blank', '_blank')
        return Promise.resolve('https://tmp.acme.io/doc.json')
      })
      const workspace = createWorkspace()
      const { open, loader } = withSetup(() => useRegisterLink({ externalUrls, url: undefined, workspace }))

      await open()

      expect(uploadMock).toHaveBeenCalledWith('{"openapi":"3.1.0"}', externalUrls)
      expect(tab.opener).toBeNull()
      expect(tab.location.href).toBe('https://dash.acme.io/register?url=https%3A%2F%2Ftmp.acme.io%2Fdoc.json')
      expect(loader.isValid).toBe(true)
      expect(toastMock).not.toHaveBeenCalled()
    })

    it('does not upload twice for repeated opens', async () => {
      const openMock = vi.fn(() => createTab())
      vi.stubGlobal('open', openMock)
      uploadMock.mockResolvedValue('https://tmp.acme.io/doc.json')
      const { open } = withSetup(() => useRegisterLink({ externalUrls, url: undefined, workspace: createWorkspace() }))

      await open()
      await open()

      expect(uploadMock).toHaveBeenCalledOnce()
      // The second click is a plain navigation to the cached copy
      expect(openMock).toHaveBeenLastCalledWith(
        'https://dash.acme.io/register?url=https%3A%2F%2Ftmp.acme.io%2Fdoc.json',
        '_blank',
        'noopener',
      )
    })

    it('opens the register link in a fallback tab when the pre-opened tab was blocked', async () => {
      const fallback = createTab()
      // The first call (about:blank, inside the gesture) is blocked; the retry after the upload succeeds
      const openMock = vi.fn().mockReturnValueOnce(null).mockReturnValueOnce(fallback)
      vi.stubGlobal('open', openMock)
      uploadMock.mockResolvedValue('https://tmp.acme.io/doc.json')
      const { open, loader } = withSetup(() =>
        useRegisterLink({ externalUrls, url: undefined, workspace: createWorkspace() }),
      )

      await open()

      expect(openMock).toHaveBeenLastCalledWith(
        'https://dash.acme.io/register?url=https%3A%2F%2Ftmp.acme.io%2Fdoc.json',
        '_blank',
      )
      expect(fallback.opener).toBeNull()
      expect(toastMock).not.toHaveBeenCalled()
      expect(loader.isValid).toBe(true)
    })

    it('toasts when both the pre-opened and the fallback tab are blocked', async () => {
      vi.stubGlobal(
        'open',
        vi.fn(() => null),
      )
      uploadMock.mockResolvedValue('https://tmp.acme.io/doc.json')
      const { open, href } = withSetup(() =>
        useRegisterLink({ externalUrls, url: undefined, workspace: createWorkspace() }),
      )

      await open()

      expect(toastMock).toHaveBeenCalledWith(
        'Your browser blocked the new tab. Click "Sign up for Scalar" again to open it.',
        'error',
      )
      // The uploaded copy is kept, so the next click is a plain navigation
      expect(href.value).toBe('https://dash.acme.io/register?url=https%3A%2F%2Ftmp.acme.io%2Fdoc.json')
    })

    it('toasts and invalidates the loader when the export returns nothing', async () => {
      const openMock = vi.fn()
      vi.stubGlobal('open', openMock)
      const { open, loader } = withSetup(() =>
        useRegisterLink({ externalUrls, url: undefined, workspace: createEmptyWorkspace() }),
      )

      await open()

      expect(toastMock).toHaveBeenCalledWith('Unable to export active document', 'error')
      expect(loader.isInvalid).toBe(true)
      expect(openMock).not.toHaveBeenCalled()
      expect(uploadMock).not.toHaveBeenCalled()
    })

    it('closes the pre-opened tab and toasts the server message when the upload fails', async () => {
      const tab = createTab()
      vi.stubGlobal(
        'open',
        vi.fn(() => tab),
      )
      uploadMock.mockRejectedValue(new Error('Failed to generate temporary link, server responded with 500'))
      const { open, loader, href } = withSetup(() =>
        useRegisterLink({ externalUrls, url: undefined, workspace: createWorkspace() }),
      )

      await open()

      expect(tab.close).toHaveBeenCalledOnce()
      expect(toastMock).toHaveBeenCalledWith('Failed to generate temporary link, server responded with 500', 'error')
      expect(loader.isInvalid).toBe(true)
      expect(href.value).toBeUndefined()
    })

    it('does not start a second upload while loading', async () => {
      vi.stubGlobal(
        'open',
        vi.fn(() => createTab()),
      )
      let finishUpload: (url: string) => void = () => undefined
      uploadMock.mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            finishUpload = resolve
          }),
      )
      const { open, loader } = withSetup(() =>
        useRegisterLink({ externalUrls, url: undefined, workspace: createWorkspace() }),
      )

      const first = open()
      await flushPromises()
      expect(loader.isLoading).toBe(true)

      await open()
      expect(uploadMock).toHaveBeenCalledOnce()

      finishUpload('https://tmp.acme.io/doc.json')
      await first
      expect(loader.isLoading).toBe(false)
    })
  })
})
