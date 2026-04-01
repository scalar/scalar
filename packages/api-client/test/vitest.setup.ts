import { afterEach, beforeEach, expect, vi } from 'vitest'
import { reactive, ref } from 'vue'

import { useLayout } from '@/hooks/useLayout'
import { createSidebarState, useSidebar } from '@/hooks/useSidebar'

// Mock the useLayout hook.
vi.mock('@/hooks/useLayout', () => {
  return {
    LAYOUT_SYMBOL: Symbol('layout'),
    useLayout: vi.fn(),
  }
})

vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn(),
  },
}))
export const mockUseLayout = useLayout

// Prevent v2 editor from loading real monaco (workers and subpath imports fail in test env).
vi.mock('@/v2/features/editor', () => ({
  useMonacoEditorConfiguration: vi.fn(),
  rangeToWholeLine: vi.fn(),
  useEditor: vi.fn(() => ({
    editor: null,
    setValue: vi.fn(),
    getValue: vi.fn(() => ''),
    focusPath: vi.fn(),
    formatDocument: vi.fn(),
    dispose: vi.fn(),
  })),
  useJsonPointerLinkSupport: vi.fn(),
}))

// Mock the useSidebar hook and expose helper exports used by app creation.
vi.mock('@/hooks/useSidebar', () => {
  return {
    SIDEBAR_SYMBOL: Symbol('sidebar'),
    createSidebarState: vi.fn(({ layout }: { layout: 'modal' | 'web' | 'desktop' }) => ({
      collapsedSidebarFolders: reactive({}),
      isSidebarOpen: ref(layout !== 'modal'),
    })),
    useSidebar: vi.fn(),
  }
})
export const mockUseSidebar = useSidebar
export const mockCreateSidebarState = createSidebarState

/** Spy on console.warn */
export const consoleWarnSpy = vi.spyOn(console, 'warn')
let isConsoleWarnEnabled = false

/** Spy on console.error */
export const consoleErrorSpy = vi.spyOn(console, 'error')
let isConsoleErrorEnabled = false

/** Reset the spies */
export const resetConsoleSpies = () => {
  consoleWarnSpy.mockClear()
  consoleErrorSpy.mockClear()
}

/** Helper to re-enable console warn checks */
export const enableConsoleWarn = () => (isConsoleWarnEnabled = true)

/** Helper to disable console warn checks */
export const disableConsoleWarn = () => (isConsoleWarnEnabled = false)

/** Helper to enable console error checks */
export const enableConsoleError = () => (isConsoleErrorEnabled = true)

/** Helper to disable console error checks */
export const disableConsoleError = () => (isConsoleErrorEnabled = false)

// Set default values for the mocks
beforeEach(() => {
  vi.mocked(mockUseLayout).mockReturnValue({
    layout: 'desktop',
  })

  vi.mocked(mockUseSidebar).mockReturnValue({
    isSidebarOpen: ref(false),
    collapsedSidebarFolders: reactive({}),
    setCollapsedSidebarFolder: vi.fn(),
    toggleSidebarFolder: vi.fn(),
    toggleSidebarOpen: vi.fn(),
    setSidebarOpen: vi.fn(),
  })

  /**
   * Mock ResizeObserver which is used by @headlessui/vue Dialog component
   * but is not available in the test environment. If you need to test it you can set your own mock in the test file.
   *
   * @see https://github.com/jsdom/jsdom/issues/3368
   */
  globalThis.ResizeObserver = class {
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
  }

  /**
   * Mock MutationObserver which is used by CodeMirror's DOMObserver
   * but is not available in the test environment.
   */
  globalThis.MutationObserver = class {
    constructor(public callback: MutationCallback) {}
    disconnect = vi.fn()
    observe = vi.fn()
    takeRecords = vi.fn(() => [])
  }

  /**
   * Mock IntersectionObserver which is used by various components
   * but is not available in the test environment.
   *
   * @see https://github.com/jsdom/jsdom/issues/2032
   */
  globalThis.IntersectionObserver = class {
    constructor(public callback: IntersectionObserverCallback) {}
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds = [] as number[]
  }
})

afterEach(() => {
  /**
   * Make sure we didn't log any warnings or errors on all tests
   *
   * If you get an error that's something like "ScalarFloating: Target with id="v-0" not found", it means you need to
   * attach the component to the dom in the mount options with `attachTo: document.body`
   *
   * To disable you can call `disableConsoleChecks()` in the test
   *
   * TODO: going to disable these as a lot of our tests have warnings and errors, we can enable them globally as we
   * bring that number down
   */

  if (isConsoleWarnEnabled) {
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  }

  if (isConsoleErrorEnabled) {
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  }

  // Reset the spies
  resetConsoleSpies()
  disableConsoleWarn()
  disableConsoleError()

  vi.clearAllMocks()
})
