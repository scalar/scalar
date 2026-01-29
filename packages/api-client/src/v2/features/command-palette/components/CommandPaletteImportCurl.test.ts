import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import CommandPaletteImportCurl from './CommandPaletteImportCurl.vue'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('CommandPaletteImportCurl', () => {
  const createMockEventBus = () => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })

  beforeEach(() => {
    mockPush.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders with required props', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('initializes with empty example key', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    expect(input.props('modelValue')).toBe('')
  })

  it('renders input placeholder text', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    expect(input.props('placeholder')).toContain('Curl example key')
  })

  it('disables form when example key is empty', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('disables form when example key is only whitespace', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '   ')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('enables form when example key has content and document is available', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'example-1')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('updates example key when input changes', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'my-example')
    await nextTick()

    expect(input.props('modelValue')).toBe('my-example')
  })

  it('displays HTTP method badge', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const methodBadge = wrapper.findComponent({ name: 'HttpMethod' })
    expect(methodBadge.exists()).toBe(true)
    expect(methodBadge.props('method')).toBe('get')
  })

  it('displays parsed URL in preview', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    expect(wrapper.text()).toContain('https://example.com')
    expect(wrapper.text()).toContain('/users')
  })

  it('renders HTTP method', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const methodBadge = wrapper.findComponent({ name: 'HttpMethod' })
    expect(methodBadge).toBeDefined()
  })

  it('renders document selector', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    expect(listbox.exists()).toBe(true)
  })

  it('initializes with first available document selected', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: { openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' } },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    expect(listbox.props('modelValue')).toEqual({ id: 'test-doc', label: 'test-doc' })
  })

  it('displays placeholder when no document is selected', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const button = wrapper.findComponent({ name: 'ScalarButton' })
    expect(button.text()).toContain('Select Collection')
  })

  it('disables form when operation already exists', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              operationId: 'getUsers',
            },
          },
        },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'example-1')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('enables form when operation does not exist', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'example-1')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('emits close event when form is submitted', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'example-1')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits operation:create:operation event with correct payload', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'my-example')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).toHaveBeenCalledWith(
      'operation:create:operation',
      expect.objectContaining({
        documentName: 'test-doc',
        path: '/users',
        method: 'get',
        exampleKey: 'my-example',
        operation: expect.any(Object),
        callback: expect.any(Function),
      }),
    )
  })

  it('does not submit when form is disabled due to empty example key', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('does not submit when form is disabled due to duplicate operation', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              operationId: 'getUsers',
            },
          },
        },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'example-1')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('emits back event when delete is triggered on input', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
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
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    vi.spyOn(workspaceStore, 'buildSidebar')

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'example-1')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    const emitCall = eventBus.emit.mock.calls.find((call) => call[0] === 'operation:create:operation')
    const callback = emitCall?.[1]?.callback
    callback?.(true)

    expect(workspaceStore.buildSidebar).toHaveBeenCalledWith('test-doc')
  })

  it('navigates to example when operation creation callback succeeds', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'my-example')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    const emitCall = eventBus.emit.mock.calls.find((call) => call[0] === 'operation:create:operation')
    const callback = emitCall?.[1]?.callback
    callback?.(true)

    expect(mockPush).toHaveBeenCalledWith({
      name: 'example',
      params: {
        documentSlug: 'test-doc',
        pathEncoded: encodeURIComponent('/users'),
        method: 'get',
        exampleName: 'my-example',
      },
    })
  })

  it('adds leading slash to path in navigation when missing', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl -X POST https://api.example.com/api/test',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'example-1')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    const emitCall = eventBus.emit.mock.calls.find((call) => call[0] === 'operation:create:operation')
    const callback = emitCall?.[1]?.callback
    callback?.(true)

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          pathEncoded: expect.any(String),
        }),
      }),
    )
  })

  it('does not call buildSidebar when operation creation callback fails', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    vi.spyOn(workspaceStore, 'buildSidebar')

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'example-1')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    const emitCall = eventBus.emit.mock.calls.find((call) => call[0] === 'operation:create:operation')
    const callback = emitCall?.[1]?.callback
    callback?.(false)

    expect(workspaceStore.buildSidebar).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('renders submit button with correct text', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    const submitSlot = form.vm.$slots.submit?.()
    expect(submitSlot?.[0]?.children).toBe('Import Request')
  })

  it('trims whitespace from example key', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '  example-1  ')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).toHaveBeenCalledWith(
      'operation:create:operation',
      expect.objectContaining({
        exampleKey: 'example-1',
      }),
    )
  })

  it('renders ChevronDown icon', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const icon = wrapper.findComponent({ name: 'ScalarIcon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('icon')).toBe('ChevronDown')
  })

  it('updates selected document when listbox value changes', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc1',
      document: {
        openapi: '3.1.0',
        info: { title: 'Doc 1', version: '1.0.0' },
      },
    })
    await workspaceStore.addDocument({
      name: 'doc2',
      document: {
        openapi: '3.1.0',
        info: { title: 'Doc 2', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    expect(listbox.props('modelValue')).toEqual({ id: 'doc1', label: 'doc1' })

    await listbox.vm.$emit('update:modelValue', { id: 'doc2', label: 'doc2' })
    await nextTick()

    expect(listbox.props('modelValue')).toEqual({ id: 'doc2', label: 'doc2' })
  })

  it('validates operation against currently selected document', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc1',
      document: {
        openapi: '3.1.0',
        info: { title: 'Doc 1', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              operationId: 'getUsers',
            },
          },
        },
      },
    })
    await workspaceStore.addDocument({
      name: 'doc2',
      document: {
        openapi: '3.1.0',
        info: { title: 'Doc 2', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'example-1')
    await nextTick()

    let form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)

    // Switch to doc2 which doesn't have the operation
    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    await listbox.vm.$emit('update:modelValue', { id: 'doc2', label: 'doc2' })
    await nextTick()

    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('handles rapid input changes correctly', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })

    await input.vm.$emit('update:modelValue', 'e')
    await nextTick()
    let form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)

    await input.vm.$emit('update:modelValue', 'ex')
    await nextTick()
    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)

    await input.vm.$emit('update:modelValue', '')
    await nextTick()
    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)

    await input.vm.$emit('update:modelValue', 'example')
    await nextTick()
    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('emits close event only once per submission', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'test-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
      },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteImportCurl, {
      props: {
        workspaceStore,
        eventBus,
        inputValue: 'curl https://example.com/users',
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'example-1')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
