import { useModal } from '@scalar/components'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick } from 'vue'

import 'fake-indexeddb/auto'

import { mockEventBus } from '@/v2/helpers/test-utils'

import { useModalSidebar } from './hooks/use-modal-sidebar'
import Modal from './Modal.vue'

/**
 * Mock useFocusTrap - requires a real focusable DOM element which is unavailable in JSDOM tests.
 */
vi.mock('@vueuse/integrations/useFocusTrap', () => ({
  useFocusTrap: () => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
  }),
}))

/**
 * Creates a test document with sensible defaults.
 */
const getDocument = (overrides: Partial<OpenApiDocument> = {}): OpenApiDocument => ({
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
  'x-scalar-original-document-hash': 'test-hash',
  ...overrides,
})

/**
 * Creates a complete modal props setup for testing.
 * This mimics the setup done by createApiClientModal.
 */
const createModalProps = async (documentOverrides: Partial<OpenApiDocument> = {}) => {
  const store = createWorkspaceStore()

  await store.addDocument({
    name: 'test-doc',
    document: getDocument({
      paths: {
        '/users': {
          get: { summary: 'Get users', operationId: 'getUsers' },
          post: { summary: 'Create user', operationId: 'createUser' },
        },
        '/pets': {
          get: { summary: 'Get pets', operationId: 'getPets' },
        },
      },
      ...documentOverrides,
    }),
  })

  store.update('x-scalar-active-document', 'test-doc')

  const documentSlug = computed<string | undefined>(() => 'test-doc')
  const path = computed<string | undefined>(() => '/users')
  const method = computed<'get' | 'post' | undefined>(() => 'get')
  const exampleName = computed<string | undefined>(() => 'default')

  const document = computed(() => store.workspace.documents[documentSlug.value ?? ''] ?? null)
  const modalState = useModal()

  const sidebarState = useModalSidebar({
    workspaceStore: store,
    documentSlug,
    path,
    method,
    exampleName,
    route: vi.fn(),
  })

  return {
    store,
    documentSlug,
    path,
    method,
    exampleName,
    document,
    modalState,
    sidebarState,
    props: {
      workspaceStore: store,
      document,
      path: computed(() => path.value),
      method: computed(() => method.value),
      options: {},
      plugins: [],
      exampleName: computed(() => exampleName.value),
      modalState,
      sidebarState,
      eventBus: mockEventBus,
    },
  }
}

/**
 * Helper to wait for async operations and Vue updates.
 */
const waitForUpdates = async () => {
  await nextTick()
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 100))
}

/**
 * Critical tests for the Modal component.
 * Tests focus on core functionality like visibility, sidebar, operation rendering, and state management.
 */
