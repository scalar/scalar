import { createSidebarState, useSidebar } from './useSidebar'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { inject } from 'vue'

// Mock the useBreakpoints hook
vi.mock('@scalar/use-hooks/useBreakpoints', () => ({
  useBreakpoints: vi.fn(),
}))
// const mockUseBreakpoints = useBreakpoints as Mock

// Mock Vue's provide/inject
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    provide: vi.fn(),
    inject: vi.fn(),
  }
})

describe('createSidebarState', () => {
  beforeEach(() => {
    // Disable global mock for useSidebar
    vi.unmock('@/hooks/useSidebar')
  })

  it('should create sidebar state with isSidebarOpen=true for non-modal layout', () => {
    const state = createSidebarState({ layout: 'web' })

    expect(state.collapsedSidebarFolders).toEqual({})
    expect(state.isSidebarOpen.value).toBe(true)
  })

  it('should create sidebar state with isSidebarOpen=false for modal layout', () => {
    const state = createSidebarState({ layout: 'modal' })

    expect(state.collapsedSidebarFolders).toEqual({})
    expect(state.isSidebarOpen.value).toBe(false)
  })
})

describe('useSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock inject to return our mock sidebar state
    vi.mocked(inject).mockReturnValue(createSidebarState({ layout: 'web' }))
  })

  it('should throw error if SIDEBAR_SYMBOL is not injected', () => {
    vi.mocked(inject).mockReturnValue(null)
    expect(() => useSidebar()).toThrow('useSidebar must have injected SIDEBAR_SYMBOL')
  })

  it('should return sidebar state and actions', () => {
    const sidebar = useSidebar()

    expect(sidebar).toHaveProperty('collapsedSidebarFolders')
    expect(sidebar).toHaveProperty('isSidebarOpen')
    expect(sidebar).toHaveProperty('setCollapsedSidebarFolder')
    expect(sidebar).toHaveProperty('toggleSidebarFolder')
    expect(sidebar).toHaveProperty('toggleSidebarOpen')
  })

  it('should toggle sidebar folder', () => {
    const { collapsedSidebarFolders, toggleSidebarFolder } = useSidebar()
    expect(collapsedSidebarFolders['test-folder']).toBeFalsy()

    toggleSidebarFolder('test-folder')
    expect(collapsedSidebarFolders['test-folder']).toBe(true)

    toggleSidebarFolder('test-folder')
    expect(collapsedSidebarFolders['test-folder']).toBe(false)
  })

  it('should set collapsed sidebar folder directly', () => {
    const { collapsedSidebarFolders, setCollapsedSidebarFolder } = useSidebar()

    setCollapsedSidebarFolder('test-folder', true)
    expect(collapsedSidebarFolders['test-folder']).toBe(true)

    setCollapsedSidebarFolder('test-folder', false)
    expect(collapsedSidebarFolders['test-folder']).toBe(false)
  })

  it('should toggle sidebar open state', () => {
    const { isSidebarOpen, toggleSidebarOpen } = useSidebar()
    expect(isSidebarOpen.value).toBe(true)

    toggleSidebarOpen()
    expect(isSidebarOpen.value).toBe(false)

    toggleSidebarOpen()
    expect(isSidebarOpen.value).toBe(true)
  })

  it('should set isSidebarOpen to false for modal layout', () => {
    vi.mocked(inject).mockReturnValue(createSidebarState({ layout: 'modal' }))
    const { isSidebarOpen } = useSidebar()
    expect(isSidebarOpen.value).toBe(false)
  })
})
