import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedAsyncApiOperation } from '@scalar/workspace-store/schemas/navigation'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NAVIGATION_HREF } from '@/hooks/use-navigation-href'

import OperationsList from './OperationsList.vue'

const operation = {
  type: 'asyncapi-operation',
  id: 'doc/channel/events/operation/subscribe',
  title: 'Subscribe to events',
  operationName: 'subscribe',
  action: 'receive',
  channelName: 'events',
  channelAddress: 'events',
} satisfies TraversedAsyncApiOperation

const apiDocument = {
  asyncapi: '3.0.0',
  info: { title: 'Events', version: '1.0.0' },
  'x-scalar-original-document-hash': '',
} satisfies AsyncApiDocument

const props = {
  channelTitle: 'Events',
  operations: [operation],
  document: apiDocument,
  eventBus: null,
}

enableAutoUnmount(afterEach)

describe('OperationsList', () => {
  it('uses the configured router for operation links', () => {
    const wrapper = mount(OperationsList, {
      props,
      global: { provide: { [NAVIGATION_HREF]: (id: string): string => `/reference/${id}` } },
    })

    expect(wrapper.get('a').attributes('href')).toBe(`/reference/${operation.id}`)
    expect(wrapper.get('a').text()).toBe('receiveSubscribe to events')
  })

  it('uses an encoded section anchor without a router', () => {
    const wrapper = mount(OperationsList, { props })

    expect(wrapper.get('a').attributes('href')).toBe('#doc%2Fchannel%2Fevents%2Foperation%2Fsubscribe')
  })

  it.each([
    { name: 'plain click', options: {}, withBus: true, intercepted: true },
    { name: 'Ctrl-click', options: { ctrlKey: true }, withBus: true, intercepted: false },
    { name: 'Cmd-click', options: { metaKey: true }, withBus: true, intercepted: false },
    { name: 'Shift-click', options: { shiftKey: true }, withBus: true, intercepted: false },
    { name: 'click without an event bus', options: {}, withBus: false, intercepted: false },
  ])('preserves navigation for $name', ({ options, withBus, intercepted }) => {
    const eventBus = createWorkspaceEventBus()
    const onScroll = vi.fn()
    eventBus.on('scroll-to:nav-item', onScroll)
    const wrapper = mount(OperationsList, {
      props: { ...props, eventBus: withBus ? eventBus : null },
    })
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, ...options })
    const link = wrapper.get('a').element
    // Observe the component handler before preventing jsdom from following native links.
    const prevented: boolean[] = []
    link.addEventListener('click', (event) => {
      prevented.push(event.defaultPrevented)
      event.preventDefault()
    })
    link.dispatchEvent(click)

    expect(prevented).toEqual([intercepted])
    expect(onScroll.mock.calls).toEqual(intercepted ? [[{ id: operation.id }]] : [])
  })
})
