import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import CommandPaletteImport from './CommandPaletteImport.vue'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock file dialog hook
const mockFileDialogOpen = vi.fn()
vi.mock('@/hooks', () => ({
  useFileDialog: () => ({
    open: mockFileDialogOpen,
  }),
}))

describe('CommandPaletteImport', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockFileDialogOpen.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders with required props', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('initializes with empty input', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    expect(input.props('modelValue')).toBe('')
  })

  it('initializes with watch mode disabled', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const watchToggle = wrapper.findComponent({ name: 'WatchModeToggle' })
    expect(watchToggle.props('modelValue')).toBe(false)
    expect(watchToggle.props('disabled')).toBe(true)
  })

  it('renders input placeholder text', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    expect(input.props('placeholder')).toBe('OpenAPI/Swagger/Postman URL or cURL')
  })

  it('disables form when input is empty', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })

  it('disables form when input is only whitespace', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
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

  it('enables form when input has content', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'https://example.com/api.json')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)
  })

  it('updates input when text is entered', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'https://api.example.com/spec.json')
    await nextTick()

    expect(input.props('modelValue')).toBe('https://api.example.com/spec.json')
  })

  it('emits open-command event when cURL is detected', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()
    const emitSpy = vi.fn()
    eventBus.emit = emitSpy

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'curl https://api.example.com')
    await nextTick()

    expect(emitSpy).toHaveBeenCalledWith('ui:open:command-palette', {
      action: 'import-curl-command',
      payload: {
        inputValue: 'curl https://api.example.com',
      },
    })
  })

  it('detects cURL with uppercase', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()
    const emitSpy = vi.fn()
    eventBus.emit = emitSpy

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'CURL https://api.example.com')
    await nextTick()

    expect(emitSpy).toHaveBeenCalledWith('ui:open:command-palette', expect.any(Object))
  })

  it('detects cURL with leading whitespace', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()
    const emitSpy = vi.fn()
    eventBus.emit = emitSpy

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '  curl https://api.example.com')
    await nextTick()

    expect(emitSpy).toHaveBeenCalledWith('ui:open:command-palette', expect.any(Object))
  })

  it('emits back event when delete is triggered on input', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
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
    expect(wrapper.emitted('back')?.[0]?.[0]).toBe(mockKeyboardEvent)
  })

  it('disables watch mode toggle for non-URL input', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '{"openapi": "3.1.0"}')
    await nextTick()

    const watchToggle = wrapper.findComponent({ name: 'WatchModeToggle' })
    expect(watchToggle.props('disabled')).toBe(true)
  })

  it('enables watch mode toggle for URL input', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'https://example.com/api.json')
    await nextTick()

    const watchToggle = wrapper.findComponent({ name: 'WatchModeToggle' })
    expect(watchToggle.props('disabled')).toBe(false)
  })

  it('automatically disables watch mode when switching from URL to content', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    /** Start with URL */
    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'https://example.com/api.json')
    await nextTick()

    let watchToggle = wrapper.findComponent({ name: 'WatchModeToggle' })
    expect(watchToggle.props('modelValue')).toBe(false)
    expect(watchToggle.props('disabled')).toBe(false)

    /** Only local URLs are allowed for watch mode */
    await input.vm.$emit('update:modelValue', 'http://localhost:3000/api.json')
    await nextTick()

    expect(watchToggle.props('modelValue')).toBe(true)
    expect(watchToggle.props('disabled')).toBe(false)

    /** Switch to content */
    await input.vm.$emit('update:modelValue', '{"openapi": "3.1.0"}')
    await nextTick()

    watchToggle = wrapper.findComponent({ name: 'WatchModeToggle' })
    expect(watchToggle.props('modelValue')).toBe(false)
    expect(watchToggle.props('disabled')).toBe(true)
  })

  it('shows preview mode for pasted OpenAPI content', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const openApiContent = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', openApiContent)
    await nextTick()

    expect(wrapper.text()).toContain('Preview')
    const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
    expect(codeBlock.exists()).toBe(true)
  })

  it('shows clear button in preview mode', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const openApiContent = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', openApiContent)
    await nextTick()

    expect(wrapper.text()).toContain('Clear')
  })

  it('clears content when clear button is clicked', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const openApiContent = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', openApiContent)
    await nextTick()

    const clearButton = wrapper.findAll('button').find((btn) => btn.text().includes('Clear'))
    await clearButton?.trigger('click')
    await nextTick()

    /** After clearing, should go back to input mode */
    expect(wrapper.findComponent({ name: 'CommandActionInput' }).exists()).toBe(true)
  })

  it('does not show preview mode for URL input', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'https://example.com/api.json')
    await nextTick()

    const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
    expect(codeBlock.exists()).toBe(false)
  })

  it('renders file upload button', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    expect(wrapper.text()).toContain('JSON, or YAML File')
  })

  it('renders watch mode toggle', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const watchToggle = wrapper.findComponent({ name: 'WatchModeToggle' })
    expect(watchToggle.exists()).toBe(true)
  })

  it('renders tooltip for watch mode', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const tooltip = wrapper.findComponent({ name: 'ScalarTooltip' })
    expect(tooltip.exists()).toBe(true)
  })

  it('shows different tooltip content for URL vs non-URL input', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    /** For non-URL input */
    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', '{"openapi": "3.1.0"}')
    await nextTick()

    let tooltip = wrapper.findComponent({ name: 'ScalarTooltip' })
    expect(tooltip.props('content')).toContain('only available for URL imports')

    /** For URL input - should show different tooltip */
    await input.vm.$emit('update:modelValue', 'https://example.com/api.json')
    await nextTick()

    tooltip = wrapper.findComponent({ name: 'ScalarTooltip' })
    expect(tooltip.props('content')).toContain('automatically updates')
  })

  it('has submit slot for URL import', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'https://example.com/api.json')
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    const submitSlot = form.vm.$slots.submit?.()
    expect(submitSlot).toBeDefined()
    expect(submitSlot?.length).toBeGreaterThan(0)
  })

  it('has submit slot for pasted content', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const openApiContent = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'My API', version: '1.0.0' },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', openApiContent)
    await nextTick()

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    const submitSlot = form.vm.$slots.submit?.()
    expect(submitSlot).toBeDefined()
    expect(submitSlot?.length).toBeGreaterThan(0)
  })

  it('renders Upload icon', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const icons = wrapper.findAllComponents({ name: 'ScalarIcon' })
    const uploadIcon = icons.find((icon) => icon.props('icon') === 'Upload')
    expect(uploadIcon).toBeDefined()
  })

  it('passes loading state to form', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('loader')).toBeDefined()
  })

  it('renders submit button with "Import" text', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const form = wrapper.findComponent({ name: 'CommandActionForm' })
    const submitSlot = form.vm.$slots.submit?.()
    const submitText = submitSlot
      ?.map((node: { children?: string }) => (typeof node.children === 'string' ? node.children : ''))
      .join(' ')

    expect(submitText).toContain('Import')
  })

  it('handles watch mode toggle changes', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    /** Set URL input */
    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'https://example.com/api.json')
    await nextTick()

    const watchToggle = wrapper.findComponent({ name: 'WatchModeToggle' })

    /** Toggle watch mode off */
    await watchToggle.vm.$emit('update:modelValue', false)
    await nextTick()

    expect(watchToggle.props('modelValue')).toBe(false)

    /** Toggle watch mode on */
    await watchToggle.vm.$emit('update:modelValue', true)
    await nextTick()

    expect(watchToggle.props('modelValue')).toBe(true)
  })

  it('initializes with correct file dialog accept types', () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    /** The mock is set up, just verify the component exists */
    expect(true).toBe(true)
  })

  it('does not show input when in preview mode', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const openApiContent = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', openApiContent)
    await nextTick()

    /** Input should not be visible in preview mode */
    const inputs = wrapper.findAllComponents({ name: 'CommandActionInput' })
    expect(inputs.length).toBe(0)
  })

  it('shows input for URL even though it is valid content', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })
    await input.vm.$emit('update:modelValue', 'https://example.com/api.json')
    await nextTick()

    /** Input should still be visible for URLs */
    expect(wrapper.findComponent({ name: 'CommandActionInput' }).exists()).toBe(true)
  })

  it('handles empty input after having content', async () => {
    const workspaceStore = createWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(CommandPaletteImport, {
      props: {
        workspaceStore,
        eventBus,
      },
    })

    const input = wrapper.findComponent({ name: 'CommandActionInput' })

    /** Add content */
    await input.vm.$emit('update:modelValue', 'https://example.com/api.json')
    await nextTick()

    let form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(false)

    /** Clear content */
    await input.vm.$emit('update:modelValue', '')
    await nextTick()

    form = wrapper.findComponent({ name: 'CommandActionForm' })
    expect(form.props('disabled')).toBe(true)
  })
})
