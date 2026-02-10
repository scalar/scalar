import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceStorePersistence } from '@scalar/workspace-store/persistence'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import 'fake-indexeddb/auto'

import { useCommandPaletteState } from '@/v2/features/command-palette/hooks/use-command-palette-state'

import App from './App.vue'
import { createAppState } from './app-state'
import { ROUTES } from './helpers/routes'

/**
 * Critical tests for the main App component
 * Tests focus on core functionality like theme generation, environment merging, and layout rendering
 */
describe('App', () => {
  const WORKSPACE_NAMESPACE = 'local'
  const WORKSPACE_SLUG = 'default'
  const DOCUMENT_ID = 'doc1'

  const setupWorkspace = async () => {
    const store = createWorkspaceStore()
    // Configure workspace-level settings

    store.workspace['x-scalar-active-environment'] = 'prod'
    store.workspace['x-scalar-environments'] = {
      prod: {
        color: '#FFFFFF',
        variables: [{ name: 'BASE_URL', value: 'https://api.prod.com' }],
      },
    }
    store.workspace['x-scalar-theme'] = 'default'
    store.workspace['x-scalar-sidebar-width'] = 300

    // Add a document with its own environment overrides
    await store.addDocument({
      name: DOCUMENT_ID,
      document: {
        openapi: '3.1.0',
        info: { title: 'Test Document', version: '1.0.0' },
        paths: {},
        'x-scalar-environments': {
          prod: {
            variables: [{ name: 'API_KEY', value: 'prod-key-123' }],
          },
        },
      } as any,
    })

    const persistence = await createWorkspaceStorePersistence()
    await persistence.workspace.setItem(
      { namespace: WORKSPACE_NAMESPACE, slug: WORKSPACE_SLUG },
      {
        name: 'Default',
        workspace: store.exportWorkspace(),
      },
    )
  }

  const setupApp = async (layout: 'web' | 'desktop' = 'web') => {
    await setupWorkspace()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: ROUTES,
    })

    const appState = await createAppState({ router })

    await router.push({
      name: 'document.overview',
      params: { namespace: WORKSPACE_NAMESPACE, workspaceSlug: WORKSPACE_SLUG, documentSlug: DOCUMENT_ID },
    })

    await router.isReady()

    const commandPaletteState = useCommandPaletteState()

    const wrapper = mount(App, {
      props: {
        layout,
        getAppState: () => appState,
        getCommandPaletteState: () => commandPaletteState,
      },
      global: {
        plugins: [router],
      },
    })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 500))

    return { wrapper, appState, router }
  }

  it('generates theme style tag from workspace theme configuration', async () => {
    const { wrapper } = await setupApp()

    /**
     * Theme styles should be dynamically generated based on the workspace theme ID
     * This is critical for maintaining consistent theming across the application
     */
    const html = wrapper.html()
    expect(html).toContain('<style>')
  })

  it('merges workspace and document environment variables correctly', async () => {
    const { appState } = await setupApp()

    /**
     * Environment variables from both workspace and document levels should be merged
     * This ensures that document-specific overrides work correctly with workspace defaults
     */
    expect(appState.store.value?.workspace['x-scalar-environments']).toEqual({
      prod: {
        color: '#FFFFFF',
        variables: [{ name: 'BASE_URL', value: 'https://api.prod.com' }],
      },
    })
    expect(appState.environment.value.variables).toHaveLength(2)
    expect(appState.environment.value.variables?.[0]?.name).toBe('BASE_URL')
    expect(appState.environment.value.variables?.[1]?.name).toBe('API_KEY')
  })

  it('selects the correct document based on route params', async () => {
    const { appState } = await setupApp()

    /**
     * The document should be selected based on the route slug parameter
     * This is critical for displaying the correct document in the editor
     */
    expect(appState.document.value).toBeDefined()
    expect(appState.document.value?.info.title).toBe('Test Document')
  })

  it('renders DesktopTabs for desktop layout', async () => {
    const { wrapper } = await setupApp('desktop')

    /**
     * Desktop layout should show DesktopTabs instead of WebTopNav
     * This ensures the correct navigation UI is rendered based on the environment
     */
    const desktopTabs = wrapper.findComponent({ name: 'DesktopTabs' })
    const webTopNav = wrapper.findComponent({ name: 'WebTopNav' })

    expect(desktopTabs.exists()).toBe(true)
    expect(webTopNav.exists()).toBe(false)
  })

  it('renders WebTopNav for web layout', async () => {
    const { wrapper } = await setupApp('web')

    /**
     * Web layout should show WebTopNav instead of DesktopTabs
     * This is critical for maintaining the correct UI in browser-based environments
     */
    const webTopNav = wrapper.findComponent({ name: 'WebTopNav' })
    const desktopTabs = wrapper.findComponent({ name: 'DesktopTabs' })

    expect(webTopNav.exists()).toBe(true)
    expect(desktopTabs.exists()).toBe(false)
  })
})
