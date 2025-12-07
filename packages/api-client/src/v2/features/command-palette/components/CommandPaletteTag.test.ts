import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import CommandPaletteTag from './CommandPaletteTag.vue'

describe('CommandPaletteTag', () => {
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

  /**
   * Creates a proper OpenAPI document with tags.
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

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('initializes with empty tag name', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    expect(input.props('modelValue')).toBe('')
  })

  it('disables form when tag name is empty', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('disables form when tag name is only whitespace', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
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

  it('disables form when no collection is selected', async () => {
    const workspaceStore = await createMockWorkspaceStore()
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'New Tag')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('disables form when tag name already exists in selected document', async () => {
    const document = createMockDocument({
      tags: [{ name: 'Existing Tag' }],
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Existing Tag')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('enables form when tag name is valid and unique', async () => {
    const document = createMockDocument({
      tags: [{ name: 'Existing Tag' }],
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'New Tag')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('trims whitespace when checking for duplicate tag names', async () => {
    const document = createMockDocument({
      tags: [{ name: 'My Tag' }],
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '  My Tag  ')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('updates tag name when input changes', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Test Tag')
    await nextTick()

    expect(input.props('modelValue')).toBe('Test Tag')
  })

  it('emits close event when form is submitted', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'New Tag')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits tag:create:tag event with correct payload', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'My New Tag')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).toHaveBeenCalledWith(
      'tag:create:tag',
      expect.objectContaining({
        name: 'My New Tag',
        documentName: 'doc1',
      }),
    )
  })

  it('does not submit when form is disabled due to empty name', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('does not submit when form is disabled due to duplicate name', async () => {
    const document = createMockDocument({
      tags: [{ name: 'Existing Tag' }],
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Existing Tag')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(eventBus.emit).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('emits back event when delete is triggered on input', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
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
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
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

  it('renders listbox with available documents', async () => {
    const document1 = createMockDocument()
    const document2 = createMockDocument({ info: { title: 'Second Document', version: '1.0.0' } })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document1, 'doc2': document2 })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    expect(listbox.exists()).toBe(true)
    expect(listbox.props('options')).toHaveLength(2)
    expect(listbox.props('options')).toEqual([
      { id: 'doc1', label: 'Test Document' },
      { id: 'doc2', label: 'Second Document' },
    ])
  })

  it('initializes with first available document selected', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    expect(listbox.props('modelValue')).toEqual({ id: 'doc1', label: 'Test Document' })
  })

  it('handles empty documents list gracefully', async () => {
    const workspaceStore = await createMockWorkspaceStore({})
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    expect(listbox.props('options')).toHaveLength(0)
    expect(listbox.props('modelValue')).toBeUndefined()
  })

  it('displays document title in listbox button', async () => {
    const document = createMockDocument({ info: { title: 'My Collection', version: '1.0.0' } })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const button = wrapper.findComponent({ name: 'ScalarButton' })
    expect(button.text()).toContain('My Collection')
  })

  it('displays placeholder text when no document is selected', async () => {
    const workspaceStore = await createMockWorkspaceStore({})
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const button = wrapper.findComponent({ name: 'ScalarButton' })
    expect(button.text()).toContain('Select Collection')
  })

  it('uses document name as fallback when title is missing', async () => {
    const document = createMockDocument({ info: { title: '', version: '1.0.0' } })
    const workspaceStore = await createMockWorkspaceStore({ 'my-doc': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    expect(listbox.props('options')).toEqual([{ id: 'my-doc', label: 'my-doc' }])
  })

  it('allows creating tags with the same name in different documents', async () => {
    const document1 = createMockDocument({
      tags: [{ name: 'Shared Tag' }],
    })
    const document2 = createMockDocument({ info: { title: 'Second Document', version: '1.0.0' } })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document1, 'doc2': document2 })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    // Change to second document
    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    await listbox.vm.$emit('update:modelValue', { id: 'doc2', label: 'Second Document' })
    await nextTick()

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Shared Tag')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('handles rapid input changes correctly', async () => {
    const document = createMockDocument({
      tags: [{ name: 'Existing' }],
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
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
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'New Tag')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('handles document without tags array', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'New Tag')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('disables form when selected document does not exist', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'New Tag')
    await nextTick()

    // Manually set selectedDocument to a non-existent document
    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    await listbox.vm.$emit('update:modelValue', { id: 'non-existent', label: 'Non-existent' })
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('does not call buildSidebar when tag creation callback fails', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    vi.spyOn(workspaceStore, 'buildSidebar')

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'New Tag')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    await form.vm.$emit('submit')
    await nextTick()

    const emitCall = eventBus.emit.mock.calls.find((call) => call[0] === 'tag:create:tag')
    const callback = emitCall?.[1]?.callback
    callback?.(false)

    expect(workspaceStore.buildSidebar).not.toHaveBeenCalled()
  })

  it('renders submit button with correct text', async () => {
    const document = createMockDocument()
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    const submitSlot = form.vm.$slots.submit?.()
    expect(submitSlot?.[0]?.children).toBe('Create Tag')
  })

  it('is case-sensitive when checking for duplicate tag names', async () => {
    const document = createMockDocument({
      tags: [{ name: 'MyTag' }],
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'mytag')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('updates selected document when listbox value changes', async () => {
    const document1 = createMockDocument()
    const document2 = createMockDocument({ info: { title: 'Second Document', version: '1.0.0' } })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document1, 'doc2': document2 })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    expect(listbox.props('modelValue')).toEqual({ id: 'doc1', label: 'Test Document' })

    await listbox.vm.$emit('update:modelValue', { id: 'doc2', label: 'Second Document' })
    await nextTick()

    expect(listbox.props('modelValue')).toEqual({ id: 'doc2', label: 'Second Document' })
  })

  it('validates tag name against the currently selected document', async () => {
    const document1 = createMockDocument({
      tags: [{ name: 'Tag A' }],
    })
    const document2 = createMockDocument({
      info: { title: 'Second Document', version: '1.0.0' },
      tags: [{ name: 'Tag B' }],
    })
    const workspaceStore = await createMockWorkspaceStore({ 'doc1': document1, 'doc2': document2 })
    const eventBus = createMockEventBus()

    const wrapper = mount(CommandPaletteTag, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'Tag A')
    await nextTick()

    let form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)

    // Switch to second document
    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    await listbox.vm.$emit('update:modelValue', { id: 'doc2', label: 'Second Document' })
    await nextTick()

    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })
})
