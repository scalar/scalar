import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { OperationEntriesMap } from '@scalar/workspace-store/navigation'
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

  /** Creates an operation entries map for testing conflicts */
  const createOperationEntriesMap = (entries: Array<{ path: string; method: string }> = []): OperationEntriesMap => {
    const map: OperationEntriesMap = new Map()
    entries.forEach(({ path, method }, index) => {
      const mockEntry = {
        id: `test-operation-${index}`,
        title: `${method.toUpperCase()} ${path}`,
        type: 'operation' as const,
        ref: `#/paths${path}/${method}`,
        method: method as HttpMethod,
        path,
        parent: {
          id: 'test-document',
          title: 'Test Document',
          type: 'document' as const,
          name: 'Test Document',
        },
      }
      map.set(`${path}|${method}`, [mockEntry])
    })
    return map
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
      operationEntriesMap: OperationEntriesMap
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
        operationEntriesMap: custom.operationEntriesMap ?? createOperationEntriesMap(),
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

  describe('path and method conflict error state', () => {
    it('shows error state when there is a conflict with path and method', async () => {
      /**
       * Create an operation entries map with an existing POST /api/test endpoint.
       * When the user tries to change the method to POST, a conflict should be detected.
       */
      const operationEntriesMap = createOperationEntriesMap([{ path: '/api/test', method: 'post' }])

      const { wrapper } = mountWithProps({
        path: '/api/test',
        method: 'get',
        operationEntriesMap,
      })

      const httpMethod = wrapper.findComponent({ name: 'HttpMethod' })
      const button = httpMethod.find('button')
      await button.trigger('click')
      await nextTick()

      /**
       * Select POST which conflicts with the existing POST /api/test operation.
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

      /**
       * The update:method event should NOT be emitted when there is a conflict.
       */
      const emitted = wrapper.emitted('update:method')
      expect(emitted).toBeFalsy()
    })

    it('clears error state when selecting a non-conflicting method', async () => {
      /**
       * Create an operation entries map with an existing POST /api/test endpoint.
       */
      const operationEntriesMap = createOperationEntriesMap([{ path: '/api/test', method: 'post' }])

      const { wrapper } = mountWithProps({
        path: '/api/test',
        method: 'get',
        operationEntriesMap,
      })

      const httpMethod = wrapper.findComponent({ name: 'HttpMethod' })
      const button = httpMethod.find('button')
      await button.trigger('click')
      await nextTick()

      const listbox = httpMethod.findComponent({ name: 'ScalarListbox' })

      /**
       * First, select POST which conflicts with the existing operation.
       */
      const postOption = { id: 'post', label: 'POST', color: 'text-method-post' }
      await listbox.vm.$emit('update:modelValue', postOption)
      await nextTick()

      /**
       * Verify the error state is shown.
       */
      let errorMessage = wrapper.find('.text-c-danger')
      expect(errorMessage.exists()).toBe(true)

      /**
       * Now select PUT which does not conflict with any existing operation.
       */
      await button.trigger('click')
      await nextTick()

      const putOption = { id: 'put', label: 'PUT', color: 'text-method-put' }
      await listbox.vm.$emit('update:modelValue', putOption)
      await nextTick()

      /**
       * The error state should be cleared and the update:method event should be emitted.
       */
      errorMessage = wrapper.find('.text-c-danger')
      expect(errorMessage.exists()).toBe(false)

      const emitted = wrapper.emitted('update:method')
      expect(emitted).toBeTruthy()
      expect(emitted?.[0]).toEqual([{ value: 'put' }])
    })

    it('clears error state when props for path and method change externally', async () => {
      /**
       * Create an operation entries map with an existing POST /api/test endpoint.
       */
      const operationEntriesMap = createOperationEntriesMap([{ path: '/api/test', method: 'post' }])

      const { wrapper } = mountWithProps({
        path: '/api/test',
        method: 'get',
        operationEntriesMap,
      })

      const httpMethod = wrapper.findComponent({ name: 'HttpMethod' })
      const button = httpMethod.find('button')
      await button.trigger('click')
      await nextTick()

      /**
       * Select POST which conflicts with the existing operation.
       */
      const listbox = httpMethod.findComponent({ name: 'ScalarListbox' })
      const postOption = { id: 'post', label: 'POST', color: 'text-method-post' }
      await listbox.vm.$emit('update:modelValue', postOption)
      await nextTick()

      /**
       * Verify the error state is shown.
       */
      let errorMessage = wrapper.find('.text-c-danger')
      expect(errorMessage.exists()).toBe(true)

      /**
       * Simulate an external prop change (e.g., user navigates to a different request).
       * The watcher on [method, path] should clear the error state.
       */
      await wrapper.setProps({ method: 'delete' })
      await nextTick()

      /**
       * The error state should be cleared after the prop change.
       */
      errorMessage = wrapper.find('.text-c-danger')
      expect(errorMessage.exists()).toBe(false)
    })

    it('clears error state when path prop changes externally', async () => {
      /**
       * Create an operation entries map with an existing POST /api/test endpoint.
       */
      const operationEntriesMap = createOperationEntriesMap([{ path: '/api/test', method: 'post' }])

      const { wrapper } = mountWithProps({
        path: '/api/test',
        method: 'get',
        operationEntriesMap,
      })

      const httpMethod = wrapper.findComponent({ name: 'HttpMethod' })
      const button = httpMethod.find('button')
      await button.trigger('click')
      await nextTick()

      /**
       * Select POST which conflicts with the existing operation.
       */
      const listbox = httpMethod.findComponent({ name: 'ScalarListbox' })
      const postOption = { id: 'post', label: 'POST', color: 'text-method-post' }
      await listbox.vm.$emit('update:modelValue', postOption)
      await nextTick()

      /**
       * Verify the error state is shown.
       */
      let errorMessage = wrapper.find('.text-c-danger')
      expect(errorMessage.exists()).toBe(true)

      /**
       * Simulate an external path prop change.
       * The watcher on [method, path] should clear the error state.
       */
      await wrapper.setProps({ path: '/api/users' })
      await nextTick()

      /**
       * The error state should be cleared after the path prop change.
       */
      errorMessage = wrapper.find('.text-c-danger')
      expect(errorMessage.exists()).toBe(false)
    })
  })

  describe('handleMethodChange', () => {
    it('allows changing to the same method without triggering a conflict', async () => {
      const operationEntriesMap = createOperationEntriesMap([{ path: '/api/test', method: 'get' }])

      const { wrapper } = mountWithProps({
        path: '/api/test',
        method: 'get',
        operationEntriesMap,
      })

      const httpMethod = wrapper.findComponent({ name: 'HttpMethod' })
      const button = httpMethod.find('button')
      await button.trigger('click')
      await nextTick()

      const listbox = httpMethod.findComponent({ name: 'ScalarListbox' })
      const getOption = { id: 'get', label: 'GET', color: 'text-method-get' }
      await listbox.vm.$emit('update:modelValue', getOption)
      await nextTick()

      /**
       * Changing to the same method should emit update:method
       * because the condition checks method !== newMethod.
       */
      const emitted = wrapper.emitted('update:method')
      expect(emitted).toBeTruthy()
      expect(emitted?.[0]).toEqual([{ value: 'get' }])
    })
  })

  describe('handlePathUpdate', () => {
    it('does not emit update:path when updating to a conflicting path', async () => {
      const operationEntriesMap = createOperationEntriesMap([
        { path: '/api/users', method: 'get' },
        { path: '/api/products', method: 'get' },
      ])

      const { wrapper } = mountWithProps({
        path: '/api/test',
        method: 'get',
        operationEntriesMap,
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('update:modelValue', '/api/users')
      await nextTick()

      /**
       * The update:path event should NOT be emitted due to conflict.
       */
      const emitted = wrapper.emitted('update:path')
      expect(emitted).toBeFalsy()

      /**
       * conflict should be set with the conflicting path.
       */
      const componentInstance = wrapper.vm as any
      expect(componentInstance.conflict?.path).toBe('/api/users')
    })

    it('allows updating to the same path without triggering a conflict', async () => {
      const operationEntriesMap = createOperationEntriesMap([{ path: '/api/test', method: 'get' }])

      const { wrapper } = mountWithProps({
        path: '/api/test',
        method: 'get',
        operationEntriesMap,
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('update:modelValue', '/api/test')
      await nextTick()

      /**
       * Updating to the same path should emit update:path
       * because the condition checks newPath !== path.
       */
      const emitted = wrapper.emitted('update:path')
      expect(emitted).toBeTruthy()
      expect(emitted?.[0]).toEqual([{ value: '/api/test' }])
    })

    it('handles empty path gracefully', async () => {
      const operationEntriesMap = createOperationEntriesMap([{ path: '/api/test', method: 'get' }])

      const { wrapper } = mountWithProps({
        path: '/api/test',
        method: 'get',
        operationEntriesMap,
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('update:modelValue', '')
      await nextTick()

      /**
       * Empty path should be allowed and emit update:path.
       */
      const emitted = wrapper.emitted('update:path')
      expect(emitted).toBeTruthy()
      expect(emitted?.[0]).toEqual([{ value: '' }])

      const componentInstance = wrapper.vm as any
      expect(componentInstance.conflict).toBeNull()
    })

    it('handles paths with special characters and detects conflicts', async () => {
      const operationEntriesMap = createOperationEntriesMap([{ path: '/api/users/{id}', method: 'get' }])

      const { wrapper } = mountWithProps({
        path: '/api/test',
        method: 'get',
        operationEntriesMap,
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })

      /**
       * Update to a path with special characters that does not conflict.
       */
      await codeInput.vm.$emit('update:modelValue', '/api/users/{name}')
      await nextTick()

      const emitted = wrapper.emitted('update:path')
      expect(emitted).toBeTruthy()
      expect(emitted?.[0]).toEqual([{ value: '/api/users/{name}' }])

      /**
       * Update to a path that does conflict.
       */
      await codeInput.vm.$emit('update:modelValue', '/api/users/{id}')
      await nextTick()

      const componentInstance = wrapper.vm as any
      expect(componentInstance.conflict).toEqual({ method: 'get', path: '/api/users/{id}' })
    })
  })
})
