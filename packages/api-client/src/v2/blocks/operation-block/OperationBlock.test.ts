import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { createStoreEvents } from '@/store/events'
import { ResponseBlock } from '@/v2/blocks/scalar-response-block'

import Header from './components/Header.vue'
import OperationBlock from './OperationBlock.vue'

describe('OperationContainer', () => {
  const eventBus = createWorkspaceEventBus()
  const events = createStoreEvents()

  const defaultOperation = {
    responses: {},
  } as any

  const defaultProps = {
    eventBus,
    appVersion: 'test-version',
    path: '/pets',
    method: 'get' as const,
    layout: 'web' as const,
    server: undefined,
    servers: [],
    history: [],
    totalPerformedRequests: 0,
    operation: defaultOperation,
    exampleKey: 'default',
    selectedContentType: 'application/json',
    authMeta: { type: 'document' } as any,
    securitySchemes: {},
    selectedSecurity: { 'x-selected-index': 0, 'x-schemes': [] } as any,
    security: [],
    events,
    plugins: [],
    environment: {
      uid: 'env-1' as any,
      name: 'Test',
      color: 'blue',
      value: 'default',
    },
    envVariables: [],
  }

  const render = (overrides: Record<string, any> = {}) => {
    const props = { ...defaultProps, ...overrides }
    return mount(OperationBlock, { props })
  }

  it('passes draft method and path overrides to Header from operation', () => {
    const wrapper = render({
      method: 'get',
      path: '/pets',
      operation: {
        responses: {},
        'x-scalar-method': 'post',
        'x-scalar-path': '/pets/{id}',
      },
    })

    const header = wrapper.getComponent(Header)
    expect(header.props().method).toBe('post')
    expect(header.props().path).toBe('/pets/{id}')
  })

  it('emits operation:send:request via event bus when execute is triggered', () => {
    const fn = vi.fn()
    eventBus.on('operation:send:request', fn)

    const wrapper = render({ path: '/pets', method: 'get', exampleKey: 'ex1' })
    const header = wrapper.getComponent(Header)
    header.vm.$emit('execute')

    expect(fn).toHaveBeenCalledTimes(1)

    expect(fn).toHaveBeenCalledWith({ meta: { path: '/pets', method: 'get', exampleKey: 'ex1' } })
  })

  it('emits operation:update:method with new value when method is updated', () => {
    const fn = vi.fn()
    eventBus.on('operation:update:method', fn)

    const wrapper = render({ path: '/pets', method: 'get' })
    const header = wrapper.getComponent(Header)
    header.vm.$emit('update:method', { value: 'put' })

    expect(fn).toHaveBeenCalledTimes(1)

    expect(fn).toHaveBeenCalledWith({
      meta: { method: 'get', path: '/pets' },
      payload: { method: 'put' },
    })
  })

  it('emits operation:update:path with new value when path is updated', () => {
    const fn = vi.fn()
    eventBus.on('operation:update:path', fn)

    const wrapper = render({ path: '/pets', method: 'get' })
    const header = wrapper.getComponent(Header)
    header.vm.$emit('update:path', { value: '/animals' })

    expect(fn).toHaveBeenCalledTimes(1)

    expect(fn).toHaveBeenCalledWith({
      meta: { method: 'get', path: '/pets' },
      payload: { path: '/animals' },
    })
  })

  it('emits operation:send:request when ResponseBlock sendRequest event is triggered', () => {
    const fn = vi.fn()
    eventBus.on('operation:send:request', fn)

    const wrapper = render({ path: '/pets', method: 'get', exampleKey: 'ex2' })
    const responseBlock = wrapper.getComponent(ResponseBlock)
    responseBlock.vm.$emit('sendRequest')

    expect(fn).toHaveBeenCalledTimes(1)

    expect(fn).toHaveBeenCalledWith({ meta: { path: '/pets', method: 'get', exampleKey: 'ex2' } })
  })
})
