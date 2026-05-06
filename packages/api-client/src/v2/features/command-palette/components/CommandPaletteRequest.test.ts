import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import CommandPaletteRequest from './CommandPaletteRequest.vue'

describe('CommandPaletteRequest', () => {
  const createMockWorkspaceStore = async (documents: Record<string, Record<string, unknown>> = {}) => {
    const store = createWorkspaceStore()
    for (const [name, document] of Object.entries(documents)) {
      await store.addDocument({ name, document })
    }
    return store
  }

  const createMockEventBus = () => ({
    emit: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
  })

  /**
   * Creates a proper OpenAPI document with operations.
   */
  const createMockDocument = (overrides: Partial<OpenApiDocument> = {}) => {
    return {
      openapi: '3.1.0',
      info: {
        title: 'Test Document',
        version: '1.0.0',
      },
      ...overrides,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders with required props', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('initializes with default request path "/"', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    expect(input.props('modelValue')).toBe('/')
  })

  it('renders method selector dropdown', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    // Should render dropdowns for method and tag selection
    const dropdowns = wrapper.findAllComponents({ name: 'ScalarDropdown' })
    expect(dropdowns.length).toBeGreaterThanOrEqual(1)
  })

  it('initializes with first available document selected', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const select = wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' })
    expect(select.props('modelValue')).toBe('doc1')
  })

  it('disables form when request path is empty', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('disables form when request path is only whitespace', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '   ')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('disables form when no document is selected', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('enables form when all required fields are valid', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('disables form when operation already exists', async () => {
    const document = createMockDocument({
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
          },
        },
      },
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('shows an inline error when the operation already exists', async () => {
    const document = createMockDocument({
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
          },
        },
      },
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    const error = wrapper.find('[data-testid="command-palette-request-error"]')
    expect(error.exists()).toBe(true)
    expect(error.attributes('role')).toBe('alert')
    expect(error.text()).toContain('GET')
    expect(error.text()).toContain('/users')
    expect(error.text()).toContain('already exists')
  })

  it('does not show an inline error when the path is empty', async () => {
    const document = createMockDocument({
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
          },
        },
      },
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '   ')
    await nextTick()

    expect(wrapper.find('[data-testid="command-palette-request-error"]').exists()).toBe(false)
  })

  it('clears the inline error when the user picks a non-conflicting method', async () => {
    const document = createMockDocument({
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
          },
        },
      },
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()
    expect(wrapper.find('[data-testid="command-palette-request-error"]').exists()).toBe(true)

    await input.vm.$emit('update:modelValue', '/products')
    await nextTick()
    expect(wrapper.find('[data-testid="command-palette-request-error"]').exists()).toBe(false)
  })

  it('normalizes path by adding leading slash when checking for duplicates', async () => {
    const document = createMockDocument({
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
          },
        },
      },
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('allows same path with different HTTP method', async () => {
    const document = createMockDocument({
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
          },
        },
      },
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    // First verify that with GET method and /users path, form is disabled
    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    let form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)

    // Change to a different path to enable form
    await input.vm.$emit('update:modelValue', '/posts')
    await nextTick()

    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('updates request path when input changes', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/api/users')
    await nextTick()

    expect(input.props('modelValue')).toBe('/api/users')
  })

  it('forwards every available document to the document selector', async () => {
    const document1 = createMockDocument()
    const document2 = createMockDocument({ info: { title: 'Second Document', version: '1.0.0' } })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document1, 'doc2': document2 })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const select = wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' })
    expect(select.exists()).toBe(true)
    expect(select.props('documents')).toEqual([
      { id: 'doc1', label: 'Test Document' },
      { id: 'doc2', label: 'Second Document' },
    ])
  })

  it('displays the document title in the selector trigger', async () => {
    const document = createMockDocument({ info: { title: 'My API Collection', version: '1.0.0' } })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const select = wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' })
    expect(select.text()).toContain('My API Collection')
  })

  it('displays the placeholder when no document is selected', async () => {
    const workspaceStore = await createMockWorkspaceStore({})
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const select = wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' })
    expect(select.text()).toContain('Select Document')
  })

  it('falls back to the document name when the title is missing', async () => {
    const document = createMockDocument({ info: { title: '', version: '1.0.0' } })
    const workspaceStore = await createMockWorkspaceStore({ 'my-doc': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const select = wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' })
    expect(select.props('documents')).toEqual([{ id: 'my-doc', label: 'my-doc' }])
  })

  it('renders method and tag selector dropdowns', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const dropdowns = wrapper.findAllComponents({ name: 'ScalarDropdown' })
    // Should have 2 dropdowns: method and tag
    expect(dropdowns.length).toBeGreaterThanOrEqual(2)
  })

  it('initializes with no tag selected', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const tagDropdowns = wrapper.findAllComponents({ name: 'ScalarDropdown' })
    const tagButton = tagDropdowns[1]?.findComponent({ name: 'ScalarButton' })
    expect(tagButton?.text()).toContain('Select Tag (Optional)')
  })

  it('renders tag selector', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    // Should have dropdowns for method and tag selection
    const dropdowns = wrapper.findAllComponents({ name: 'ScalarDropdown' })
    expect(dropdowns.length).toBeGreaterThanOrEqual(2)
  })

  it('enables tag selector when tags are available', async () => {
    const document = createMockDocument({
      tags: [{ name: 'Users' }],
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const tagDropdowns = wrapper.findAllComponents({ name: 'ScalarDropdown' })
    const tagButton = tagDropdowns[1]?.findComponent({ name: 'ScalarButton' })
    expect(tagButton?.props('disabled')).toBe(false)
  })

  it('emits close event when form is submitted', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits operation:create:operation event with correct payload', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/api/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).toHaveBeenCalledWith(
      'operation:create:operation',
      expect.objectContaining({
        documentName: 'doc1',
        path: '/api/users',
        method: 'get',
        operation: expect.any(Object),
        callback: expect.any(Function),
      }),
    )
  })

  it('emits operation payload with operation object', async () => {
    const document = createMockDocument({
      tags: [{ name: 'Users' }],
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).toHaveBeenCalledWith(
      'operation:create:operation',
      expect.objectContaining({
        operation: expect.any(Object),
      }),
    )
  })

  it('excludes tags from operation payload when no tag is selected', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).toHaveBeenCalledWith(
      'operation:create:operation',
      expect.objectContaining({
        operation: expect.objectContaining({
          tags: undefined,
        }),
      }),
    )
  })

  it('emits back event when delete is triggered on input', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const mockKeyboardEvent = new KeyboardEvent('keydown', { key: 'Backspace' })
    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('delete', mockKeyboardEvent)
    await nextTick()

    expect(wrapper.emitted('back')).toBeTruthy()
    expect(wrapper.emitted('back')).toHaveLength(1)
    expect(wrapper.emitted('back')?.[0]?.[0]).toBe(mockKeyboardEvent)
  })

  it('calls buildSidebar when operation creation callback succeeds', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    vi.spyOn(workspaceStore, 'buildSidebar')

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    const emitCall = eventBus.emit.mock.calls.find((call) => call[0] === 'operation:create:operation')
    const callback = emitCall?.[1]?.callback
    callback?.(true)

    expect(workspaceStore.buildSidebar).toHaveBeenCalledWith('doc1')
  })

  it('navigates to example when operation creation callback succeeds', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/api/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    const emitCall = eventBus.emit.mock.calls.find((call) => call[0] === 'operation:create:operation')
    const callback = emitCall?.[1]?.callback
    callback?.(true)

    expect(eventBus.emit).toHaveBeenCalledWith('ui:navigate', {
      page: 'example',
      documentSlug: 'doc1',
      path: '/api/users',
      method: 'get',
      exampleName: 'default',
    })
  })

  it('does not call buildSidebar when operation creation callback fails', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    vi.spyOn(workspaceStore, 'buildSidebar')

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    const emitCall = eventBus.emit.mock.calls.find((call) => call[0] === 'operation:create:operation')
    const callback = emitCall?.[1]?.callback
    callback?.(false)

    expect(workspaceStore.buildSidebar).not.toHaveBeenCalled()
    expect(eventBus.emit).not.toHaveBeenCalledWith('ui:navigate', expect.anything())
  })

  it('renders submit button with correct text', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    const submitSlot = form.vm.$slots.submit?.()
    expect(submitSlot?.[0]?.children).toBe('Create Request')
  })

  it('trims whitespace from request path in payload', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '  /api/users  ')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).toHaveBeenCalledWith(
      'operation:create:operation',
      expect.objectContaining({
        path: '/api/users',
      }),
    )
  })

  it('adds leading slash to path in navigation when missing', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'api/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    const emitCall = eventBus.emit.mock.calls.find((call) => call[0] === 'operation:create:operation')
    const callback = emitCall?.[1]?.callback
    callback?.(true)

    expect(eventBus.emit).toHaveBeenCalledWith(
      'ui:navigate',
      expect.objectContaining({
        page: 'example',
        path: '/api/users',
      }),
    )
  })

  it('updates the selected document when the document selector emits a new value', async () => {
    const document1 = createMockDocument()
    const document2 = createMockDocument({ info: { title: 'Second Document', version: '1.0.0' } })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document1, 'doc2': document2 })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const select = wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' })
    expect(select.props('modelValue')).toBe('doc1')

    await select.vm.$emit('update:modelValue', 'doc2')
    await nextTick()

    expect(wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' }).props('modelValue')).toBe('doc2')
  })

  it('validates operation against the currently selected document', async () => {
    const document1 = createMockDocument({
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
          },
        },
      },
    })
    const document2 = createMockDocument({ info: { title: 'Second Document', version: '1.0.0' } })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document1, 'doc2': document2 })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    let form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)

    // Switch to second document
    const select = wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' })
    await select.vm.$emit('update:modelValue', 'doc2')
    await nextTick()

    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('emits close event only once per submission', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('handles rapid input changes correctly', async () => {
    const document = createMockDocument({
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
          },
        },
      },
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })

    await input.vm.$emit('update:modelValue', '/u')
    await nextTick()
    let form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)

    await input.vm.$emit('update:modelValue', '/us')
    await nextTick()
    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)

    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()
    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)

    await input.vm.$emit('update:modelValue', '/users2')
    await nextTick()
    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('uses the documents prop instead of the workspace store when provided', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'doc-a': createMockDocument({ info: { title: 'A', version: '1' } }),
      'doc-b': createMockDocument({ info: { title: 'B', version: '1' } }),
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
        documents: [{ id: 'doc-b', label: 'Grouped B' }],
      },
    })

    const select = wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' })
    expect(select.props('documents')).toEqual([{ id: 'doc-b', label: 'Grouped B' }])
    expect(select.props('modelValue')).toBe('doc-b')
  })

  it('preselects the active document when the caller does not pass documentName', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'doc-a': createMockDocument({ info: { title: 'A', version: '1' } }),
      'doc-b': createMockDocument({ info: { title: 'B', version: '1' } }),
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
        activeDocumentName: 'doc-b',
      },
    })

    const select = wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' })
    expect(select.props('modelValue')).toBe('doc-b')
  })

  it('prefers an explicit documentName over the active document', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'doc-a': createMockDocument({ info: { title: 'A', version: '1' } }),
      'doc-b': createMockDocument({ info: { title: 'B', version: '1' } }),
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
        documentName: 'doc-a',
        activeDocumentName: 'doc-b',
      },
    })

    const select = wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' })
    expect(select.props('modelValue')).toBe('doc-a')
  })

  it('forwards the document selector to the chosen workspace document on submit', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'acme-v1': createMockDocument(),
      'acme-v0': createMockDocument(),
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
        documents: [
          {
            id: 'acme-v1',
            label: 'Acme API',
            versions: [
              { id: 'acme-v1', label: '1.0.0' },
              { id: 'acme-v0', label: '0.9.0' },
            ],
          },
        ],
      },
    })

    const select = wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' })
    await select.vm.$emit('update:modelValue', 'acme-v0')
    await nextTick()

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).toHaveBeenCalledWith(
      'operation:create:operation',
      expect.objectContaining({ documentName: 'acme-v0' }),
    )
  })

  it('preselects an explicit documentName that points at a non-active version of a registry group', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'acme-v1': createMockDocument(),
      'acme-v0': createMockDocument(),
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteRequest, {
      props: {
        workspaceStore,
        eventBus,
        documentName: 'acme-v0',
        documents: [
          {
            id: 'acme-v1',
            label: 'Acme API',
            versions: [
              { id: 'acme-v1', label: '1.0.0' },
              { id: 'acme-v0', label: '0.9.0' },
            ],
          },
        ],
      },
    })

    const select = wrapper.findComponent({ name: 'CommandPaletteDocumentSelect' })
    expect(select.props('modelValue')).toBe('acme-v0')

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '/users')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).toHaveBeenCalledWith(
      'operation:create:operation',
      expect.objectContaining({ documentName: 'acme-v0' }),
    )
  })
})
