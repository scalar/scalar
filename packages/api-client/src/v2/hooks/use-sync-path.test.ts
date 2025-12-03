import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'

import 'fake-indexeddb/auto'

import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'

import { useSyncPath } from './use-sync-path'
import type { UseTabsReturn } from './use-tabs'
import type { UseWorkspaceSelectorReturn } from './use-workspace-selector'

const mockRoute = reactive({
  path: '/workspace/default/document/drafts/overview',
  query: {} as Record<string, string>,
  params: {
    workspaceSlug: 'default',
  },
})

const mockPush = vi.fn().mockResolvedValue(undefined)
const mockReplace = vi.fn().mockResolvedValue(undefined)

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

const mockSetCurrentPath = vi.fn()

vi.mock('@/v2/helpers/storage', () => ({
  workspaceStorage: {
    setCurrentPath: (path: string) => mockSetCurrentPath(path),
    getLastPath: () => null,
  },
}))

const createMockWorkspaceSelectorState = (
  overrides: Partial<UseWorkspaceSelectorReturn> = {},
): UseWorkspaceSelectorReturn => {
  return {
    store: ref(null),
    activeWorkspace: ref(null),
    workspaces: ref([]),
    setWorkspaceId: vi.fn().mockResolvedValue(undefined),
    createWorkspace: vi.fn().mockResolvedValue({ id: 'default', name: 'Default Workspace' }),
    loadWorkspace: vi.fn().mockResolvedValue({ success: false }),
    ...overrides,
  }
}

const createMockTabsState = (overrides: Partial<UseTabsReturn> = {}): UseTabsReturn => {
  return {
    tabs: ref([]),
    activeTabIndex: ref(0),
    copyTabUrl: vi.fn().mockResolvedValue(undefined),
    isLoading: ref(false),
    createTabFromCurrentRoute: vi.fn().mockReturnValue({
      path: mockRoute.path,
      title: 'Test Tab',
    }),
    ...overrides,
  }
}

const eventBus = createWorkspaceEventBus()

