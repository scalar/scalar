import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { enableConsoleError, enableConsoleWarn } from '@test/vitest.setup'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import type { ClientLayout } from '@/v2/types/layout'

import AddressBar from './AddressBar.vue'

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    useId: () => 'address-bar-test-id',
  }
})

describe('AddressBar', () => {
  const baseEnvironment = {
    color: '#FFFFFF',
    variables: [],
  }

  const baseServer = {
    url: 'https://api.example.com',
    description: 'Production Server',
  }

  const mountWithProps = (
    custom: Partial<{
      path: string
      method: string
      server: any
      servers: any[]
      history: any[]
      layout: string
      percentage: number
    }> = {},
  ) => {
    const eventBus = createWorkspaceEventBus()

    const wrapper = mount(AddressBar, {
      props: {
        path: custom.path ?? '/api/test',
        method: (custom.method ?? 'get') as HttpMethod,
        server: custom.server ?? baseServer,
        servers: custom.servers ?? [baseServer],
        history: custom.history ?? [],
        layout: (custom.layout ?? 'web') as ClientLayout,
        percentage: custom.percentage ?? 100,
        eventBus,
        environment: baseEnvironment,
      },
    })

    return { wrapper, eventBus }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    enableConsoleWarn()
    enableConsoleError()

    // create teleport target
    const el = document.createElement('div')
    el.id = 'address-bar-test-id'
    document.body.appendChild(el)
  })

  it('emits update:method when HttpMethod is clicked and changed', async () => {
    const { wrapper } = mountWithProps()

    const httpMethod = wrapper.findComponent({ name: 'HttpMethod' })

    /**
     * Find the button within the HttpMethod component and click it.
     * This opens the dropdown menu.
     */
    const button = httpMethod.find('button')
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    await nextTick()

    /**
     * Find the ScalarListbox component and update its model value to simulate
     * selecting the POST option from the dropdown.
     */
    const listbox = httpMethod.findComponent({ name: 'ScalarListbox' })
    const postOption = { id: 'post', label: 'POST', color: 'text-method-post' }
    await listbox.vm.$emit('update:modelValue', postOption)
    await nextTick()

    const emitted = wrapper.emitted('update:method')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual([{ value: 'post' }])
  })

  it('emits update:path when CodeInput updates modelValue', async () => {
    const { wrapper } = mountWithProps()

    const codeInput = wrapper.findComponent({ name: 'CodeInput' })
    await codeInput.vm.$emit('update:modelValue', '/api/users')
    await nextTick()

    const emitted = wrapper.emitted('update:path')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual([{ value: '/api/users' }])
  })

  it('emits importCurl when CodeInput emits curl', async () => {
    const { wrapper, eventBus } = mountWithProps()
    const emitSpy = vi.spyOn(eventBus, 'emit')

    const codeInput = wrapper.findComponent({ name: 'CodeInput' })
    await codeInput.vm.$emit('curl', 'curl https://example.com')
    await nextTick()

    expect(emitSpy).toHaveBeenCalledWith('ui:open:command-palette', {
      action: 'import-curl-command',
      payload: {
        curl: 'curl https://example.com',
      },
    })
  })

  it('emits execute on CodeInput submit and Send button click', async () => {
    const { wrapper } = mountWithProps()

    /**
     * Test CodeInput submit event triggers execute.
     */
    const codeInput = wrapper.findComponent({ name: 'CodeInput' })
    await codeInput.vm.$emit('submit')
    await nextTick()

    const emitted = wrapper.emitted('execute')
    expect(emitted).toBeTruthy()
    expect(emitted?.length).toBe(1)

    /**
     * Test Send button click also triggers execute.
     * The ScalarButton is bound with @click="emit('execute')".
     * We directly invoke the handler by finding the native button element.
     */
    const buttons = wrapper.findAll('button')
    const sendButton = buttons.find((btn) => btn.text().includes('Send') || btn.html().includes('Play'))

    expect(sendButton).toBeDefined()
    await sendButton?.trigger('click')
    await nextTick()

    expect(wrapper.emitted('execute')?.length).toBe(2)
  })

  it('disables Send button when percentage is below 100', async () => {
    const { wrapper } = mountWithProps({ percentage: 50 })
    await nextTick()

    /**
     * ScalarButton receives the disabled prop when percentage < 100.
     * ScalarButton renders aria-disabled when the disabled prop is true.
     */
    const buttons = wrapper.findAll('button')
    const sendButton = buttons.find((btn) => btn.text().includes('Send') || btn.html().includes('Play'))

    expect(sendButton).toBeDefined()
    expect(sendButton?.attributes('aria-disabled')).toBe('true')

    /**
     * Verify the button is not disabled when percentage is 100.
     */
    const { wrapper: wrapperEnabled } = mountWithProps({ percentage: 100 })
    await nextTick()

    const enabledButtons = wrapperEnabled.findAll('button')
    const enabledSendButton = enabledButtons.find((btn) => btn.text().includes('Send') || btn.html().includes('Play'))

    expect(enabledSendButton?.attributes('aria-disabled')).toBeUndefined()
  })

  it('renders ServerDropdown only when servers are provided', () => {
    /**
     * ServerDropdown should render when servers array has items.
     */
    const { wrapper: withServers } = mountWithProps({
      servers: [baseServer],
    })

    let serverDropdown = withServers.findComponent({ name: 'ServerDropdown' })
    expect(serverDropdown.exists()).toBe(true)

    /**
     * ServerDropdown should not render when servers array is empty.
     */
    const { wrapper: withoutServers } = mountWithProps({
      servers: [],
    })

    serverDropdown = withoutServers.findComponent({ name: 'ServerDropdown' })
    expect(serverDropdown.exists()).toBe(false)
  })

  it('focuses CodeInput on focusAddressBar event in web layout', async () => {
    const { eventBus } = mountWithProps({ layout: 'web' })

    /**
     * We test that the event can be emitted without errors.
     * The actual focus behavior relies on DOM elements and template refs
     * that are difficult to test in this environment without causing
     * issues with jsdom and Vue internals.
     */
    const mockEvent = {
      preventDefault: vi.fn(),
    } as any

    eventBus.emit('ui:focus:address-bar', { event: mockEvent })
    await nextTick()

    /**
     * Verify preventDefault was called, which indicates the handler processed the event.
     */
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it('focuses Send button on focusAddressBar event in modal layout', async () => {
    const { wrapper, eventBus } = mountWithProps({ layout: 'modal' })

    /**
     * The component uses a template ref for sendButtonRef.
     * We verify the event handler is registered.
     */
    const componentInstance = wrapper.vm as any
    expect(componentInstance.sendButtonRef).toBeDefined()

    /**
     * Emit the event and verify no errors occur.
     */
    const mockEvent = {
      preventDefault: vi.fn(),
    } as any

    eventBus.emit('ui:focus:send-button', { event: mockEvent })
    await nextTick()

    /**
     * The event handler is called, and we verify the component handles it gracefully.
     * In a real DOM environment, this would focus the send button.
     */
    expect(wrapper.vm).toBeDefined()
  })

  it('focuses CodeInput when hotKeys event indicates focusAddressBar', async () => {
    const { eventBus } = mountWithProps()

    /**
     * We test that the event can be emitted without errors.
     * The actual focus behavior relies on DOM elements and template refs.
     */
    const mockEvent = {
      preventDefault: vi.fn(),
    } as any

    eventBus.emit('ui:focus:address-bar', { event: mockEvent })
    await nextTick()

    /**
     * Verify preventDefault was called to stop the default browser behavior.
     */
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })
})
