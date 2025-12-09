import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { createStoreEvents } from '@/store/events'
import { ResponseBlock } from '@/v2/blocks/response-block'

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
    server: null,
    servers: [],
    history: [],
    totalPerformedRequests: 0,
    operation: defaultOperation,
    exampleKey: 'default',
    selectedContentType: 'application/json',
    authMeta: { type: 'document' } as any,
    securitySchemes: {},
    selectedSecurity: { selectedIndex: 0, selectedSchemes: [] } as any,
    security: [],
    events,
    plugins: [],
    environment: {
      color: 'blue',
      variables: [],
      description: 'Test Environment',
    },
    envVariables: [],
  }

  const render = (overrides: Record<string, any> = {}) => {
    const props = { ...defaultProps, ...overrides }
    return mount(OperationBlock, { props })
  }

  it('emits operation:send:request via event bus when execute is triggered', () => {
    const fn = vi.fn()
    eventBus.on('operation:send:request', fn)

    const wrapper = render({ path: '/pets', method: 'get', exampleKey: 'ex1' })
    const header = wrapper.getComponent(Header)
    header.vm.$emit('execute')

    expect(fn).toHaveBeenCalledTimes(1)

    expect(fn).toHaveBeenCalledWith({ meta: { path: '/pets', method: 'get', exampleKey: 'ex1' } })
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
