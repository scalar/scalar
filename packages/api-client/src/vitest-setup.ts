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
/** Spy on console.error */
export const consoleErrorSpy = vi.spyOn(console, 'error')
/** Flag to disable console warning/error checks for specific tests */
export let skipConsoleChecks = false

/** Reset the spies */
export const resetConsoleSpies = () => {
  consoleWarnSpy.mockClear()
  consoleErrorSpy.mockClear()
}

/** Helper to disable console checks for specific tests */
export const disableConsoleChecks = () => {
  skipConsoleChecks = true
}

/** Helper to re-enable console checks */
export const enableConsoleChecks = () => {
  skipConsoleChecks = false
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
   */
  if (!skipConsoleChecks) {
    expect(consoleWarnSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  }

  // Reset the spies
  resetConsoleSpies()
  enableConsoleChecks()

  vi.clearAllMocks()
})
