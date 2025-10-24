import { AVAILABLE_CLIENTS } from '@scalar/snippetz'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { extensions } from '@scalar/workspace-store/schemas/extensions'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { type MutableArray, vi } from 'vitest'

/**
 * A collection of tools which are used strictly for testing
 */

export const createMockPluginManager = () => ({
  getSpecificationExtensions: vi.fn(),
})

export const createMockStore = (activeDocument: WorkspaceDocument): WorkspaceStore => ({
  workspace: {
    documents: {},
    activeDocument,
    [extensions.workspace.sidebarWidth]: 288,
  },
  update: vi.fn(),
  updateDocument: vi.fn(),
  resolve: vi.fn(),
  addDocument: vi.fn(),
  config: {
    'x-scalar-reference-config': {
      title: 'Test API',
      slug: 'test-api',
      httpClients: AVAILABLE_CLIENTS as MutableArray<typeof AVAILABLE_CLIENTS>,
      features: {
        showModels: true,
        showSidebar: true,
        showDownload: true,
        showTestRequestButton: true,
        showSearch: true,
        showApiClientImport: true,
        showDarkModeToggle: true,
        expandAllTagSections: true,
        persistAuthenticationState: true,
      },
      appearance: {
        layout: 'classic',
        theme: 'default',
        favicon: 'https://example.com/favicon.ico',
        initialColorMode: 'auto',
        forceColorMode: 'dark',
        css: '',
        loadDefaultFonts: true,
      },
      routing: {
        basePath: '/',
        pathNotFound: '/404',
      },
      settings: {
        servers: [],
        proxyUrl: '',
        searchKey: '',
        baseServerUrl: '',
      },
      meta: {
        title: 'Test API',
        description: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        twitterCard: '',
      },
    },
  },
  exportDocument: vi.fn(),
  exportActiveDocument: vi.fn(),
  saveDocument: vi.fn(),
  revertDocumentChanges: vi.fn(),
  commitDocument: vi.fn(),
  exportWorkspace: vi.fn(),
  loadWorkspace: vi.fn(),
  importWorkspaceFromSpecification: vi.fn(),
  replaceDocument: vi.fn(),
  rebaseDocument: vi.fn(),
})

export const createMockLocalStorage = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
})

/**
 * Creates a controllable requestIdleCallback mock for testing.
 * Collects scheduled callbacks and allows tests to run them deterministically.
 *
 * @example
 * const ricController = mockRequestIdleCallbackController()
 *
 * // In your test
 * const wrapper = mount(Component)
 *
 * // Later, manually trigger the idle callback
 * ricController.runNext()
 * await nextTick()
 */
export const mockRequestIdleCallbackController = () => {
  type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number }
  type IdleCallback = (deadline: IdleDeadline) => void

  const queue: IdleCallback[] = []

  const mock = vi.fn((cb: IdleCallback) => {
    queue.push(cb)
    // Return a pseudo handle
    return queue.length
  })

  const createDeadline = (): IdleDeadline => ({
    didTimeout: false,
    timeRemaining: () => 50,
  })

  const runNext = () => {
    const cb = queue.shift()
    if (cb) {
      cb(createDeadline())
    }
  }

  const flushAll = () => {
    while (queue.length) {
      runNext()
    }
  }

  return { mock, runNext, flushAll, queue }
}
