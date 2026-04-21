import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceStorePersistence } from '@scalar/workspace-store/persistence'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import 'fake-indexeddb/auto'

import { createAppState } from './app-state'
import { ROUTES } from './helpers/routes'

const persistWorkspace = async ({
  namespace = 'local',
  slug,
  name = 'Test Workspace',
  tabs,
}: {
  namespace?: string
  slug: string
  name?: string
  tabs?: { path: string; title: string }[]
}) => {
  const store = createWorkspaceStore()

  if (tabs) {
    store.workspace['x-scalar-tabs'] = tabs
    store.workspace['x-scalar-active-tab'] = 0
  }

  const persistence = await createWorkspaceStorePersistence()
  await persistence.workspace.setItem({ namespace, slug }, { name, workspace: store.exportWorkspace() })
}

const setupRouter = () => createRouter({ history: createMemoryHistory(), routes: ROUTES })

const waitForNavigation = async () => {
  await nextTick()
  await flushPromises()
  // Multiple flushes are needed to drain the nested promise chain (IndexedDB load → router.replace → afterEach again).
  await flushPromises()
  await flushPromises()
}

describe('app-state', () => {
  it('preserves the initial route when workspace has saved tabs on first load', async () => {
    const savedTabPath = '/@local/preserve-route/document/drafts/servers'
    await persistWorkspace({
      slug: 'preserve-route',
      tabs: [{ path: savedTabPath, title: 'Saved Tab' }],
    })

    const router = setupRouter()
    await createAppState({ router })

    await router.push({
      name: 'document.overview',
      params: { namespace: 'local', workspaceSlug: 'preserve-route', documentSlug: 'drafts' },
    })
    await router.isReady()
    await waitForNavigation()

    // The URL routing should take precedence over the saved tab on initial load
    expect(router.currentRoute.value.name).toBe('document.overview')
    expect(router.currentRoute.value.path).not.toBe(savedTabPath)
  })

  it('stays on the current route when workspace has no saved tabs on initial load', async () => {
    await persistWorkspace({ slug: 'no-tabs' })

    const router = setupRouter()
    await createAppState({ router })

    await router.push({
      name: 'document.overview',
      params: { namespace: 'local', workspaceSlug: 'no-tabs', documentSlug: 'drafts' },
    })
    await router.isReady()
    await waitForNavigation()

    expect(router.currentRoute.value.name).toBe('document.overview')
  })

  it('redirects to the saved tab path when switching workspaces after initial load', async () => {
    const savedTabPath = '/@local/switch-target/document/drafts/servers'
    await persistWorkspace({ slug: 'switch-source' })
    await persistWorkspace({
      slug: 'switch-target',
      tabs: [{ path: savedTabPath, title: 'Saved Tab' }],
    })

    const router = setupRouter()
    await createAppState({ router })

    // Initial load on workspace A — consumes the isInitialLoad flag
    await router.push({
      name: 'document.overview',
      params: { namespace: 'local', workspaceSlug: 'switch-source', documentSlug: 'drafts' },
    })
    await router.isReady()
    await waitForNavigation()

    // Switch to workspace B which has a saved tab
    await router.push({
      name: 'document.overview',
      params: { namespace: 'local', workspaceSlug: 'switch-target', documentSlug: 'drafts' },
    })

    // changeWorkspace is async/fire-and-forget from router.afterEach, so poll until the redirect lands
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe(savedTabPath)
    })
  })
})
