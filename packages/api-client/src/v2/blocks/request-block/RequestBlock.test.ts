import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, markRaw } from 'vue'

import RequestBody from '@/v2/blocks/request-block/components/RequestBody.vue'
import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'

import RequestBlock from './RequestBlock.vue'

const defaultProps = {
  method: 'get' as const,
  path: 'http://example.com/foo',
  operation: {
    summary: '',
  },
  layout: 'web' as const,
  exampleKey: 'example-1',
  securitySchemes: {},
  selectedSecurity: { selectedIndex: 0, selectedSchemes: [] },
  selectedSecuritySchemes: [],
  securityRequirements: [],
  environment: {
    color: 'blue',
    variables: [],
    description: 'Test Environment',
  },
  authMeta: { type: 'document' as const },
  server: null,
  proxyUrl: '',
  plugins: [],
  eventBus: createWorkspaceEventBus(),
  clientOptions: [],
  selectedClient: 'shell/curl' as const,
  globalCookies: [],
}

describe('RequestBlock', () => {
  it('renders request name input and emits on change for non-modal layout', async () => {
    const eventBus = createWorkspaceEventBus()
    const fn = vi.fn()
    eventBus.on('operation:update:summary', fn)
    const wrapper = mount(RequestBlock, {
      props: { ...defaultProps, eventBus },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    // Placeholder falls back to path without protocol when summary is empty
    expect(input.attributes('placeholder')).toBe('example.com/foo')

    await input.setValue('New Name')

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({
      payload: { summary: 'New Name' },
      meta: { method: 'get', path: 'http://example.com/foo', exampleKey: 'example-1' },
    })
  })

  it('renders summary text instead of input in modal layout', () => {
    const wrapper = mount(RequestBlock, {
      props: { ...defaultProps, operation: { summary: 'My request' }, layout: 'modal' },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.find('span').text()).toBe('My request')
  })

  it('applies aria-label with request summary on the container', () => {
    const wrapper = mount(RequestBlock, {
      props: {
        ...defaultProps,
        operation: { ...(defaultProps.operation as any), summary: 'Summary' },
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.attributes('aria-label')).toBe('Request: Summary')
  })

  it('shows Auth section in modal layout', () => {
    const wrapper = mount(RequestBlock, {
      props: {
        ...defaultProps,
        layout: 'modal',
        securitySchemes: {
          a: {
            type: 'apiKey',
            'x-scalar-secret-token': '',
            name: 'X-API-Key',
            in: 'header',
          },
        },
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const auth = wrapper.findComponent(AuthSelector)
    expect(auth.exists()).toBe(true)
    expect(auth.isVisible()).toBe(true)
  })

  it('hides Auth section in modal layout when no security is configured', () => {
    const wrapper = mount(RequestBlock, {
      props: {
        ...defaultProps,
        layout: 'modal',
      },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const auth = wrapper.findComponent(AuthSelector)
    expect(auth.exists()).toBe(true)
    // The stub element exists but is hidden via v-show
    expect(auth.isVisible()).toBe(false)
  })

  it('shows Auth section when not in modal layout', () => {
    const wrapper = mount(RequestBlock, {
      props: { ...defaultProps },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const auth = wrapper.findComponent(AuthSelector)
    expect(auth.exists()).toBe(true)
    expect(auth.isVisible()).toBe(true)
  })

  it('hides request body for methods without a body', () => {
    const wrapper = mount(RequestBlock, {
      props: { ...defaultProps, method: 'get' },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const bodyGet = wrapper.findComponent(RequestBody)
    expect(bodyGet.exists()).toBe(true)
    expect(bodyGet.isVisible()).toBe(false)
  })

  it('shows request body for methods with a body', () => {
    const wrapper = mount(RequestBlock, {
      props: { ...defaultProps, method: 'post' },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const bodyGet = wrapper.findComponent(RequestBody)
    expect(bodyGet.exists()).toBe(true)
    expect(bodyGet.isVisible()).toBe(true)
  })

  it('re-emits parameter upsert, and delete events with mapped types', () => {
    const eventBus = createWorkspaceEventBus()
    const fn = vi.fn()
    eventBus.on('operation:upsert:parameter', fn)
    eventBus.on('operation:delete:parameter', fn)
    const wrapper = mount(RequestBlock, {
      props: { ...defaultProps, eventBus },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const params = wrapper.findAllComponents({ name: 'RequestParams' })
    expect(params.length).toBe(4)

    const titleToType: Record<string, string> = {
      Variables: 'path',
      Cookies: 'cookie',
      Headers: 'header',
      'Query Parameters': 'query',
    }

    for (const p of params) {
      const title = (p.props() as any).title as string
      const expectedType = titleToType[title]

      // Path (Variables) does not support adding new rows
      if (expectedType !== 'path') {
        // Add events are debounced, so we need to use fake timers
        vi.useFakeTimers()
        // For headers, index 0 is a default header (Accept), so use index 1 to add a new parameter
        // For cookies and query, index 0 is fine as there are no default parameters
        const addIndex = expectedType === 'header' ? 1 : 0
        p.vm.$emit('upsert', addIndex, { name: 'k', value: 'v', isDisabled: false })
        vi.advanceTimersByTime(400)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith({
          type: expectedType,
          originalParameter: null,
          payload: { name: 'k', value: 'v', isDisabled: false },
          meta: { method: 'get', path: 'http://example.com/foo', exampleKey: 'example-1' },
        })
        fn.mockReset()
        vi.useRealTimers()
      }

      // Update events are debounced, so we need to use fake timers
      vi.useFakeTimers()
      // For headers, index 1 is a default header (Accept), so use index 2 to update a user parameter
      // For cookies and query, index 1 is fine
      // Since we don't have actual parameters in the context, originalParameter will be null
      const updateIndex = expectedType === 'header' ? 2 : 1
      p.vm.$emit('upsert', updateIndex, { name: 'x', value: 'y', isDisabled: false })
      vi.advanceTimersByTime(400)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith({
        type: expectedType,
        originalParameter: null,
        payload: { name: 'x', value: 'y', isDisabled: false },
        meta: { method: 'get', path: 'http://example.com/foo', exampleKey: 'example-1' },
      })
      fn.mockReset()
      vi.useRealTimers()
    }
  })

  it('re-emits parameter deleteAll for Cookies with mapped type', () => {
    const eventBus = createWorkspaceEventBus()
    const fn = vi.fn()
    eventBus.on('operation:delete-all:parameters', fn)
    const wrapper = mount(RequestBlock, {
      props: { ...defaultProps, eventBus },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const cookies = wrapper
      .findAllComponents({ name: 'RequestParams' })
      .find((p) => (p.props() as any).title === 'Cookies')
    expect(cookies).toBeTruthy()
    cookies!.vm.$emit('deleteAll')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({
      type: 'cookie',
      meta: { method: 'get', path: 'http://example.com/foo', exampleKey: 'example-1' },
    })
  })

  it('re-emits request body events', () => {
    const eventBus = createWorkspaceEventBus()
    const fn = vi.fn()
    eventBus.on('operation:update:requestBody:contentType', fn)
    eventBus.on('operation:update:requestBody:value', fn)
    eventBus.on('operation:update:requestBody:formValue', fn)
    const wrapper = mount(RequestBlock, {
      props: { ...defaultProps, method: 'post', eventBus },
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const body = wrapper.findComponent(RequestBody)
    expect(body.exists()).toBe(true)

    // Reset the mock to clear the initial contentType emission from the watcher
    fn.mockReset()

    const contentTypePayload = { value: 'application/json' }
    body.vm.$emit('update:contentType', contentTypePayload)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({
      payload: { contentType: 'application/json' },
      meta: { method: 'post', path: 'http://example.com/foo', exampleKey: 'example-1' },
    })
    fn.mockReset()

    vi.useFakeTimers()
    const valuePayload = { payload: 'hello', contentType: 'application/json' }
    body.vm.$emit('update:value', valuePayload)
    vi.advanceTimersByTime(400)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({
      payload: 'hello',
      contentType: 'application/json',
      meta: { method: 'post', path: 'http://example.com/foo', exampleKey: 'example-1' },
    })
    fn.mockReset()

    // Add form row events are debounced when debounceKeySuffix is provided
    vi.useFakeTimers()
    const addFormRowPayload = {
      payload: [{ name: 'a', value: 'b', isDisabled: false }],
      contentType: 'application/json',
      debounceKeySuffix: 'add-0',
    }
    body.vm.$emit('update:formValue', addFormRowPayload)
    vi.advanceTimersByTime(400)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({
      payload: [{ name: 'a', value: 'b', isDisabled: false }],
      contentType: 'application/json',
      meta: { method: 'post', path: 'http://example.com/foo', exampleKey: 'example-1' },
    })
    fn.mockReset()
    vi.useRealTimers()

    // Update form row events are debounced, so we need to use fake timers
    vi.useFakeTimers()
    const updateFormRowPayload = {
      payload: [{ name: 'x', value: 'y', isDisabled: false }],
      contentType: 'application/json',
      debounceKeySuffix: '1-name',
    }
    body.vm.$emit('update:formValue', updateFormRowPayload)
    vi.advanceTimersByTime(400)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({
      payload: [{ name: 'x', value: 'y', isDisabled: false }],
      contentType: 'application/json',
      meta: { method: 'post', path: 'http://example.com/foo', exampleKey: 'example-1' },
    })
    fn.mockReset()
    vi.useRealTimers()
  })

  it('renders plugin component when provided', () => {
    const wrapper = mount(RequestBlock, {
      props: {
        ...defaultProps,
        plugins: [
          {
            components: {
              request: markRaw(
                defineComponent({
                  props: {
                    operation: { type: Object, required: true },
                    selectedExample: { type: String, required: false },
                  },
                  template: '<div>Plugin Request Component</div>',
                }),
              ),
            },
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('Plugin Request Component')
  })
})
