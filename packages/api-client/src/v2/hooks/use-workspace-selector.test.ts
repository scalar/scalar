import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest'

import 'fake-indexeddb/auto'

import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceStorePersistence } from '@scalar/workspace-store/persistence'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

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

  it('should not do anything if there is no selected workspace', async () => {
    const { store } = useWorkspaceSelector({ workspaceId: undefined })

    await nextTick()

    expect(store.value).toBeNull()
  })

  it('should create a default workspace with a draft document when the default workspace is selected', async () => {
    const persistence = await persistencePromise
    const workspaces = await persistence.workspace.getAll()

    // check that no workspaces exist
    expect(workspaces).toHaveLength(0)

    const { store } = useWorkspaceSelector({ workspaceId: 'default' })

    await nextTick()
    await flushPromises()

    // We are loading documents from an url so it takes a while to load
    await new Promise((resolve) => setTimeout(resolve, 10_000))

    expect(store.value).not.toBeNull()
    assert(store.value)
    expect(store.value.workspace.documents['draft']).not.toBeNull()

    assert(store.value.workspace.documents['draft'])
    expect(store.value.workspace.documents['draft'].info?.title).toBe('Draft')
    expect(store.value.workspace.documents['draft'].openapi).toBe('3.1.0')
    expect(store.value.workspace.documents['draft'].paths).not.toBeNull()

    // check that a workspace was created
    expect(await persistence.workspace.getAll()).toHaveLength(1)
  })

  it('should navigate the user to the default route when the selected workspace is not found', async () => {
    useWorkspaceSelector({ workspaceId: 'some-workspace-id' })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 100))

    // check that the route is the default route
    expect(push).toHaveBeenCalledWith({ name: 'workspace', params: { workspaceSlug: 'default' } })
  })

  it('should load the first workspace when the default workspace is selected and no workspaces exist', async () => {
    // Create a dummy workspace
    const persistence = await persistencePromise
    await persistence.workspace.setItem('some-workspace', {
      name: 'Default',
      workspace: createWorkspaceStore().exportWorkspace(),
    })

    const { activeWorkspace } = useWorkspaceSelector({ workspaceId: 'some-workspace' })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(activeWorkspace.value).toEqual({
      id: 'some-workspace',
      name: 'Default',
    })
  })

  it('should create and navigate to the new workspace', async () => {
    const persistence = await persistencePromise
    const { activeWorkspace, createWorkspace } = useWorkspaceSelector({ workspaceId: 'default' })

    await nextTick()
    await flushPromises()
    // change the timeout when we remove the loading default documents
    await new Promise((resolve) => setTimeout(resolve, 10_000))

    expect(activeWorkspace.value).not.toBeNull()
    assert(activeWorkspace.value)
    expect(activeWorkspace.value.id).toBe('default')
    expect(activeWorkspace.value.name).toBe('Default Workspace')

    // create a new workspace
    await createWorkspace({ name: 'New Workspace' })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 10_000))

    // this will set the active workspace to the new workspace
    expect(push).toHaveBeenCalledWith({ name: 'workspace', params: { workspaceSlug: 'new-workspace' } })

    // check that a workspace was created
    expect(await persistence.workspace.getAll()).toHaveLength(2)
  })

  it('should load an existing workspace when the workspace is selected', async () => {
    const persistence = await persistencePromise
    await persistence.workspace.setItem('some-workspace', {
      name: 'Default',
      workspace: createWorkspaceStore().exportWorkspace(),
    })

    const { activeWorkspace } = useWorkspaceSelector({ workspaceId: 'some-workspace' })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(activeWorkspace.value).not.toBeNull()
    assert(activeWorkspace.value)
    expect(activeWorkspace.value.id).toBe('some-workspace')
    expect(activeWorkspace.value.name).toBe('Default')
  })

  it('should navigate to the worksapce when the workspace is selected', async () => {
    const { setWorkspaceId } = useWorkspaceSelector({ workspaceId: 'some-workspace' })

    setWorkspaceId('some-workspace')

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(push).toHaveBeenCalledWith({ name: 'workspace', params: { workspaceSlug: 'some-workspace' } })
  })
})