describe('useSyncPath', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.path = '/workspace/default/document/drafts/overview'
    mockRoute.query = {}
    mockRoute.params = { workspaceSlug: 'default' }
  })

  it('returns isLoading ref', async () => {
    const workspaceSelectorState = createMockWorkspaceSelectorState()
    const tabsState = createMockTabsState()

    const { isLoading } = useSyncPath({ workspaceSelectorState, tabsState, eventBus })

    await nextTick()
    await flushPromises()

    expect(isLoading).toBeDefined()
    expect(isLoading.value).toBe(false)
  })

  it('persists current path to storage on route change', async () => {
    const workspaceSelectorState = createMockWorkspaceSelectorState()
    const tabsState = createMockTabsState()

    useSyncPath({ workspaceSelectorState, tabsState, eventBus })

    await nextTick()
    await flushPromises()

    expect(mockSetCurrentPath).toHaveBeenCalledWith('/workspace/default/document/drafts/overview')
  })

  it('calls loadWorkspace when workspace slug changes', async () => {
    const loadWorkspace = vi.fn().mockResolvedValue({ success: false })
    const workspaceSelectorState = createMockWorkspaceSelectorState({
      loadWorkspace,
      activeWorkspace: ref({ id: 'old-workspace', name: 'Old Workspace' }),
    })
    const tabsState = createMockTabsState()

    useSyncPath({ workspaceSelectorState, tabsState, eventBus })

    await nextTick()
    await flushPromises()

    // The slug is 'default' but active workspace is 'old-workspace', so it should load
    expect(loadWorkspace).toHaveBeenCalledWith('default')
  })

  it('navigates to tab path when workspace loads successfully with existing tab', async () => {
    const store = createWorkspaceStore()
    store.update('x-scalar-tabs', [{ path: '/workspace/default/document/drafts/requests', title: 'Requests Tab' }])
    store.update('x-scalar-active-tab', 0)

    const loadWorkspace = vi.fn().mockResolvedValue({
      success: true,
      workspace: store,
    })

    const workspaceSelectorState = createMockWorkspaceSelectorState({
      loadWorkspace,
      activeWorkspace: ref(null),
    })
    const tabsState = createMockTabsState()

    useSyncPath({ workspaceSelectorState, tabsState, eventBus })

    await nextTick()
    await flushPromises()

    expect(mockReplace).toHaveBeenCalledWith('/workspace/default/document/drafts/requests')
  })

  it('creates default workspace when loading fails', async () => {
    const createWorkspace = vi.fn().mockResolvedValue({ id: 'default', name: 'Default Workspace' })
    const loadWorkspace = vi.fn().mockResolvedValue({ success: false })

    const workspaceSelectorState = createMockWorkspaceSelectorState({
      loadWorkspace,
      createWorkspace,
      activeWorkspace: ref(null),
    })
    const tabsState = createMockTabsState()

    useSyncPath({ workspaceSelectorState, tabsState, eventBus })

    await nextTick()
    await flushPromises()

    expect(createWorkspace).toHaveBeenCalledWith({ name: 'Default Workspace', id: 'default' })
  })

  it('does not call loadWorkspace when workspace slug matches active workspace', async () => {
    const loadWorkspace = vi.fn().mockResolvedValue({ success: true, workspace: createWorkspaceStore() })

    const workspaceSelectorState = createMockWorkspaceSelectorState({
      loadWorkspace,
      activeWorkspace: ref({ id: 'default', name: 'Default Workspace' }),
    })
    const tabsState = createMockTabsState()

    useSyncPath({ workspaceSelectorState, tabsState, eventBus })

    await nextTick()
    await flushPromises()

    expect(loadWorkspace).not.toHaveBeenCalled()
  })

  it('clears store when changing workspace', async () => {
    const store = ref<WorkspaceStore | null>(createWorkspaceStore())
    const loadWorkspace = vi.fn().mockResolvedValue({ success: false })

    const workspaceSelectorState = createMockWorkspaceSelectorState({
      store,
      loadWorkspace,
      activeWorkspace: ref({ id: 'old-workspace', name: 'Old Workspace' }),
    })
    const tabsState = createMockTabsState()

    useSyncPath({ workspaceSelectorState, tabsState, eventBus })

    await nextTick()

    // Store should be cleared when switching workspaces
    expect(store.value).toBeNull()
  })

  it('updates tab when route path changes within same workspace', async () => {
    const store = createWorkspaceStore()
    store.update('x-scalar-tabs', [{ path: '/workspace/default/document/drafts/overview', title: 'Overview' }])
    store.update('x-scalar-active-tab', 0)

    const createTabFromCurrentRoute = vi.fn().mockReturnValue({
      path: '/workspace/default/document/drafts/requests',
      title: 'Requests',
    })

    const workspaceSelectorState = createMockWorkspaceSelectorState({
      store: ref(store),
      activeWorkspace: ref({ id: 'default', name: 'Default Workspace' }),
    })
    const tabsState = createMockTabsState({ createTabFromCurrentRoute })

    useSyncPath({ workspaceSelectorState, tabsState, eventBus })

    // Change the route path
    mockRoute.path = '/workspace/default/document/drafts/requests'

    await nextTick()
    await flushPromises()

    // Should call createTabFromCurrentRoute to update the tab
    expect(createTabFromCurrentRoute).toHaveBeenCalled()
  })

  it('does not update tab when route path matches current tab path', async () => {
    const store = createWorkspaceStore()
    store.update('x-scalar-tabs', [{ path: '/workspace/default/document/drafts/overview', title: 'Overview' }])
    store.update('x-scalar-active-tab', 0)

    const createTabFromCurrentRoute = vi.fn()

    const workspaceSelectorState = createMockWorkspaceSelectorState({
      store: ref(store),
      activeWorkspace: ref({ id: 'default', name: 'Default Workspace' }),
    })
    const tabsState = createMockTabsState({ createTabFromCurrentRoute })

    useSyncPath({ workspaceSelectorState, tabsState, eventBus })

    await nextTick()
    await flushPromises()

    // Route path matches tab path, so createTabFromCurrentRoute should not be called
    expect(createTabFromCurrentRoute).not.toHaveBeenCalled()
  })

  it('handles missing store gracefully when syncing', () => {
    const workspaceSelectorState = createMockWorkspaceSelectorState({
      store: ref(null),
      activeWorkspace: ref({ id: 'default', name: 'Default Workspace' }),
    })
    const tabsState = createMockTabsState()

    // Should not throw when store is null
    expect(() => {
      useSyncPath({ workspaceSelectorState, tabsState, eventBus })
    }).not.toThrow()
  })

  it('handles missing tabs gracefully', () => {
    const store = createWorkspaceStore()
    // No tabs set

    const workspaceSelectorState = createMockWorkspaceSelectorState({
      store: ref(store),
      activeWorkspace: ref({ id: 'default', name: 'Default Workspace' }),
    })
    const tabsState = createMockTabsState()

    // Should not throw when tabs are undefined
    expect(() => {
      useSyncPath({ workspaceSelectorState, tabsState, eventBus })
    }).not.toThrow()
  })

  it('sets isLoading to true during workspace change', async () => {
    let resolveLoadWorkspace: (value: { success: boolean }) => void
    const loadWorkspacePromise = new Promise<{ success: boolean }>((resolve) => {
      resolveLoadWorkspace = resolve
    })
    const loadWorkspace = vi.fn().mockReturnValue(loadWorkspacePromise)

    const workspaceSelectorState = createMockWorkspaceSelectorState({
      loadWorkspace,
      activeWorkspace: ref({ id: 'old-workspace', name: 'Old Workspace' }),
    })
    const tabsState = createMockTabsState()

    const { isLoading } = useSyncPath({ workspaceSelectorState, tabsState, eventBus })

    await nextTick()

    // isLoading should be true while loading
    expect(isLoading.value).toBe(true)

    // Resolve the promise
    resolveLoadWorkspace!({ success: false })
    await flushPromises()

    // isLoading should be false after loading completes
    expect(isLoading.value).toBe(false)
  })

  it('uses active tab index from workspace when navigating after successful load', async () => {
    const store = createWorkspaceStore()
    store.update('x-scalar-tabs', [
      { path: '/workspace/default/document/drafts/overview', title: 'Overview' },
      { path: '/workspace/default/document/drafts/requests', title: 'Requests' },
    ])
    store.update('x-scalar-active-tab', 1) // Second tab is active

    const loadWorkspace = vi.fn().mockResolvedValue({
      success: true,
      workspace: store,
    })

    const workspaceSelectorState = createMockWorkspaceSelectorState({
      loadWorkspace,
      activeWorkspace: ref(null),
    })
    const tabsState = createMockTabsState()

    useSyncPath({ workspaceSelectorState, tabsState, eventBus })

    await nextTick()
    await flushPromises()

    // Should navigate to the second tab (active tab)
    expect(mockReplace).toHaveBeenCalledWith('/workspace/default/document/drafts/requests')
  })

  it('defaults to first tab when active tab index is not set', async () => {
    const store = createWorkspaceStore()
    store.update('x-scalar-tabs', [
      { path: '/workspace/default/document/drafts/overview', title: 'Overview' },
      { path: '/workspace/default/document/drafts/requests', title: 'Requests' },
    ])
    // No active tab index set

    const loadWorkspace = vi.fn().mockResolvedValue({
      success: true,
      workspace: store,
    })

    const workspaceSelectorState = createMockWorkspaceSelectorState({
      loadWorkspace,
      activeWorkspace: ref(null),
    })
    const tabsState = createMockTabsState()

    useSyncPath({ workspaceSelectorState, tabsState, eventBus })

    await nextTick()
    await flushPromises()

    // Should navigate to the first tab (index 0)
    expect(mockReplace).toHaveBeenCalledWith('/workspace/default/document/drafts/overview')
  })
})
