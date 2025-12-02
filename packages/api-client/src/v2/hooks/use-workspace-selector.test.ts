import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import 'fake-indexeddb/auto'

import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceStorePersistence } from '@scalar/workspace-store/persistence'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

import { ROUTE_QUERIES } from '@/v2/features/app/helpers/routes'
import { useWorkspaceSelector } from '@/v2/hooks/use-workspace-selector'

const push = vi.fn()

// Mock the router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push,
  })),
}))

describe('useWorkspaceSelector', { concurrent: false, sequential: false, timeout: 50_000 }, () => {
  const persistencePromise = createWorkspaceStorePersistence()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    const persistence = await persistencePromise
    await persistence.clear()
  })

  it('initializes with null store and empty workspaces', async () => {
    const { store, activeWorkspace, workspaces } = useWorkspaceSelector()

    expect(store.value).toBeNull()
    expect(activeWorkspace.value).toBeNull()

    await nextTick()
    await flushPromises()

    expect(workspaces.value).toHaveLength(0)
  })

  it('returns false when loading a workspace that does not exist', async () => {
    const { loadWorkspace, store } = useWorkspaceSelector()

    await nextTick()
    await flushPromises()

    const result = await loadWorkspace('non-existent-workspace')

    expect(result).toBe(false)
    expect(store.value).toBeNull()
  })

  it('loads an existing workspace successfully', async () => {
    const persistence = await persistencePromise
    await persistence.workspace.setItem('some-workspace', {
      name: 'Test Workspace',
      workspace: createWorkspaceStore().exportWorkspace(),
    })

    const { loadWorkspace, activeWorkspace, store } = useWorkspaceSelector()

    await nextTick()
    await flushPromises()

    const result = await loadWorkspace('some-workspace')

    expect(result).toBe(true)
    expect(store.value).not.toBeNull()
    expect(activeWorkspace.value).toEqual({
      id: 'some-workspace',
      name: 'Test Workspace',
    })
  })

  it('populates workspaces list on mount', async () => {
    const persistence = await persistencePromise
    await persistence.workspace.setItem('workspace-1', {
      name: 'Workspace 1',
      workspace: createWorkspaceStore().exportWorkspace(),
    })
    await persistence.workspace.setItem('workspace-2', {
      name: 'Workspace 2',
      workspace: createWorkspaceStore().exportWorkspace(),
    })

    const { workspaces } = useWorkspaceSelector()

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(workspaces.value).toHaveLength(2)
  })

  it('navigates to workspace route when setWorkspaceId is called', async () => {
    const { setWorkspaceId } = useWorkspaceSelector()

    await setWorkspaceId('some-workspace')

    expect(push).toHaveBeenCalledWith({
      name: 'workspace.environment',
      params: { workspaceSlug: 'some-workspace' },
      query: { [ROUTE_QUERIES.LOAD_FROM_SESSION]: 'true' },
    })
  })

  it('creates a new workspace with a drafts document', async () => {
    const persistence = await persistencePromise

    const { createWorkspace, workspaces } = useWorkspaceSelector()

    await nextTick()
    await flushPromises()

    await createWorkspace({ name: 'New Workspace' })

    await nextTick()
    await flushPromises()

    // Check that router navigation was called
    expect(push).toHaveBeenCalledWith({
      name: 'workspace.environment',
      params: { workspaceSlug: 'new-workspace' },
      query: { [ROUTE_QUERIES.LOAD_FROM_SESSION]: undefined },
    })

    // Check that the workspace was persisted
    const allWorkspaces = await persistence.workspace.getAll()
    expect(allWorkspaces).toHaveLength(1)

    // Check that the workspace was added to the list
    expect(workspaces.value).toHaveLength(1)
    expect(workspaces.value[0]).toEqual({ id: 'new-workspace', name: 'New Workspace' })
  })

  it('generates unique workspace id when name already exists', async () => {
    const persistence = await persistencePromise
    await persistence.workspace.setItem('new-workspace', {
      name: 'New Workspace',
      workspace: createWorkspaceStore().exportWorkspace(),
    })

    const { createWorkspace } = useWorkspaceSelector()

    await nextTick()
    await flushPromises()

    await createWorkspace({ name: 'New Workspace' })

    await nextTick()
    await flushPromises()

    // Should navigate to a unique slug (not 'new-workspace' since that exists)
    expect(push).toHaveBeenCalled()
    const callArg = push.mock.calls[0]?.[0] as { name: string; params: { workspaceSlug: string } } | undefined
    expect(callArg).toBeDefined()
    expect(callArg?.name).toBe('workspace.environment')
    expect(callArg?.params.workspaceSlug).not.toBe('new-workspace')
  })

  it('clears store when creating a new workspace', async () => {
    const persistence = await persistencePromise
    await persistence.workspace.setItem('existing-workspace', {
      name: 'Existing',
      workspace: createWorkspaceStore().exportWorkspace(),
    })

    const { loadWorkspace, createWorkspace, store } = useWorkspaceSelector()

    await nextTick()
    await flushPromises()

    // Load an existing workspace first
    await loadWorkspace('existing-workspace')
    expect(store.value).not.toBeNull()

    // Start creating a new workspace - store should be cleared
    const createPromise = createWorkspace({ name: 'Another Workspace' })
    expect(store.value).toBeNull()

    await createPromise
  })
})
