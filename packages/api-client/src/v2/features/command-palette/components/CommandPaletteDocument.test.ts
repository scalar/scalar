import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import CommandPaletteDocument from './CommandPaletteDocument.vue'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('CommandPaletteDocument', () => {
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
    off: vi.fn(),
  })

  beforeEach(() => {
    mockPush.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders with required props', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('initializes with empty document name', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    expect(input.props('modelValue')).toBe('')
  })

  it('initializes with default document icon', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
    expect(iconSelector.props('modelValue')).toBe('interface-content-folder')
  })

  it('disables form when document name is empty', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('disables form when document name is only whitespace', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
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

  it('disables form when document name already exists', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'Existing Document': { id: '123' },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Existing Document')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('enables form when document name is valid and unique', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'Existing Document': { id: '123' },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'New Document')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('trims whitespace when checking for duplicate document names', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'My Document': { id: '123' },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '  My Document  ')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('updates document name when input changes', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Test Document')
    await nextTick()

    expect(input.props('modelValue')).toBe('Test Document')
  })

  it('updates document icon when icon selector changes', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
    await iconSelector.vm.$emit('update:modelValue', 'custom-icon')
    await nextTick()

    expect(iconSelector.props('modelValue')).toBe('custom-icon')
  })

  it('emits close event when form is submitted', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'New Document')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits document:create:empty-document event with correct payload', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'My New Document')
    await nextTick()

    const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
    await iconSelector.vm.$emit('update:modelValue', 'custom-icon')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).toHaveBeenCalledWith(
      'document:create:empty-document',
      expect.objectContaining({
        name: 'My New Document',
        icon: 'custom-icon',
        callback: expect.any(Function),
      }),
    )
  })

  it('does not submit when form is disabled due to empty name', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    // Trigger submit without setting a document name
    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('does not submit when form is disabled due to duplicate name', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'Existing Document': { id: '123' },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Existing Document')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('emits back event when delete is triggered on input', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
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

  it('handles multiple back events', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
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

  it('renders icon selector with correct default placement', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const iconSelector = wrapper.findComponent({ name: 'IconSelector' })
    expect(iconSelector.props('placement')).toBe('bottom-start')
  })

  it('renders submit button with correct text', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    const submitSlot = form.vm.$slots.submit?.()
    expect(submitSlot?.[0]?.children).toBe('Create Document')
  })

  it('handles empty workspace documents object', async () => {
    const workspaceStore = await createMockWorkspaceStore({})
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'First Document')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('is case-sensitive when checking for duplicate document names', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'MyDocument': { id: '123' },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'mydocument')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    // Different case, so it should be enabled
    expect(form.props('disabled')).toBe(false)
  })

  it('handles rapid input changes correctly', async () => {
    const workspaceStore = await createMockWorkspaceStore({
      'Existing': { id: '123' },
    })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
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

    await input.vm.$emit('update:modelValue', 'Existing')
    await nextTick()
    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)

    await input.vm.$emit('update:modelValue', 'Existing!')
    await nextTick()
    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('emits close event only once per submission', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'New Document')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('uses the trimmed document name in router params', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteDocument, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'My Document   ')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    const emitCall = eventBus.emit.mock.calls.find((call) => call[0] === 'document:create:empty-document')
    const callback = emitCall?.[1]?.callback
    callback?.(true)

    expect(mockPush).toHaveBeenCalledWith({
      name: 'document.overview',
      params: {
        documentSlug: 'My Document',
      },
    })
  })
})
