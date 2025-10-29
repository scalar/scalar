// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { ROUTES } from '@/v2/features/app/helpers/routes'

import WorkspaceCollection from './WorkspaceCollection.vue'

// Mock ResizeObserver
window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

describe('WorkspaceCollection', () => {
  const createRouterInstance = () => {
    return createRouter({
      history: createWebHistory(),
      routes: ROUTES,
    })
  }

  const mountWithRouter = async (routeName = 'workspace.overview') => {
    const router = createRouterInstance()

    // Push to a specific workspace route
    await router.push({
      name: routeName,
      params: { workspaceSlug: 'test-workspace' },
    })

    const wrapper = mount(WorkspaceCollection, {
      props: {
        layout: 'web' as const,
        workspaceStore: {} as any,
        eventBus: {} as any,
        document: null,
      },
      global: {
        plugins: [router],
        stubs: {
          ScalarIconGlobe: true,
        },
      },
    })

    await router.isReady()

    return { wrapper, router }
  }

  describe('title rendering', () => {
    it('renders the component', async () => {
      const { wrapper } = await mountWithRouter()

      expect(wrapper.exists()).toBe(true)
    })

    it('renders the workspace title', async () => {
      const { wrapper } = await mountWithRouter()

      expect(wrapper.text()).toContain('Workspace Title [replace with name]')
    })

    it('renders the title with proper aria-label', async () => {
      const { wrapper } = await mountWithRouter()

      const titleContainer = wrapper.find('[aria-label^="title:"]')
      expect(titleContainer.exists()).toBe(true)
      expect(titleContainer.attributes('aria-label')).toBe('title: Workspace Title [replace with name]')
    })

    it('renders the globe icon', async () => {
      const { wrapper } = await mountWithRouter()

      const icon = wrapper.findComponent({ name: 'ScalarIconGlobe' })
      expect(icon.exists()).toBe(true)
    })
  })
})
