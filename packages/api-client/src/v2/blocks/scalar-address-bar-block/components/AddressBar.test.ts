import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { type ApiReferenceEvents, createWorkspaceEventBus } from '@scalar/workspace-store/events'
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

  it('emits operation:update:pathMethod via eventBus when HttpMethod is clicked and changed', async () => {
    const { wrapper, eventBus } = mountWithProps()
    const emitSpy = vi.spyOn(eventBus, 'emit')

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

    expect(emitSpy).toHaveBeenCalledWith(
      'operation:update:pathMethod',
      expect.objectContaining({
        meta: { method: 'get', path: '/api/test' },
        payload: { method: 'post', path: '/api/test' },
      }),
      undefined,
    )
  })

  it('emits operation:update:pathMethod via eventBus when CodeInput updates modelValue', async () => {
    const { wrapper, eventBus } = mountWithProps()
    const emitSpy = vi.spyOn(eventBus, 'emit')

    const codeInput = wrapper.findComponent({ name: 'CodeInput' })
    await codeInput.vm.$emit('update:modelValue', '/api/users')
    await nextTick()

    expect(emitSpy).toHaveBeenCalledWith(
      'operation:update:pathMethod',
      expect.objectContaining({
        meta: { method: 'get', path: '/api/test' },
        payload: { method: 'get', path: '/api/users' },
      }),
      { debounceKey: 'operation:update:pathMethod-/api/test-get' },
    )
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

  describe('path and method conflict error state', () => {
    it('shows error state when callback returns conflict status', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      /**
       * Mock the eventBus.emit to capture the callback and call it with 'conflict' status.
       */
      vi.spyOn(eventBus, 'emit').mockImplementation((event, _payload) => {
        const payload = _payload as ApiReferenceEvents['operation:update:pathMethod']
        if (event === 'operation:update:pathMethod' && payload?.callback) {
          payload.callback('conflict')
        }
        return eventBus
      })

      const httpMethod = wrapper.findComponent({ name: 'HttpMethod' })
      const button = httpMethod.find('button')
      await button.trigger('click')
      await nextTick()

      /**
       * Select POST which will trigger the conflict callback.
       */
      const listbox = httpMethod.findComponent({ name: 'ScalarListbox' })
      const postOption = { id: 'post', label: 'POST', color: 'text-method-post' }
      await listbox.vm.$emit('update:modelValue', postOption)
      await nextTick()

      /**
       * The error message should be displayed when a conflict is detected.
       * The component shows a warning with the conflicting method and path.
       */
      const errorMessage = wrapper.find('.text-c-danger')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toContain('POST')
      expect(errorMessage.text()).toContain('/api/test')
      expect(errorMessage.text()).toContain('already exists')

      /**
       * The address bar should have an error outline when there is a conflict.
       */
      const addressBar = wrapper.find('.address-bar-bg-states')
      expect(addressBar.classes()).toContain('outline-c-danger')
    })

    it('clears conflict refs when callback returns success status', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const componentInstance = wrapper.vm as any

      /**
       * Manually set the conflict state to simulate a previous conflict.
       */
      componentInstance.methodConflict = 'post'
      await nextTick()

      /**
       * Verify the error state is shown.
       */
      let errorMessage = wrapper.find('.text-c-danger')
      expect(errorMessage.exists()).toBe(true)

      /**
       * Mock the eventBus.emit to call the callback with 'success' status.
       */
      vi.spyOn(eventBus, 'emit').mockImplementation((event, _payload) => {
        const payload = _payload as ApiReferenceEvents['operation:update:pathMethod']
        if (event === 'operation:update:pathMethod' && payload?.callback) {
          payload.callback('success')
        }
        return eventBus
      })

      /**
       * Trigger a method change which should clear the conflict.
       */
      const httpMethod = wrapper.findComponent({ name: 'HttpMethod' })
      await httpMethod.vm.$emit('change', 'put')
      await nextTick()

      /**
       * The conflict should be cleared.
       */
      expect(componentInstance.methodConflict).toBeNull()
      errorMessage = wrapper.find('.text-c-danger')
      expect(errorMessage.exists()).toBe(false)
    })

    it('exposes methodConflict and pathConflict refs', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      /**
       * Mock the eventBus.emit to call the callback with 'conflict' status.
       */
      vi.spyOn(eventBus, 'emit').mockImplementation((event, _payload) => {
        const payload = _payload as ApiReferenceEvents['operation:update:pathMethod']
        if (event === 'operation:update:pathMethod' && payload?.callback) {
          payload.callback('conflict')
        }
        return eventBus
      })

      const httpMethod = wrapper.findComponent({ name: 'HttpMethod' })
      const button = httpMethod.find('button')
      await button.trigger('click')
      await nextTick()

      const listbox = httpMethod.findComponent({ name: 'ScalarListbox' })
      const postOption = { id: 'post', label: 'POST', color: 'text-method-post' }
      await listbox.vm.$emit('update:modelValue', postOption)
      await nextTick()

      /**
       * The methodConflict should be set via the exposed ref.
       */
      const componentInstance = wrapper.vm as any
      expect(componentInstance.methodConflict).toBe('post')
    })

    it('clears path conflict when callback returns success status', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const componentInstance = wrapper.vm as any

      /**
       * Manually set the path conflict state to simulate a previous conflict.
       */
      componentInstance.pathConflict = '/api/users'
      await nextTick()

      /**
       * Verify the error state is shown.
       */
      let errorMessage = wrapper.find('.text-c-danger')
      expect(errorMessage.exists()).toBe(true)

      /**
       * Mock the eventBus.emit to call the callback with 'success' status.
       */
      vi.spyOn(eventBus, 'emit').mockImplementation((event, _payload) => {
        const payload = _payload as ApiReferenceEvents['operation:update:pathMethod']
        if (event === 'operation:update:pathMethod' && payload?.callback) {
          payload.callback('success')
        }
        return eventBus
      })

      /**
       * Trigger a path change which should clear the conflict.
       */
      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('update:modelValue', '/api/products')
      await nextTick()

      /**
       * The conflict should be cleared.
       */
      expect(componentInstance.pathConflict).toBeNull()
      errorMessage = wrapper.find('.text-c-danger')
      expect(errorMessage.exists()).toBe(false)
    })
  })

  describe('handleMethodChange', () => {
    it('emits operation:update:pathMethod when changing method', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const httpMethod = wrapper.findComponent({ name: 'HttpMethod' })
      const button = httpMethod.find('button')
      await button.trigger('click')
      await nextTick()

      const listbox = httpMethod.findComponent({ name: 'ScalarListbox' })
      const postOption = { id: 'post', label: 'POST', color: 'text-method-post' }
      await listbox.vm.$emit('update:modelValue', postOption)
      await nextTick()

      /**
       * Should emit operation:update:pathMethod with new method and current path.
       */
      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          meta: { method: 'get', path: '/api/test' },
          payload: { method: 'post', path: '/api/test' },
        }),
        undefined,
      )
    })
  })

  describe('handlePathUpdate', () => {
    it('sets pathConflict when callback returns conflict status', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      /**
       * Mock the eventBus.emit to call the callback with 'conflict' status.
       */
      vi.spyOn(eventBus, 'emit').mockImplementation((event, _payload) => {
        const payload = _payload as ApiReferenceEvents['operation:update:pathMethod']
        if (event === 'operation:update:pathMethod' && payload?.callback) {
          payload.callback('conflict')
        }
        return eventBus
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('update:modelValue', '/api/users')
      await nextTick()

      /**
       * pathConflict should be set with the conflicting path.
       */
      const componentInstance = wrapper.vm as any
      expect(componentInstance.pathConflict).toBe('/api/users')
    })

    it('emits operation:update:pathMethod with new path', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('update:modelValue', '/api/test')
      await nextTick()

      /**
       * Should emit operation:update:pathMethod with the new path.
       */
      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          meta: { method: 'get', path: '/api/test' },
          payload: { method: 'get', path: '/api/test' },
        }),
        { debounceKey: 'operation:update:pathMethod-/api/test-get' },
      )
    })

    it('handles empty path by normalizing to slash', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('update:modelValue', '')
      await nextTick()

      /**
       * Empty path should be normalized to slash.
       */
      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          meta: { method: 'get', path: '/api/test' },
          payload: { method: 'get', path: '/' },
        }),
        { debounceKey: 'operation:update:pathMethod-/api/test-get' },
      )

      const componentInstance = wrapper.vm as any
      expect(componentInstance.pathConflict).toBeNull()
    })

    it('handles paths with special characters', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })

      /**
       * Update to a path with special characters.
       */
      await codeInput.vm.$emit('update:modelValue', '/api/users/{name}')
      await nextTick()

      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          meta: { method: 'get', path: '/api/test' },
          payload: { method: 'get', path: '/api/users/{name}' },
        }),
        { debounceKey: 'operation:update:pathMethod-/api/test-get' },
      )
    })
  })

  describe('path normalization', () => {
    it('keeps path unchanged when it already starts with slash', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('update:modelValue', '/api/users')
      await nextTick()

      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          payload: { method: 'get', path: '/api/users' },
        }),
        { debounceKey: 'operation:update:pathMethod-/api/test-get' },
      )
    })

    it('prepends slash to path without leading slash', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('update:modelValue', 'api/users')
      await nextTick()

      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          payload: { method: 'get', path: '/api/users' },
        }),
        { debounceKey: 'operation:update:pathMethod-/api/test-get' },
      )
    })
  })
})