describe('Modal', () => {
  beforeEach(() => {
    // Create a DOM element for mounting - required for teleport to work
    document.body.innerHTML = '<div id="scalar-modal-test"></div>'
  })

  afterEach(() => {
    // Clean up DOM and overflow style
    document.body.innerHTML = ''
    document.documentElement.style.overflow = ''
  })

  it('renders when modal state is open', async () => {
    const { props, modalState } = await createModalProps()
    modalState.open = true

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    /**
     * The modal should be visible when modalState.open is true.
     * This is critical for the modal to function as expected.
     */
    const modalContainer = wrapper.find('.scalar-app-layout')
    expect(modalContainer.exists()).toBe(true)
    expect(modalContainer.attributes('role')).toBe('dialog')
    expect(modalContainer.attributes('aria-modal')).toBe('true')

    wrapper.unmount()
  })

  it('hides when modal state is closed', async () => {
    const { props, modalState } = await createModalProps()
    modalState.open = false

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    /**
     * The modal should be hidden when modalState.open is false.
     * Uses v-show so the element exists but is not visible.
     */
    const scalarApp = wrapper.find('.scalar')
    expect(scalarApp.attributes('style')).toContain('display: none')

    wrapper.unmount()
  })

  it('renders Operation component when document, path, and method are provided', async () => {
    const { props, modalState } = await createModalProps()
    modalState.open = true

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    /**
     * The Operation component should render when all required props are provided.
     * This is critical for displaying the API operation details.
     */
    const operation = wrapper.findComponent({ name: 'Operation' })
    expect(operation.exists()).toBe(true)

    wrapper.unmount()
  })

  it('renders empty state when document is missing', async () => {
    const store = createWorkspaceStore()
    const modalState = useModal()
    modalState.open = true

    const emptyDocument = computed(() => null)
    const sidebarState = useModalSidebar({
      workspaceStore: store,
      documentSlug: computed<string | undefined>(() => undefined),
      path: computed<string | undefined>(() => undefined),
      method: computed<'get' | 'post' | undefined>(() => undefined),
      exampleName: computed<string | undefined>(() => undefined),
      route: vi.fn(),
    })

    const wrapper = mount(Modal, {
      props: {
        workspaceStore: store,
        document: emptyDocument,
        path: computed(() => undefined),
        method: computed(() => undefined),
        options: {},
        plugins: [],
        exampleName: computed(() => undefined),
        modalState,
        sidebarState,
        eventBus: mockEventBus,
      },
      attachTo: '#scalar-modal-test',
    })
    await waitForUpdates()

    /**
     * Empty state should be shown when no document is selected.
     * This prevents errors and provides user feedback.
     */
    expect(wrapper.text()).toContain('No document selected')
    const operation = wrapper.findComponent({ name: 'Operation' })
    expect(operation.exists()).toBe(false)

    wrapper.unmount()
  })

  it('renders Sidebar component', async () => {
    const { props, modalState } = await createModalProps()
    modalState.open = true

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    /**
     * The Sidebar should be rendered for navigation.
     * This is critical for browsing API operations.
     */
    const sidebar = wrapper.findComponent({ name: 'Sidebar' })
    expect(sidebar.exists()).toBe(true)

    wrapper.unmount()
  })

  it('renders SidebarToggle component', async () => {
    const { props, modalState } = await createModalProps()
    modalState.open = true

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    /**
     * The SidebarToggle should be rendered to allow users to show/hide the sidebar.
     */
    const sidebarToggle = wrapper.findComponent({ name: 'SidebarToggle' })
    expect(sidebarToggle.exists()).toBe(true)

    wrapper.unmount()
  })

  it('closes modal when clicking exit overlay', async () => {
    const { props, modalState } = await createModalProps()
    modalState.open = true

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    /**
     * Clicking the exit overlay should close the modal.
     * This provides an intuitive way to dismiss the modal.
     */
    const exitOverlay = wrapper.find('.scalar-app-exit')
    expect(exitOverlay.exists()).toBe(true)

    await exitOverlay.trigger('click')
    expect(modalState.open).toBe(false)

    wrapper.unmount()
  })

  it('uses default sidebar width when not configured', async () => {
    const { props, modalState } = await createModalProps()
    modalState.open = true

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    const sidebar = wrapper.findComponent({ name: 'Sidebar' })
    expect(sidebar.exists()).toBe(true)

    /**
     * Default sidebar width should be used when x-scalar-sidebar-width is not set.
     * The default is 288 pixels.
     */
    expect(wrapper.vm.sidebarWidth).toBe(288)

    wrapper.unmount()
  })

  it('uses configured sidebar width from workspace store', async () => {
    const { props, modalState, store } = await createModalProps()
    store.update('x-scalar-sidebar-width', 400)
    modalState.open = true

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    /**
     * Sidebar width from workspace configuration should be respected.
     * This ensures user preferences are applied.
     */
    expect(wrapper.vm.sidebarWidth).toBe(400)

    wrapper.unmount()
  })

  it('computes environment from workspace and document', async () => {
    const { props, modalState, store } = await createModalProps({
      'x-scalar-environments': {
        prod: {
          variables: [{ name: 'API_KEY', value: 'doc-key-123' }],
        },
      },
    } as any)

    // Set workspace-level environment
    store.workspace['x-scalar-active-environment'] = 'prod'
    store.workspace['x-scalar-environments'] = {
      prod: {
        color: '#FF0000',
        variables: [{ name: 'BASE_URL', value: 'https://api.example.com' }],
      },
    }

    modalState.open = true

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    /**
     * Environment variables should be merged from workspace and document levels.
     * This is critical for proper API request configuration.
     */
    expect(wrapper.vm.environment).toBeDefined()

    expect(wrapper.vm.environment).toEqual({
      color: '#FFFFFF',
      variables: [
        {
          name: 'BASE_URL',
          value: 'https://api.example.com',
        },
        {
          name: 'API_KEY',
          value: 'doc-key-123',
        },
      ],
    })

    wrapper.unmount()
  })

  it('passes correct props to Operation component', async () => {
    const { props, modalState, path, method, exampleName } = await createModalProps()
    modalState.open = true

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    /**
     * Operation component should receive correct props for rendering the right operation.
     */
    const operation = wrapper.findComponent({ name: 'Operation' })
    expect(operation.exists()).toBe(true)
    expect(operation.props('path')).toBe(path.value)
    expect(operation.props('method')).toBe(method.value)
    expect(operation.props('exampleName')).toBe(exampleName.value)
    expect(operation.props('layout')).toBe('modal')

    wrapper.unmount()
  })

  it('has correct accessibility attributes', async () => {
    const { props, modalState } = await createModalProps()
    modalState.open = true

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    /**
     * Modal should have proper accessibility attributes for screen readers.
     */
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.attributes('aria-label')).toBe('API Client')
    expect(dialog.attributes('tabindex')).toBe('-1')

    wrapper.unmount()
  })

  it('disables page scrolling when modal opens', async () => {
    const { props, modalState } = await createModalProps()

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    // Open the modal
    modalState.open = true
    await waitForUpdates()

    /**
     * Page scrolling should be disabled when modal is open to prevent background scroll.
     */
    expect(document.body.style.overflow).toBe('hidden')

    // Close the modal
    modalState.open = false
    await waitForUpdates()

    /**
     * Page scrolling should be restored when modal is closed.
     */
    expect(document.documentElement.style.overflow).toBe('')

    wrapper.unmount()
  })

  it('renders with modal layout for Operation', async () => {
    const { props, modalState } = await createModalProps()
    modalState.open = true

    const wrapper = mount(Modal, { props, attachTo: '#scalar-modal-test' })
    await waitForUpdates()

    /**
     * Operation should be rendered with 'modal' layout, not 'web' or 'desktop'.
     * This ensures proper styling for the modal context.
     */
    const operation = wrapper.findComponent({ name: 'Operation' })
    expect(operation.props('layout')).toBe('modal')

    const sidebar = wrapper.findComponent({ name: 'Sidebar' })
    expect(sidebar.props('layout')).toBe('modal')

    wrapper.unmount()
  })

  it('passes hideClientButton option to Operation component', async () => {
    const { props: baseProps, modalState } = await createModalProps()
    modalState.open = true

    // Test with hideClientButton: true
    const wrapperWithHidden = mount(Modal, {
      props: {
        ...baseProps,
        options: { hideClientButton: true },
      },
      attachTo: '#scalar-modal-test',
    })
    await waitForUpdates()

    /**
     * When hideClientButton is true, it should be passed as true to Operation.
     * This allows hiding the client button in the modal.
     */
    const operationWithHidden = wrapperWithHidden.findComponent({ name: 'OperationBlock' })
    expect(operationWithHidden.exists()).toBe(true)
    expect(operationWithHidden.props('hideClientButton')).toBe(true)

    wrapperWithHidden.unmount()

    // Test with hideClientButton: false
    const wrapperWithShown = mount(Modal, {
      props: {
        ...baseProps,
        options: { hideClientButton: false },
      },
      attachTo: '#scalar-modal-test',
    })
    await waitForUpdates()

    /**
     * When hideClientButton is false, it should be passed as false to Operation.
     */
    const operationWithShown = wrapperWithShown.findComponent({ name: 'OperationBlock' })
    expect(operationWithShown.exists()).toBe(true)
    expect(operationWithShown.props('hideClientButton')).toBe(false)

    wrapperWithShown.unmount()

    // Test with hideClientButton: undefined (should default to false)
    const wrapperWithDefault = mount(Modal, {
      props: {
        ...baseProps,
        options: {},
      },
      attachTo: '#scalar-modal-test',
    })
    await waitForUpdates()

    /**
     * When hideClientButton is undefined, it should default to false.
     * This ensures the button is shown by default.
     */
    const operationWithDefault = wrapperWithDefault.findComponent({ name: 'OperationBlock' })
    expect(operationWithDefault.exists()).toBe(true)
    expect(operationWithDefault.props('hideClientButton')).toBe(false)

    wrapperWithDefault.unmount()
  })
})
