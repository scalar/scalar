import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'

import { useWorkspaceSelector } from '@/v2/hooks/use-workspace-selector'

import 'fake-indexeddb/auto'

import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'

import { useTabs } from '@/v2/hooks/use-tabs'

import { useSyncPath } from './use-sync-path'

const mockRoute = reactive({
  path: '/workspace/default/document/drafts/overview',
  query: {} as Record<string, string>,
  params: {
    workspaceSlug: 'default',
  },
})

const mockPush = vi.fn().mockResolvedValue(undefined)

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('useSyncPath', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockRoute.path = '/workspace/default/document/drafts/overview'
    mockRoute.query = {}
    mockRoute.params = { workspaceSlug: 'default' }
  })

  it('does not call router.push when tab path matches current route', async () => {
    const workspaceStore = ref(createWorkspaceStore())

    // Set the tabs in the workspace store
    workspaceStore.value.update('x-scalar-tabs', [
      { path: '/workspace/default/document/drafts/overview', title: 'Overview' },
    ])
    workspaceStore.value.update('x-scalar-active-tab', 0)

    const eventBus = createWorkspaceEventBus()
    const workspaceSelectorState = useWorkspaceSelector()
    const tabsState = useTabs({
      workspaceStore,
      eventBus,
      workspaceSlug: 'default',
      documentSlug: 'drafts',
      path: '/overview',
      method: 'get',
      getEntryByLocation: () => undefined,
    })

    useSyncPath({ workspaceSelectorState, tabsState })

    await nextTick()

    // Allow watchers to run
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('calls router.push when tab path differs from current route', async () => {
    const workspaceStore = ref(createWorkspaceStore())

    // Set a tab with a different path than the current route
    workspaceStore.value.update('x-scalar-tabs', [
      { path: '/workspace/default/document/drafts/requests', title: 'Requests' },
    ])
    workspaceStore.value.update('x-scalar-active-tab', 0)

    const eventBus = createWorkspaceEventBus()
    const workspaceSelectorState = useWorkspaceSelector()

    // Manually set the store since useWorkspaceSelector starts with null
    workspaceSelectorState.store.value = workspaceStore.value

    const tabsState = useTabs({
      workspaceStore,
      eventBus,
      workspaceSlug: 'default',
      documentSlug: 'drafts',
      path: '/overview',
      method: 'get',
      getEntryByLocation: () => undefined,
    })

    useSyncPath({ workspaceSelectorState, tabsState })

    await nextTick()

    expect(mockPush).toHaveBeenCalledWith('/workspace/default/document/drafts/requests')
  })

  it('returns isLoading ref set to false when sync completes', async () => {
    const workspaceStore = ref(createWorkspaceStore())

    workspaceStore.value.update('x-scalar-tabs', [
      { path: '/workspace/default/document/drafts/overview', title: 'Overview' },
    ])
    workspaceStore.value.update('x-scalar-active-tab', 0)

    const eventBus = createWorkspaceEventBus()
    const workspaceSelectorState = useWorkspaceSelector()
    workspaceSelectorState.store.value = workspaceStore.value

    const tabsState = useTabs({
      workspaceStore,
      eventBus,
      workspaceSlug: 'default',
      documentSlug: 'drafts',
      path: '/overview',
      method: 'get',
      getEntryByLocation: () => undefined,
    })

    const { isLoading } = useSyncPath({ workspaceSelectorState, tabsState })

    await nextTick()

    expect(isLoading.value).toBe(false)
  })

  it('does not call router.push when store is null', async () => {
    const workspaceStore = ref(createWorkspaceStore())

    const eventBus = createWorkspaceEventBus()
    const workspaceSelectorState = useWorkspaceSelector()

    // Ensure store is null
    workspaceSelectorState.store.value = null

    const tabsState = useTabs({
      workspaceStore,
      eventBus,
      workspaceSlug: 'default',
      documentSlug: 'drafts',
      path: '/overview',
      method: 'get',
      getEntryByLocation: () => undefined,
    })

    useSyncPath({ workspaceSelectorState, tabsState })

    await nextTick()

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not call router.push when no tabs exist', async () => {
    const workspaceStore = ref(createWorkspaceStore())

    // Do not set any tabs
    workspaceStore.value.update('x-scalar-tabs', [])
    workspaceStore.value.update('x-scalar-active-tab', 0)

    const eventBus = createWorkspaceEventBus()
    const workspaceSelectorState = useWorkspaceSelector()
    workspaceSelectorState.store.value = workspaceStore.value

    const tabsState = useTabs({
      workspaceStore,
      eventBus,
      workspaceSlug: 'default',
      documentSlug: 'drafts',
      path: '/overview',
      method: 'get',
      getEntryByLocation: () => undefined,
    })

    useSyncPath({ workspaceSelectorState, tabsState })

    await nextTick()

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('handles multiple tabs with correct active tab index', async () => {
    const workspaceStore = ref(createWorkspaceStore())

    // Set multiple tabs with the second one as active
    workspaceStore.value.update('x-scalar-tabs', [
      { path: '/workspace/default/document/drafts/overview', title: 'Overview' },
      { path: '/workspace/default/document/drafts/requests', title: 'Requests' },
      { path: '/workspace/default/document/drafts/schemas', title: 'Schemas' },
    ])
    workspaceStore.value.update('x-scalar-active-tab', 1)

    const eventBus = createWorkspaceEventBus()
    const workspaceSelectorState = useWorkspaceSelector()
    workspaceSelectorState.store.value = workspaceStore.value

    const tabsState = useTabs({
      workspaceStore,
      eventBus,
      workspaceSlug: 'default',
      documentSlug: 'drafts',
      path: '/overview',
      method: 'get',
      getEntryByLocation: () => undefined,
    })

    useSyncPath({ workspaceSelectorState, tabsState })

    await nextTick()

    // Should push to the second tab's path (index 1)
    expect(mockPush).toHaveBeenCalledWith('/workspace/default/document/drafts/requests')
  })
})
