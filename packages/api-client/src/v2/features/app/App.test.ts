import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceStorePersistence } from '@scalar/workspace-store/persistence'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import 'fake-indexeddb/auto'

import App from './App.vue'

/**
 * Mock vue-router to avoid router setup in tests
 */
vi.mock('vue-router', () => ({
  RouterView: {
    name: 'RouterView',
    template: '<div class="router-view"><slot /></div>',
  },
  useRoute: () => ({
    params: { workspaceSlug: 'default', documentSlug: 'doc1' },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

/**
 * Critical tests for the main App component
 * Tests focus on core functionality like theme generation, environment merging, and layout rendering
 */
describe('App', () => {
  const WORKSPACE_ID = 'default'
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
    await persistence.workspace.setItem(WORKSPACE_ID, {
      name: 'Default',
      workspace: store.exportWorkspace(),
    })
  }

  it('generates theme style tag from workspace theme configuration', async () => {
    await setupWorkspace()
    const wrapper = mount(App, {
      props: {
        layout: 'web',
      },
    })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 500))

    /**
     * Theme styles should be dynamically generated based on the workspace theme ID
     * This is critical for maintaining consistent theming across the application
     */
    const html = wrapper.html()
    expect(html).toContain('<style>')
  })

  it('merges workspace and document environment variables correctly', async () => {
    await setupWorkspace()
    const wrapper = mount(App, {
      props: {
        layout: 'web',
      },
    })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 500))

    /**
     * Environment variables from both workspace and document levels should be merged
     * This ensures that document-specific overrides work correctly with workspace defaults
     */
    const vm = wrapper.vm as any
    expect(vm.store.workspace['x-scalar-environments']).toEqual({
      prod: {
        color: '#FFFFFF',
        variables: [{ name: 'BASE_URL', value: 'https://api.prod.com' }],
      },
    })
    expect(vm.environment.variables).toHaveLength(2)
    expect(vm.environment.variables[0].name).toBe('BASE_URL')
    expect(vm.environment.variables[1].name).toBe('API_KEY')
  })

  it('selects the correct document based on route params', async () => {
    await setupWorkspace()
    const wrapper = mount(App, {
      props: {
        layout: 'web',
      },
    })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 500))

    /**
     * The document should be selected based on the route slug parameter
     * This is critical for displaying the correct document in the editor
     */
    const vm = wrapper.vm as any
    expect(vm.document).toBeDefined()
    expect(vm.document.info.title).toBe('Test Document')
  })

  it('renders DesktopTabs for desktop layout', async () => {
    await setupWorkspace()
    const wrapper = mount(App, {
      props: {
        layout: 'desktop',
      },
    })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 500))

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
    await setupWorkspace()
    const wrapper = mount(App, {
      props: {
        layout: 'web',
      },
    })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 500))

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
