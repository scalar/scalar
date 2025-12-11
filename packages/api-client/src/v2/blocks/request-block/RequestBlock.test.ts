import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

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
  security: [],
  environment: {
    color: 'blue',
    variables: [],
    description: 'Test Environment',
  },
  envVariables: [],
  eventBus: createWorkspaceEventBus(),
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

  it('re-emits parameter add, update, and delete events with mapped types', () => {
    const eventBus = createWorkspaceEventBus()
    const fn = vi.fn()
    eventBus.on('operation:add:parameter', fn)
    eventBus.on('operation:update:parameter', fn)
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
        p.vm.$emit('add', { key: 'k', value: 'v' })

        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith({
          type: expectedType,
          payload: { key: 'k', value: 'v', isDisabled: false },
          meta: { method: 'get', path: 'http://example.com/foo', exampleKey: 'example-1' },
        })
        fn.mockReset()
      }

      // Update events are debounced, so we need to use fake timers
      vi.useFakeTimers()
      p.vm.$emit('update', { index: 1, payload: { key: 'x', value: 'y', isDisabled: false } })
      vi.advanceTimersByTime(400)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith({
        type: expectedType,
        index: 1,
        payload: { key: 'x', value: 'y', isDisabled: false },
        meta: { method: 'get', path: 'http://example.com/foo', exampleKey: 'example-1' },
      })
      fn.mockReset()
      vi.useRealTimers()

      p.vm.$emit('delete', { index: 2 })
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith({
        type: expectedType,
        index: 2,
        meta: { method: 'get', path: 'http://example.com/foo', exampleKey: 'example-1' },
      })
      fn.mockReset()
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
    eventBus.on('operation:add:requestBody:formRow', fn)
    eventBus.on('operation:update:requestBody:formRow', fn)
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

    const contentTypePayload = { value: 'application/json' }
    body.vm.$emit('update:contentType', contentTypePayload)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({
      payload: { contentType: 'application/json' },
      meta: { method: 'post', path: 'http://example.com/foo', exampleKey: 'example-1' },
    })
    fn.mockReset()

    const valuePayload = { value: 'hello', contentType: 'application/json' }
    body.vm.$emit('update:value', valuePayload)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({
      payload: { value: 'hello' },
      contentType: 'application/json',
      meta: { method: 'post', path: 'http://example.com/foo', exampleKey: 'example-1' },
    })
    fn.mockReset()

    const addFormRowPayload = { data: { key: 'a', value: 'b' }, contentType: 'application/json' }
    body.vm.$emit('add:formRow', addFormRowPayload)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({
      payload: { key: 'a', value: 'b' },
      contentType: 'application/json',
      meta: { method: 'post', path: 'http://example.com/foo', exampleKey: 'example-1' },
    })
    fn.mockReset()

    // Update form row events are debounced, so we need to use fake timers
    vi.useFakeTimers()
    const updateFormRowPayload = { index: 1, data: { key: 'x', value: 'y' }, contentType: 'application/json' }
    body.vm.$emit('update:formRow', updateFormRowPayload)
    vi.advanceTimersByTime(400)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({
      index: 1,
      payload: { key: 'x', value: 'y' },
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
              request: defineComponent({
                props: {
                  operation: { type: Object, required: true },
                  selectedExample: { type: String, required: false },
                },
                template: '<div>Plugin Request Component</div>',
              }),
            },
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('Plugin Request Component')
  })
})
