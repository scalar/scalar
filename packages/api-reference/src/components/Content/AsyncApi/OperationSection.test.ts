import type { AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OperationSection from './OperationSection.vue'

/** Build a $ref wrapper as produced by the workspace store after bundling */
const ref = <T>(value: T) => ({ $ref: '#/mock', '$ref-value': value })

const createOperation = (overrides: Partial<AsyncApiOperationObject> = {}): AsyncApiOperationObject =>
  ({
    action: 'send',
    channel: ref({ messages: {} }),
    title: 'Send light measurement',
    description: 'Publishes a light measurement.',
    ...overrides,
  }) as AsyncApiOperationObject

describe('OperationSection', () => {
  it('renders the operation title and description', () => {
    const wrapper = mount(OperationSection, {
      props: {
        eventBus: null,
        operationId: 'sendLightMeasurement',
        operation: createOperation(),
      },
    })

    expect(wrapper.text()).toContain('Send light measurement')
    expect(wrapper.text()).toContain('Publishes a light measurement.')
  })

  it('falls back to the operation id when there is no title', () => {
    const wrapper = mount(OperationSection, {
      props: {
        eventBus: null,
        operationId: 'sendLightMeasurement',
        operation: createOperation({ title: undefined }),
      },
    })

    expect(wrapper.text()).toContain('sendLightMeasurement')
  })

  it('lists the messages referenced directly by the operation', () => {
    const wrapper = mount(OperationSection, {
      props: {
        eventBus: null,
        operationId: 'sendLightMeasurement',
        operation: createOperation({
          messages: [ref({ title: 'Light measured' }), ref({ name: 'turnOn' })] as AsyncApiOperationObject['messages'],
        }),
      },
    })

    expect(wrapper.text()).toContain('Light measured')
    expect(wrapper.text()).toContain('turnOn')
  })

  it('falls back to the channel messages when the operation omits them', () => {
    const wrapper = mount(OperationSection, {
      props: {
        eventBus: null,
        operationId: 'sendLightMeasurement',
        operation: createOperation({
          channel: ref({
            messages: {
              lightMeasured: { title: 'Light measured' },
              turnOn: { name: 'turnOn' },
            },
          }) as AsyncApiOperationObject['channel'],
        }),
      },
    })

    expect(wrapper.text()).toContain('Light measured')
    expect(wrapper.text()).toContain('turnOn')
  })

  it('does not render the messages box when there are no messages', () => {
    const wrapper = mount(OperationSection, {
      props: {
        eventBus: null,
        operationId: 'sendLightMeasurement',
        operation: createOperation({ messages: [] }),
      },
    })

    expect(wrapper.text()).not.toContain('Messages')
  })

  it('shows a Send badge for send operations', () => {
    const wrapper = mount(OperationSection, {
      props: {
        eventBus: null,
        operationId: 'sendLightMeasurement',
        operation: createOperation({ action: 'send' }),
      },
    })

    expect(wrapper.findComponent({ name: 'Badge' }).text()).toBe('Send')
  })

  it('shows a Receive badge for receive operations', () => {
    const wrapper = mount(OperationSection, {
      props: {
        eventBus: null,
        operationId: 'receiveLightMeasurement',
        operation: createOperation({ action: 'receive' }),
      },
    })

    expect(wrapper.findComponent({ name: 'Badge' }).text()).toBe('Receive')
  })

  it('renders the section with a deep-link id derived from the operation id', () => {
    const wrapper = mount(OperationSection, {
      props: {
        eventBus: null,
        operationId: 'sendLightMeasurement',
        operation: createOperation(),
      },
    })

    const section = wrapper.findComponent({ name: 'Section' })
    expect(section.element.id).toBe('operation/sendlightmeasurement')
  })
})
