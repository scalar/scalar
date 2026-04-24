import { getSelector } from '@scalar/helpers/dom/get-selector'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { type ApiReferenceEvents, createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { enableConsoleError, enableConsoleWarn } from '@test/vitest.setup'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { refocusBlurTarget } from '@/v2/blocks/scalar-address-bar-block/helpers/refocus-blur-target'
import type { ClientLayout } from '@/v2/types/layout'

import AddressBar, { type AddressBarProps } from './AddressBar.vue'

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    useId: () => 'address-bar-test-id',
  }
})

vi.mock('@/v2/blocks/scalar-address-bar-block/helpers/refocus-blur-target', () => ({
  refocusBlurTarget: vi.fn(),
}))

describe('AddressBar', () => {
  const baseEnvironment = {
    color: '#FFFFFF',
    variables: [],
  }

  const baseServer = {
    url: 'https://api.example.com',
    description: 'Production Server',
  }

  const mountWithProps = (custom: Partial<AddressBarProps> = {}) => {
    const eventBus = custom.eventBus ?? createWorkspaceEventBus()

    const wrapper = mount(AddressBar, {
      props: {
        path: custom.path ?? '/api/test',
        method: (custom.method ?? 'get') as HttpMethod,
        server: custom.server ?? baseServer,
        servers: custom.servers ?? [baseServer],
        history: custom.history ?? [],
        layout: (custom.layout ?? 'web') as ClientLayout,
        documentSlug: custom.documentSlug ?? 'test-doc',
        exampleKey: custom.exampleKey ?? 'default',
        eventBus,
        environment: baseEnvironment,
        serverMeta: {
          type: 'document',
        },
      },
    })

    return { wrapper, eventBus }
  }

  /**
   * Helper to create a FocusEvent whose relatedTarget is a Send button element.
   * jsdom supports relatedTarget on FocusEvent via the constructor options.
   * Returns the element so tests can compute the expected CSS selector via getSelector.
   */
  const makeSendBlurEvent = () => {
    const sendEl = document.createElement('button')
    sendEl.setAttribute('data-addressbar-action', 'send')
    document.body.appendChild(sendEl)
    const event = new FocusEvent('blur', { relatedTarget: sendEl })
    return { event, sendEl, cleanup: () => document.body.removeChild(sendEl) }
  }

  /**
   * Helper to create a FocusEvent whose relatedTarget is a sidebar item element.
   * Returns the element so tests can compute the expected CSS selector via getSelector.
   */
  const makeSidebarBlurEvent = (sidebarId = 'sidebar-item-1') => {
    const sidebarEl = document.createElement('div')
    sidebarEl.setAttribute('data-sidebar-id', sidebarId)
    document.body.appendChild(sidebarEl)
    const event = new FocusEvent('blur', { relatedTarget: sidebarEl })
    return { event, sidebarEl, cleanup: () => document.body.removeChild(sidebarEl) }
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
    )
  })

  it('emits operation:update:pathMethod with blurTargetSelector for Send button on CodeInput submit', async () => {
    const { wrapper, eventBus } = mountWithProps()
    const emitSpy = vi.spyOn(eventBus, 'emit')

    const codeInput = wrapper.findComponent({ name: 'CodeInput' })
    const submitEvent = new KeyboardEvent('keydown', { key: 'Enter' })
    await codeInput.vm.$emit('submit', '/api/test', submitEvent)
    await nextTick()

    expect(emitSpy).toHaveBeenCalledWith(
      'operation:update:pathMethod',
      expect.objectContaining({
        blurTargetSelector: '[data-addressbar-action="send"]',
        payload: { method: 'get', path: '/api/test' },
      }),
    )

    /**
     * CodeInput submit no longer emits execute directly — execution is
     * triggered via the event bus after the path update resolves.
     */
    expect(wrapper.emitted('execute')).toBeFalsy()
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

  it('calls preventDefault on ui:focus:address-bar event', async () => {
    const { eventBus } = mountWithProps({ layout: 'web' })

    const mockEvent = {
      preventDefault: vi.fn(),
    } as any

    eventBus.emit('ui:focus:address-bar', { event: mockEvent })
    await nextTick()

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
          payload.callback('conflict', null)
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

    it('sets methodConflict ref when callback returns conflict status', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      vi.spyOn(eventBus, 'emit').mockImplementation((event, _payload) => {
        const payload = _payload as ApiReferenceEvents['operation:update:pathMethod']
        if (event === 'operation:update:pathMethod' && payload?.callback) {
          payload.callback('conflict', null)
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

      const componentInstance = wrapper.vm as any
      expect(componentInstance.methodConflict).toBe('post')
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
          payload.callback('success', null)
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

    it('sets pathConflict when blur callback returns conflict status', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      vi.spyOn(eventBus, 'emit').mockImplementation((event, _payload) => {
        const payload = _payload as ApiReferenceEvents['operation:update:pathMethod']
        if (event === 'operation:update:pathMethod' && payload?.callback) {
          payload.callback('conflict', null)
        }
        return eventBus
      })

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      const blurEvent = new FocusEvent('blur', { relatedTarget: null })
      await codeInput.vm.$emit('blur', '/api/users', blurEvent)
      await nextTick()

      const componentInstance = wrapper.vm as any
      expect(componentInstance.pathConflict).toBe('/api/users')
    })

    it('clears path conflict when blur callback returns success status', async () => {
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
          payload.callback('success', null)
        }
        return eventBus
      })

      /**
       * Trigger a path blur which should clear the conflict.
       */
      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      const blurEvent = new FocusEvent('blur', { relatedTarget: null })
      await codeInput.vm.$emit('blur', '/api/products', blurEvent)
      await nextTick()

      /**
       * The conflict should be cleared.
       */
      expect(componentInstance.pathConflict).toBeNull()
      errorMessage = wrapper.find('.text-c-danger')
      expect(errorMessage.exists()).toBe(false)
    })
  })

  describe('handlePathSubmit', () => {
    it('uses the pasted URL path — not the current path prop — when a full URL is submitted via Enter', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/',
        method: 'get',
        servers: [baseServer],
        server: baseServer,
      })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      const submitEvent = new KeyboardEvent('keydown', { key: 'Enter' })

      /**
       * Simulate the user pasting a full URL into the address bar and pressing Enter.
       * The submit event carries the editor's current text content (the pasted URL),
       * not the `path` prop value ('/').
       */
      await codeInput.vm.$emit('submit', 'https://api.example.com/v2/users', submitEvent)
      await nextTick()

      /**
       * The server portion should be extracted and the remaining path (/v2/users)
       * sent as the payload — NOT the original path prop ('/').
       */
      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          blurTargetSelector: '[data-addressbar-action="send"]',
          payload: { method: 'get', path: '/v2/users' },
        }),
      )
    })

    it('keeps a pasted URL when the deferred placeholder mask runs before Enter', async () => {
      const animationFrameCallbacks: FrameRequestCallback[] = []
      const requestAnimationFrameSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
        animationFrameCallbacks.push(callback)
        return animationFrameCallbacks.length
      })

      const { wrapper, eventBus } = mountWithProps({
        path: '/',
        method: 'get',
        servers: [baseServer],
        server: baseServer,
      })

      try {
        await nextTick()

        const codeInput = wrapper.findComponent({ name: 'CodeInput' })
        const pastedUrl = 'https://api.example.com/v2/users'
        codeInput.vm.setCodeMirrorContent(pastedUrl)

        for (const callback of animationFrameCallbacks) {
          callback(performance.now())
        }

        expect(codeInput.vm.codeMirror.state.doc.toString()).toBe(pastedUrl)

        const emitSpy = vi.spyOn(eventBus, 'emit')
        const submitEvent = new KeyboardEvent('keydown', { key: 'Enter' })
        await codeInput.vm.$emit('submit', pastedUrl, submitEvent)
        await nextTick()

        expect(emitSpy).toHaveBeenCalledWith(
          'operation:update:pathMethod',
          expect.objectContaining({
            blurTargetSelector: '[data-addressbar-action="send"]',
            payload: { method: 'get', path: '/v2/users' },
          }),
        )
      } finally {
        requestAnimationFrameSpy.mockRestore()
      }
    })

    it('submits the empty masked path instead of the CodeMirror placeholder on Enter', async () => {
      const animationFrameCallbacks: FrameRequestCallback[] = []
      const requestAnimationFrameSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
        animationFrameCallbacks.push(callback)
        return animationFrameCallbacks.length
      })
      const originalGetClientRects = Range.prototype.getClientRects
      Object.defineProperty(Range.prototype, 'getClientRects', {
        configurable: true,
        value: () =>
          ({
            length: 0,
            item: () => null,
            [Symbol.iterator]: () => [][Symbol.iterator](),
          }) as DOMRectList,
      })

      const { wrapper, eventBus } = mountWithProps({
        path: '/',
        method: 'get',
        documentSlug: 'drafts',
        server: null,
        servers: [],
      })

      try {
        await nextTick()

        for (const callback of animationFrameCallbacks) {
          callback(performance.now())
        }

        await nextTick()

        const codeInput = wrapper.findComponent({ name: 'CodeInput' })
        expect(codeInput.vm.codeMirror.state.doc.toString()).toBe('')
        const editorContent = codeInput.find('.cm-content')
        editorContent.element.append('Enter a URL')
        expect(editorContent.text()).toBe('Enter a URL')

        const emitSpy = vi.spyOn(eventBus, 'emit')
        await editorContent.trigger('keydown.enter')
        await nextTick()

        expect(emitSpy).toHaveBeenCalledWith(
          'operation:update:pathMethod',
          expect.objectContaining({
            blurTargetSelector: '[data-addressbar-action="send"]',
            payload: { method: 'get', path: '/' },
          }),
        )
      } finally {
        requestAnimationFrameSpy.mockRestore()
        if (originalGetClientRects) {
          Object.defineProperty(Range.prototype, 'getClientRects', {
            configurable: true,
            value: originalGetClientRects,
          })
        } else {
          delete (Range.prototype as Partial<Range>).getClientRects
        }
      }
    })
  })

  describe('handleMethodChange', () => {
    it('emits operation:update:pathMethod with new method and current path', async () => {
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

      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          meta: { method: 'get', path: '/api/test' },
          payload: { method: 'post', path: '/api/test' },
        }),
      )
    })

    it('uses pathConflict as path when a path conflict is active', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const componentInstance = wrapper.vm as any
      componentInstance.pathConflict = '/api/users'
      await nextTick()

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
       * When a path conflict is active, the method change should use the conflicting
       * path so the user can resolve both at once.
       */
      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          payload: { method: 'post', path: '/api/users' },
        }),
      )
    })
  })

  describe('handlePathBlur', () => {
    it('emits operation:update:pathMethod with new path on blur', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      const blurEvent = new FocusEvent('blur', { relatedTarget: null })
      await codeInput.vm.$emit('blur', '/api/users', blurEvent)
      await nextTick()

      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          meta: { method: 'get', path: '/api/test' },
          payload: { method: 'get', path: '/api/users' },
          blurTargetSelector: null,
        }),
      )
    })

    it('normalizes empty path to slash on blur', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      const blurEvent = new FocusEvent('blur', { relatedTarget: null })
      await codeInput.vm.$emit('blur', '', blurEvent)
      await nextTick()

      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          payload: { method: 'get', path: '/' },
        }),
      )
    })

    it('prepends slash to path without leading slash on blur', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      const blurEvent = new FocusEvent('blur', { relatedTarget: null })
      await codeInput.vm.$emit('blur', 'api/users', blurEvent)
      await nextTick()

      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          payload: { method: 'get', path: '/api/users' },
        }),
      )
    })

    it('handles paths with special characters on blur', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      const blurEvent = new FocusEvent('blur', { relatedTarget: null })
      await codeInput.vm.$emit('blur', '/api/users/{name}', blurEvent)
      await nextTick()

      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          payload: { method: 'get', path: '/api/users/{name}' },
        }),
      )
    })

    it('sets blurTargetSelector to the Send button CSS selector when blurring toward the Send button', async () => {
      const { wrapper, eventBus } = mountWithProps({ path: '/api/test', method: 'get' })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const { event, sendEl, cleanup } = makeSendBlurEvent()
      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('blur', '/api/new-path', event)
      await nextTick()

      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          blurTargetSelector: getSelector(sendEl),
          payload: { method: 'get', path: '/api/new-path' },
        }),
      )

      cleanup()
    })

    it('sets blurTargetSelector to the sidebar item CSS selector when blurring toward a sidebar item', async () => {
      const { wrapper, eventBus } = mountWithProps({ path: '/api/test', method: 'get' })

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const { event, sidebarEl, cleanup } = makeSidebarBlurEvent('my-sidebar-item')
      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('blur', '/api/new-path', event)
      await nextTick()

      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          blurTargetSelector: getSelector(sidebarEl),
        }),
      )

      cleanup()
    })

    it('does not refocus the blur target when the update conflicts', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const { event, sendEl, cleanup } = makeSendBlurEvent()

      vi.spyOn(eventBus, 'emit').mockImplementation((eventName, _payload) => {
        const payload = _payload as ApiReferenceEvents['operation:update:pathMethod']
        if (eventName === 'operation:update:pathMethod' && payload?.callback) {
          payload.callback('conflict', getSelector(sendEl))
        }
        return eventBus
      })

      try {
        const codeInput = wrapper.findComponent({ name: 'CodeInput' })
        await codeInput.vm.$emit('blur', '/api/new-path', event)
        await nextTick()

        expect(refocusBlurTarget).not.toHaveBeenCalled()
      } finally {
        cleanup()
      }
    })

    it('uses methodConflict as method when a method conflict is active', async () => {
      const { wrapper, eventBus } = mountWithProps({
        path: '/api/test',
        method: 'get',
      })

      const componentInstance = wrapper.vm as any
      componentInstance.methodConflict = 'post'
      await nextTick()

      const emitSpy = vi.spyOn(eventBus, 'emit')

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      const blurEvent = new FocusEvent('blur', { relatedTarget: null })
      await codeInput.vm.$emit('blur', '/api/users', blurEvent)
      await nextTick()

      /**
       * When a method conflict is active, the path blur should use the conflicting
       * method so the user can resolve both at once.
       */
      expect(emitSpy).toHaveBeenCalledWith(
        'operation:update:pathMethod',
        expect.objectContaining({
          payload: { method: 'post', path: '/api/users' },
        }),
      )
    })
  })

  describe('Send button click behavior', () => {
    it('emits execute normally when Send is clicked', async () => {
      const { wrapper } = mountWithProps()

      const sendButton = wrapper.find('button[data-addressbar-action="send"]')
      expect(sendButton.exists()).toBe(true)
      await sendButton.trigger('click')
      await nextTick()

      expect(wrapper.emitted('execute')).toHaveLength(1)
    })
  })
})
