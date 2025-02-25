import { useLayout } from '@/hooks/useLayout'
import { useSidebar } from '@/hooks/useSidebar'
import { afterEach, beforeEach, expect, vi, type Mock } from 'vitest'
import { reactive, ref } from 'vue'

// Mock the useLayout hook
vi.mock('@/hooks/useLayout', () => ({
  useLayout: vi.fn(),
}))
export const mockUseLayout = useLayout as Mock<[], ReturnType<typeof useLayout>>

// Mock the useSidebar hook
vi.mock('@/hooks/useSidebar', () => ({
  useSidebar: vi.fn(),
}))
export const mockUseSidebar = useSidebar as Mock<[], ReturnType<typeof useSidebar>>

/** Spy on console.warn */
export const consoleWarnSpy = vi.spyOn(console, 'warn')
let isConsoleWarnEnabled = true

/** Spy on console.error */
export const consoleErrorSpy = vi.spyOn(console, 'error')

/** Reset the spies */
export const resetConsoleSpies = () => {
  consoleWarnSpy.mockClear()
  consoleErrorSpy.mockClear()
}

/** Helper to re-enable console checks */
export const enableConsoleWarn = () => {
  isConsoleWarnEnabled = true
}

// Set default values for the mocks
beforeEach(() => {
  mockUseLayout.mockReturnValue({
    layout: 'modal',
  })

  mockUseSidebar.mockReturnValue({
    isSidebarOpen: ref(false),
    collapsedSidebarFolders: reactive({}),
    setCollapsedSidebarFolder: vi.fn(),
    toggleSidebarFolder: vi.fn(),
    toggleSidebarOpen: vi.fn(),
    setSidebarOpen: vi.fn(),
  })
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

  // Reset the spies
  resetConsoleSpies()

  vi.clearAllMocks()
})
