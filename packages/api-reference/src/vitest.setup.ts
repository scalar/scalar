import { useStore } from '@/v2/hooks/useStore'
import { afterEach, beforeEach, expect, vi, type Mock } from 'vitest'
import {
  isConsoleWarnEnabled,
  isConsoleErrorEnabled,
  consoleWarnSpy,
  consoleErrorSpy,
  resetConsoleSpies,
  disableConsoleWarn,
  disableConsoleError,
} from '@scalar/helpers/testing/console-spies'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceStore as createWorkspaceStoreOld } from '@scalar/api-client/store'
import { useConfig } from '@/hooks/useConfig'
import { apiReferenceConfigurationSchema } from '@scalar/types'
import { computed } from 'vue'
import { useWorkspace } from '@scalar/api-client/store'

// Mock the useConfig hook
vi.mock('@/hooks/useConfig', async () => ({
  ...(await vi.importActual('@/hooks/useConfig')),
  useConfig: vi.fn(),
}))
export const mockUseConfig = useConfig as Mock<[], ReturnType<typeof useConfig>>
const defaultConfig = computed(() => apiReferenceConfigurationSchema.parse({}))

// Mock the useStore hook
vi.mock('@/v2/hooks/useStore', async () => ({
  ...(await vi.importActual('@/v2/hooks/useStore')),
  useStore: vi.fn(),
}))
export const mockUseStore = useStore as Mock<[], ReturnType<typeof useStore>>
const defaultStore = createWorkspaceStore()

// Mock the old client useWorkspace hook
vi.mock('@scalar/api-client/store', async () => ({
  ...(await vi.importActual('@scalar/api-client/store')),
  useWorkspace: vi.fn(),
}))
export const mockUseWorkspace = useWorkspace as Mock<[], ReturnType<typeof useWorkspace>>
const defaultWorkspaceOld = createWorkspaceStoreOld({
  useLocalStorage: false,
  showSidebar: false,
  theme: 'default',
  hideClientButton: false,
})

// Set default values for the mocks
// TODO: disable mocks for certain test
beforeEach(() => {
  mockUseStore.mockReturnValue(defaultStore)
  mockUseConfig.mockReturnValue(defaultConfig)
  mockUseWorkspace.mockReturnValue(defaultWorkspaceOld)
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
