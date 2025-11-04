import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { ROUTES } from '@/v2/features/app/helpers/routes'
import { mockEventBus } from '@/v2/helpers/test-utils'

import DocumentCollection from './DocumentCollection.vue'

/**
 * Critical tests for DocumentCollection component
 * Tests focus on document rendering, fallback states, routing integration, and prop handling
 */
describe('DocumentCollection', () => {
  const createMockDocument = (overrides?: Partial<WorkspaceDocument>): WorkspaceDocument =>
    ({
      uid: 'test-doc-123',
      info: {
        title: 'Test API Document',
        version: '1.0.0',
      },
      'x-scalar-client-config-icon': 'interface-content-folder',
      ...overrides,
    }) as WorkspaceDocument

  const createMockWorkspaceStore = (): WorkspaceStore =>
    ({
      workspace: {
        uid: 'workspace-123',
        documents: {},
      },
      update: vi.fn(),
    }) as unknown as WorkspaceStore

  const createRouterInstance = () => {
    return createRouter({
      history: createWebHistory(),
      routes: ROUTES,
    })
  }

  const mountWithRouter = async (document: WorkspaceDocument | null) => {
    const router = createRouterInstance()
    const workspaceStore = createMockWorkspaceStore()

    await router.push({
      name: 'document.overview',
      params: {
        workspaceSlug: 'test-workspace',
        documentSlug: 'test-document',
      },
    })

    const wrapper = mount(DocumentCollection, {
      props: {
        document,
        eventBus: mockEventBus,
        layout: 'desktop' as any,
        environment: {} as any,
        workspaceStore,
      },
      global: {
        plugins: [router],
      },
    })

    await router.isReady()

    return { wrapper, router, eventBus: mockEventBus, workspaceStore }
  }

  it('renders document with title and icon when document is provided', async () => {
    const document = createMockDocument({
      info: { title: 'My API', version: '1.0.0' },
      'x-scalar-client-config-icon': 'interface-content-book',
    })

    const { wrapper } = await mountWithRouter(document)

    /** Verify the main document view is rendered */
    expect(wrapper.find('[aria-label="title: My API"]').exists()).toBe(true)

    /** Verify tabs component is rendered */
    const tabs = wrapper.findComponent({ name: 'Tabs' })
    expect(tabs.exists()).toBe(true)
    expect(tabs.props('type')).toBe('document')
  })

  it('displays "Document not found" message when document is null', async () => {
    const { wrapper } = await mountWithRouter(null)

    /** Verify error message is displayed */
    expect(wrapper.text()).toContain('Document not found')
    expect(wrapper.text()).toContain('The document you are looking for does not exist.')

    /** Verify main document UI is not rendered */
    expect(wrapper.find('[aria-label]').exists()).toBe(false)
    const tabs = wrapper.findComponent({ name: 'Tabs' })
    expect(tabs.exists()).toBe(false)
  })

  it('passes correct props to child components', async () => {
    const document = createMockDocument({
      info: { title: 'Production API', version: '2.0.0' },
    })

    const { wrapper } = await mountWithRouter(document)

    /** Verify IconSelector receives the correct icon */
    const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
    expect(iconSelector.exists()).toBe(true)
    expect(iconSelector.props('modelValue')).toBe('interface-content-folder')
    expect(iconSelector.props('placement')).toBe('bottom-start')

    /** Verify LabelInput receives the correct title */
    const labelInput = wrapper.findComponent({ name: 'LabelInput' })
    expect(labelInput.exists()).toBe(true)
    expect(labelInput.props('modelValue')).toBe('Production API')

    /** Verify RouterView receives correct props */
    const routerView = wrapper.findComponent({ name: 'RouterView' })
    expect(routerView.exists()).toBe(true)
  })

  it('handles icon update events correctly', async () => {
    const document = createMockDocument()
    const { wrapper, eventBus } = await mountWithRouter(document)

    const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
    expect(iconSelector.exists()).toBe(true)

    /** Simulate IconSelector emitting an update */
    await iconSelector.vm.$emit('update:modelValue', 'interface-content-star')

    /** Verify the event was passed to the eventBus */
    expect(eventBus.emit).toHaveBeenCalledWith('document:update:icon', 'interface-content-star')
  })

  it('uses default values when document info is missing or incomplete', async () => {
    const document = createMockDocument({
      info: undefined,
      'x-scalar-client-config-icon': undefined,
    } as any)

    const { wrapper } = await mountWithRouter(document)

    /** Verify fallback title is used */
    const labelInput = wrapper.findComponent({ name: 'LabelInput' })
    expect(labelInput.props('modelValue')).toBe('Untitled Document')

    /** Verify default icon is used */
    const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
    expect(iconSelector.props('modelValue')).toBe('interface-content-folder')
  })
})
