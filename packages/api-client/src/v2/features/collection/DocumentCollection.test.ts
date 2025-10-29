// @vitest-environment jsdom

import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { ROUTES } from '@/v2/features/app/helpers/routes'

import DocumentCollection from './DocumentCollection.vue'

// Mock ResizeObserver
window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

describe('DocumentCollection', () => {
  const createRouterInstance = () => {
    return createRouter({
      history: createWebHistory(),
      routes: ROUTES,
    })
  }

  const mountWithRouter = async (
    routeName = 'document.overview',
    documentConfig: {
      title?: string
      icon?: string
      hasDocument?: boolean
    } = {},
  ) => {
    const router = createRouterInstance()

    // Create a mock eventBus with a spy for emit
    const eventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }

    // Create a mock workspaceStore with activeDocument
    const workspaceStore = {
      workspace: {
        activeDocument:
          documentConfig.hasDocument === false
            ? null
            : {
                info: {
                  title: documentConfig.title || 'Test Document',
                },
              },
      },
    }

    // Create a mock document with custom icon and title
    const document =
      documentConfig.hasDocument === false
        ? null
        : ({
            info: {
              title: documentConfig.title || 'Test Document',
            },
            ...(documentConfig.icon ? { 'x-scalar-client-config-icon': documentConfig.icon } : {}),
          } as WorkspaceDocument)

    // Push to a specific document route
    await router.push({
      name: routeName,
      params: {
        workspaceSlug: 'test-workspace',
        documentSlug: 'test-document',
      },
    })

    const wrapper = mount(DocumentCollection, {
      props: {
        layout: 'web' as const,
        workspaceStore: workspaceStore,
        eventBus: eventBus,
        document: document,
      },
      global: {
        plugins: [router],
        stubs: {
          LibraryIcon: true,
          IconSelector: true,
          LabelInput: true,
          Tabs: true,
          RouterView: true,
        },
      },
    })

    await router.isReady()

    return { wrapper, router, eventBus }
  }

  describe('title rendering', () => {
    it('renders the component', async () => {
      const { wrapper } = await mountWithRouter()

      expect(wrapper.exists()).toBe(true)
    })

    it('renders the document title', async () => {
      const { wrapper } = await mountWithRouter('document.overview', {
        title: 'My API Document',
      })

      const titleContainer = wrapper.find('[aria-label^="title:"]')
      expect(titleContainer.exists()).toBe(true)
    })

    it('renders the default title when no title is provided', async () => {
      const workspaceStore = {
        workspace: {
          activeDocument: {
            info: {},
          },
        },
      }

      const router = createRouterInstance()
      await router.push({
        name: 'document.overview',
        params: {
          workspaceSlug: 'test-workspace',
          documentSlug: 'test-document',
        },
      })

      const wrapper = mount(DocumentCollection, {
        props: {
          layout: 'web' as const,
          workspaceStore: workspaceStore,
          eventBus: { emit: vi.fn() } as unknown as WorkspaceEventBus,
          document: {} as WorkspaceDocument,
        },
        global: {
          plugins: [router],
          stubs: {
            LibraryIcon: true,
            IconSelector: true,
            LabelInput: true,
            Tabs: true,
            RouterView: true,
          },
        },
      })

      await router.isReady()

      const titleContainer = wrapper.find('[aria-label^="title:"]')
      expect(titleContainer.attributes('aria-label')).toBe('title: Untitled Document')
    })

    it('renders the title with proper aria-label', async () => {
      const { wrapper } = await mountWithRouter('document.overview', {
        title: 'My API Document',
      })

      const titleContainer = wrapper.find('[aria-label^="title:"]')
      expect(titleContainer.exists()).toBe(true)
      expect(titleContainer.attributes('aria-label')).toBe('title: My API Document')
    })
  })

  describe('icon rendering', () => {
    it('renders the icon selector', async () => {
      const { wrapper } = await mountWithRouter()

      const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
      expect(iconSelector.exists()).toBe(true)
    })

    it('renders the default icon when no icon is provided', async () => {
      const { wrapper } = await mountWithRouter()

      const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
      expect(iconSelector.props('modelValue')).toBe('interface-content-folder')
    })

    it('renders a custom icon when provided', async () => {
      const { wrapper } = await mountWithRouter('document.overview', {
        icon: 'interface-content-book',
      })

      const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
      expect(iconSelector.props('modelValue')).toBe('interface-content-book')
    })

    it('passes the correct placement prop to IconSelector', async () => {
      const { wrapper } = await mountWithRouter()

      const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
      expect(iconSelector.props('placement')).toBe('bottom-start')
    })
  })

  describe('event bus events', () => {
    it('emits update:document-icon event when icon is changed', async () => {
      const { wrapper, eventBus } = await mountWithRouter()

      const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
      await iconSelector.vm.$emit('update:modelValue', 'interface-content-book')

      expect(eventBus.emit).toHaveBeenCalledWith('update:document-icon', 'interface-content-book')
    })

    it('emits update:document-info event when title is changed', async () => {
      const { wrapper, eventBus } = await mountWithRouter()

      const labelInput = wrapper.findComponent({ name: 'LabelInput' })
      await labelInput.vm.$emit('update:modelValue', 'New Title')

      expect(eventBus.emit).toHaveBeenCalledWith('update:document-info', { title: 'New Title' })
    })

    it('emits update:document-info event with the correct title format', async () => {
      const { wrapper, eventBus } = await mountWithRouter()

      const labelInput = wrapper.findComponent({ name: 'LabelInput' })
      await labelInput.vm.$emit('update:modelValue', 'API v2 Documentation')

      expect(eventBus.emit).toHaveBeenCalledWith('update:document-info', {
        title: 'API v2 Documentation',
      })
      expect(eventBus.emit).toHaveBeenCalledTimes(1)
    })

    it('does not emit events on initial render', async () => {
      const { eventBus } = await mountWithRouter()

      expect(eventBus.emit).not.toHaveBeenCalled()
    })
  })
})
