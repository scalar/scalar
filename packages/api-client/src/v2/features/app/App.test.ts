import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import App from './App.vue'

/**
 * Critical tests for the main App component
 * Tests focus on core functionality like theme generation, environment merging, and layout rendering
 */
describe('App', () => {
  let mockWorkspaceStore: WorkspaceStore

  beforeEach(() => {
    // Mock workspace store with minimal required structure
    mockWorkspaceStore = {
      workspace: {
        'x-scalar-theme': 'default',
        'x-scalar-active-environment': 'prod',
        'x-scalar-environments': {
          prod: {
            variables: [{ name: 'BASE_URL', value: 'https://api.prod.com' }],
          },
        },
        'x-scalar-sidebar-width': 300,
        documents: {
          doc1: {
            uid: 'doc1',
            info: {
              title: 'Test Document',
            },
            'x-scalar-environments': {
              prod: {
                variables: [{ name: 'API_KEY', value: 'prod-key-123' }],
              },
            },
          },
        },
      },
      update: vi.fn(),
    } as any

    // Mock getThemeStyles
    vi.mock('@scalar/themes', () => ({
      getThemeStyles: vi.fn(() => 'body { color: red; }'),
    }))

    // Mock useColorMode
    vi.mock('@scalar/use-hooks/useColorMode', () => ({
      useColorMode: vi.fn(() => ({ colorMode: 'light' })),
    }))

    // Mock vue-router
    vi.mock('vue-router', () => ({
      RouterView: {
        name: 'RouterView',
        template: '<div class="router-view"><slot /></div>',
      },
      useRoute: () => ({
        params: { documentSlug: 'doc1' },
      }),
    }))

    // Mock workspace client events
    vi.mock('@/v2/hooks/use-workspace-client-events', () => ({
      useWorkspaceClientEvents: vi.fn(),
    }))
  })

  it('generates theme style tag from workspace theme configuration', async () => {
    const wrapper = mount(App, {
      props: {
        layout: 'web',
        workspaceStore: mockWorkspaceStore,
      },
    })

    await nextTick()

    /**
     * Theme styles should be dynamically generated based on the workspace theme ID
     * This is critical for maintaining consistent theming across the application
     */
    const html = wrapper.html()
    expect(html).toContain('<style>')
  })

  it('merges workspace and document environment variables correctly', async () => {
    const wrapper = mount(App, {
      props: {
        layout: 'web',
        workspaceStore: mockWorkspaceStore,
      },
    })

    await nextTick()

    /**
     * Environment variables from both workspace and document levels should be merged
     * This ensures that document-specific overrides work correctly with workspace defaults
     */
    const vm = wrapper.vm as any
    expect(vm.environment.variables).toHaveLength(2)
    expect(vm.environment.variables[0].name).toBe('BASE_URL')
    expect(vm.environment.variables[1].name).toBe('API_KEY')
  })

  it('selects the correct document based on route params', async () => {
    const wrapper = mount(App, {
      props: {
        layout: 'web',
        workspaceStore: mockWorkspaceStore,
      },
    })

    await nextTick()

    /**
     * The document should be selected based on the route slug parameter
     * This is critical for displaying the correct document in the editor
     */
    const vm = wrapper.vm as any
    expect(vm.document).toBeDefined()
    expect(vm.document.uid).toBe('doc1')
  })

  it('renders DesktopTabs for desktop layout', async () => {
    const wrapper = mount(App, {
      props: {
        layout: 'desktop',
        workspaceStore: mockWorkspaceStore,
      },
    })

    await nextTick()

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
    const wrapper = mount(App, {
      props: {
        layout: 'web',
        workspaceStore: mockWorkspaceStore,
      },
    })

    await nextTick()

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
