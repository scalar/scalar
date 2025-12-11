import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useTabs } from '@/v2/features/app/hooks/use-tabs'

vi.mock('vue-router', () => ({
  useRoute: vi.fn().mockReturnValue({
    path: '/test-path',
  }),
}))

describe('useTabs', () => {
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
