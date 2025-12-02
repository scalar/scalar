import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useTabs } from '@/v2/hooks/use-tabs'

vi.mock('vue-router', () => ({
  useRoute: vi.fn().mockReturnValue({
    path: '/test-path',
  }),
}))

describe('useTabs', () => {
  it('if there are no tabs defined in the workspace, it should try to create them based on the currrent path', async () => {
    const workspaceStore = ref(createWorkspaceStore())
    const eventBus = createWorkspaceEventBus()

    const updateTabs = vi.fn()

    eventBus.on('tabs:update:tabs', updateTabs)

    expect(workspaceStore.value.workspace['x-scalar-tabs']).toBeUndefined()
    expect(workspaceStore.value.workspace['x-scalar-active-tab']).toBeUndefined()

    useTabs({
      workspaceStore,
      eventBus,
      getEntryByLocation: () => undefined,
      workspaceSlug: 'test-workspace',
      documentSlug: 'test-document',
      path: '/test-path',
      method: 'get',
    })

    await nextTick()

    expect(updateTabs).toHaveBeenCalledWith({
      'x-scalar-tabs': [
        {
          path: '/test-path',
          title: 'Untitled Tab',
        },
      ],
      'x-scalar-active-tab': 0,
    })
  })

  it('if there are tabs defined in the workspace, it should not create a new tab', async () => {
    const workspaceStore = ref(createWorkspaceStore())
    const eventBus = createWorkspaceEventBus()

    const updateTabs = vi.fn()

    eventBus.on('tabs:update:tabs', updateTabs)

    // Create the tabs
    workspaceStore.value.update('x-scalar-tabs', [{ path: '/test-path', title: 'Test Document' }])

    const { tabs } = useTabs({
      workspaceStore,
      eventBus,
      getEntryByLocation: () => undefined,
      workspaceSlug: 'test-workspace',
      documentSlug: 'test-document',
      path: '/test-path',
      method: 'get',
    })

    await nextTick()

    expect(updateTabs).not.toHaveBeenCalled()
    expect(tabs.value).toEqual([{ path: '/test-path', title: 'Test Document' }])
  })

  it('should default the active tab index to 0 if not set', async () => {
    const workspaceStore = ref(createWorkspaceStore())
    const eventBus = createWorkspaceEventBus()

    expect(workspaceStore.value.workspace['x-scalar-active-tab']).toBeUndefined()

    const { activeTabIndex } = useTabs({
      workspaceStore,
      eventBus,
      getEntryByLocation: () => undefined,
      workspaceSlug: 'test-workspace',
      documentSlug: 'test-document',
      path: '/test-path',
      method: 'get',
    })

    await nextTick()

    expect(activeTabIndex.value).toBe(0)
  })

  it('createTabFromCurrentRoute returns Untitled Tab when workspace is not provided', () => {
    const workspaceStore = ref(createWorkspaceStore())
    const eventBus = createWorkspaceEventBus()

    const { createTabFromCurrentRoute } = useTabs({
      workspaceStore,
      eventBus,
      getEntryByLocation: () => undefined,
      workspaceSlug: undefined,
      documentSlug: undefined,
      path: undefined,
      method: undefined,
    })

    const tab = createTabFromCurrentRoute()

    expect(tab).toEqual({
      title: 'Untitled Tab',
      path: '/test-path',
    })
  })

  it('createTabFromCurrentRoute returns Workspace title when workspace is provided without document', () => {
    const workspaceStore = ref(createWorkspaceStore())
    const eventBus = createWorkspaceEventBus()

    const { createTabFromCurrentRoute } = useTabs({
      workspaceStore,
      eventBus,
      getEntryByLocation: () => undefined,
      workspaceSlug: 'my-workspace',
      documentSlug: undefined,
      path: undefined,
      method: undefined,
    })

    const tab = createTabFromCurrentRoute()

    expect(tab).toEqual({
      title: 'Workspace',
      path: '/test-path',
    })
  })

  it('createTabFromCurrentRoute returns document icon when entry type is document', () => {
    const workspaceStore = ref(createWorkspaceStore())
    const eventBus = createWorkspaceEventBus()

    const { createTabFromCurrentRoute } = useTabs({
      workspaceStore,
      eventBus,
      getEntryByLocation: () => ({
        id: 'doc-123',
        type: 'document',
        title: 'API Documentation',
        children: [],
        name: 'api-docs',
      }),
      workspaceSlug: 'my-workspace',
      documentSlug: 'my-document',
      path: '/users',
      method: 'get',
    })

    const tab = createTabFromCurrentRoute()

    expect(tab).toEqual({
      title: 'API Documentation',
      icon: 'document',
      path: '/test-path',
    })
  })

  it('createTabFromCurrentRoute returns request icon when entry type is operation', () => {
    const workspaceStore = ref(createWorkspaceStore())
    const eventBus = createWorkspaceEventBus()

    const { createTabFromCurrentRoute } = useTabs({
      workspaceStore,
      eventBus,
      getEntryByLocation: () => ({
        id: 'op-123',
        type: 'operation',
        title: 'Get Users',
        method: 'get',
        path: '/users',
        ref: '#/paths/~1users/get',
      }),
      workspaceSlug: 'my-workspace',
      documentSlug: 'my-document',
      path: '/users',
      method: 'get',
    })

    const tab = createTabFromCurrentRoute()

    expect(tab).toEqual({
      title: 'Get Users',
      icon: 'request',
      path: '/test-path',
    })
  })

  it('createTabFromCurrentRoute returns Untitled Tab when document is provided but entry is not found', () => {
    const workspaceStore = ref(createWorkspaceStore())
    const eventBus = createWorkspaceEventBus()

    const { createTabFromCurrentRoute } = useTabs({
      workspaceStore,
      eventBus,
      getEntryByLocation: () => undefined,
      workspaceSlug: 'my-workspace',
      documentSlug: 'my-document',
      path: '/unknown-path',
      method: 'get',
    })

    const tab = createTabFromCurrentRoute()

    expect(tab).toEqual({
      title: 'Untitled Tab',
      path: '/test-path',
    })
  })

  it('createTabFromCurrentRoute uses route path regardless of the path parameter', () => {
    const workspaceStore = ref(createWorkspaceStore())
    const eventBus = createWorkspaceEventBus()

    const { createTabFromCurrentRoute } = useTabs({
      workspaceStore,
      eventBus,
      getEntryByLocation: () => undefined,
      workspaceSlug: 'my-workspace',
      documentSlug: 'my-document',
      path: '/api/users',
      method: 'post',
    })

    const tab = createTabFromCurrentRoute()

    // The tab path should be from the route (/test-path), not from the path parameter
    expect(tab.path).toBe('/test-path')
  })
})
