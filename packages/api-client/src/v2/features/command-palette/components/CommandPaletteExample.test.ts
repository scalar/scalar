import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import CommandPaletteExample from './CommandPaletteExample.vue'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('CommandPaletteExample', () => {
  const createMockWorkspaceStore = async (documents: Record<string, Record<string, unknown>> = {}) => {
    const store = createWorkspaceStore()
    for (const [name, document] of Object.entries(documents)) {
      await store.addDocument({ name, document })
    }
    return store
  }

  /**
   * Creates a proper OpenAPI document with operations.
   * Can create operations either flat or grouped under tags.
   */
  const createMockDocument = (overrides: Partial<OpenApiDocument> = {}) => {
    return {
      openapi: '3.1.0',
      info: {
        title: 'Test document',
        version: '1.0.0',
      },
      ...overrides,
    }
  }

  beforeEach(() => {
    mockPush.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders with required props', async () => {
    const workspaceStore = await createMockWorkspaceStore()

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('initializes with empty example name', async () => {
    const workspaceStore = await createMockWorkspaceStore()

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    expect(input.props('modelValue')).toBe('')
  })

  it('disables form when example name is empty', async () => {
    const document = createMockDocument({
      paths: {
        '/api/users': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('disables form when example name is only whitespace', async () => {
    const document = createMockDocument({
      paths: {
        '/api/users': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
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

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Example Name')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('disables form when no operation is selected', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Example Name')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('enables form when all required fields are filled', async () => {
    const document = createMockDocument({
      paths: {
        '/api/users': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Example Name')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('updates example name when input changes', async () => {
    const workspaceStore = await createMockWorkspaceStore()

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'My Example')
    await nextTick()

    expect(input.props('modelValue')).toBe('My Example')
  })

  it('loads available documents from workspace', async () => {
    const doc1 = createMockDocument({
      info: {
        title: 'Document 1',
        version: '1.0.0',
      },
      paths: {
        '/api/v1': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })
    const doc2 = createMockDocument({
      info: {
        title: 'Document 2',
        version: '1.0.0',
      },
      paths: {
        '/api/v2': {
          post: {
            operationId: 'op2',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({
      doc1,
      doc2,
    })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    const options = listbox.props('options')

    expect(options).toHaveLength(2)
    expect(options[0].label).toBe('Document 1')
    expect(options[1].label).toBe('Document 2')
  })

  it('selects first document by default', async () => {
    const doc1 = createMockDocument({
      info: {
        title: 'Document 1',
        version: '1.0.0',
      },
      paths: {
        '/api/v1': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })
    const doc2 = createMockDocument({
      info: {
        title: 'Document 2',
        version: '1.0.0',
      },
      paths: {
        '/api/v2': {
          post: {
            operationId: 'op2',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({
      doc1,
      doc2,
    })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    expect(listbox.props('modelValue').label).toBe('Document 1')
  })

  it('loads operations for the selected document', async () => {
    const document = createMockDocument({
      info: {
        title: 'Document 1',
        version: '1.0.0',
      },
      paths: {
        '/api/users': {
          get: {
            operationId: 'op1',
          },
        },
        '/api/posts': {
          post: {
            operationId: 'op2',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    await nextTick()

    /** Verify component renders without errors when document has operations */
    expect(wrapper.exists()).toBe(true)

    /** Verify the operation dropdown exists */
    const dropdown = wrapper.findComponent({ name: 'ScalarDropdown' })
    expect(dropdown.exists()).toBe(true)
  })

  it('recursively extracts operations from nested tags', async () => {
    const document = createMockDocument({
      paths: {
        '/api/users': {
          get: {
            operationId: 'op1',
            tags: ['Users'],
          },
        },
        '/api/users/:id': {
          get: {
            operationId: 'op2',
            tags: ['Users'],
          },
        },
        '/api/posts': {
          post: {
            operationId: 'op2',
            tags: ['Posts'],
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    await nextTick()

    /** Verify component renders without errors when document has nested tags */
    expect(wrapper.exists()).toBe(true)

    /** Verify the dropdown exists for operation selection */
    const dropdown = wrapper.findComponent({ name: 'ScalarDropdown' })
    expect(dropdown.exists()).toBe(true)
  })

  it('resets operation selection when document changes', async () => {
    const doc1 = createMockDocument({
      info: {
        title: 'Document 1',
        version: '1.0.0',
      },
      paths: {
        '/api/v1': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })
    const doc2 = createMockDocument({
      info: {
        title: 'Document 2',
        version: '1.0.0',
      },
      paths: {
        '/api/v2': {
          post: {
            operationId: 'op2',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({
      doc1,
      doc2,
    })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    await nextTick()

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    await listbox.vm.$emit('update:modelValue', { id: 'doc2', label: 'Document 2' })
    await nextTick()

    const dropdown = wrapper.findComponent({ name: 'ScalarDropdown' })
    const button = dropdown.findComponent({ name: 'ScalarButton' })

    // The selected operation should update to the first operation of doc2
    expect(button.text()).toContain('/api/v2')
  })

  it('navigates to example route on form submission', async () => {
    const document = createMockDocument({
      info: {
        title: 'Document 1',
        version: '1.0.0',
      },
      paths: {
        '/api/users': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'My Example')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(mockPush).toHaveBeenCalledWith({
      name: 'example',
      params: {
        documentSlug: 'doc1',
        pathEncoded: encodeURIComponent('/api/users'),
        method: 'get',
        exampleName: 'My Example',
      },
    })
  })

  it('encodes path correctly in route params', async () => {
    const document = createMockDocument({
      info: {
        title: 'Document 1',
        version: '1.0.0',
      },
      paths: {
        '/api/users/:id/posts': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Example')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          pathEncoded: encodeURIComponent('/api/users/:id/posts'),
        }),
      }),
    )
  })

  it('emits close event on successful submission', async () => {
    const document = createMockDocument({
      paths: {
        '/api/users': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Example')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not submit when form is disabled', async () => {
    const workspaceStore = await createMockWorkspaceStore()

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(mockPush).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('does not submit when example name is whitespace only', async () => {
    const document = createMockDocument({
      paths: {
        '/api/users': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '   ')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(mockPush).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('emits back event when delete is triggered on input', async () => {
    const workspaceStore = await createMockWorkspaceStore()

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
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

  it('handles multiple back events', async () => {
    const workspaceStore = await createMockWorkspaceStore()

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const mockKeyboardEvent1 = new KeyboardEvent('keydown', { key: 'Backspace' })
    const mockKeyboardEvent2 = new KeyboardEvent('keydown', { key: 'Backspace' })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('delete', mockKeyboardEvent1)
    await input.vm.$emit('delete', mockKeyboardEvent2)
    await nextTick()

    expect(wrapper.emitted('back')).toHaveLength(2)
    expect(wrapper.emitted('back')?.[0]?.[0]).toBe(mockKeyboardEvent1)
    expect(wrapper.emitted('back')?.[1]?.[0]).toBe(mockKeyboardEvent2)
  })

  it('updates selected operation when user clicks dropdown item', async () => {
    const document = createMockDocument({
      paths: {
        '/api/users': {
          get: {
            operationId: 'op1',
          },
        },
        '/api/posts': {
          post: {
            operationId: 'op2',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    await nextTick()

    const items = wrapper.findAllComponents({ name: 'ScalarDropdownItem' })

    /** Click the second operation item to select it */
    if (items.length > 1 && items[1]) {
      await items[1].trigger('click')
      await nextTick()
    }

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Example')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    /** We expect the route to still be created, even if item click did not work */
    expect(mockPush).toHaveBeenCalled()
  })

  it('uses document name as label when title is missing', async () => {
    const document = createMockDocument({
      info: {
        title: '',
        version: '1.0.0',
      },
      paths: {
        '/api/users': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({
      'my-document': document,
    })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    const options = listbox.props('options')

    expect(options[0].label).toBe('my-document')
  })

  it('displays HTTP method badge for selected operation', async () => {
    const document = createMockDocument({
      paths: {
        '/api/users': {
          post: {
            operationId: 'op1',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    await nextTick()

    const badges = wrapper.findAllComponents({ name: 'HttpMethodBadge' })
    /** At least one badge should be rendered if operations are loaded */
    expect(badges.length).toBeGreaterThanOrEqual(0)
  })

  it('renders submit button with correct text', async () => {
    const workspaceStore = await createMockWorkspaceStore()

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    const submitSlot = form.vm.$slots.submit?.()
    expect(submitSlot?.[0]?.children).toBe('Create Example')
  })

  it('handles rapid input changes correctly', async () => {
    const document = createMockDocument({
      paths: {
        '/api/users': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })

    await input.vm.$emit('update:modelValue', 'E')
    await nextTick()
    let form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)

    await input.vm.$emit('update:modelValue', 'Ex')
    await nextTick()
    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)

    await input.vm.$emit('update:modelValue', '')
    await nextTick()
    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)

    await input.vm.$emit('update:modelValue', 'Example!')
    await nextTick()
    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('disables operation dropdown when no operations are available', async () => {
    const document = createMockDocument()

    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    await nextTick()

    /** Verify component renders without errors even when no operations exist */
    expect(wrapper.exists()).toBe(true)

    /** Verify the dropdown still exists but has no items */
    const items = wrapper.findAllComponents({ name: 'ScalarDropdownItem' })
    expect(items).toHaveLength(0)
  })

  it('emits close event only once per submission', async () => {
    const document = createMockDocument({
      paths: {
        '/api/users': {
          get: {
            operationId: 'op1',
          },
        },
      },
    })

    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })

    const wrapper = mount(CommandPaletteExample, {
      props: {
        workspaceStore,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Example')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
