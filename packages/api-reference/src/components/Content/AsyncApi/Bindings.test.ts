import { Schema } from '@scalar/blocks/schema'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Bindings from './Bindings.vue'

describe('Bindings', () => {
  it('renders documented schemas while keeping MQTT clientId and protocol settings as values', () => {
    const wrapper = mount(Bindings, {
      props: {
        scope: 'server',
        bindings: {
          mqtt: {
            clientId: 'fleet-gateway',
            keepAlive: 60,
            sessionExpiryInterval: { type: 'integer', minimum: 30, description: 'Session duration in seconds.' },
            lastWill: { topic: 'offline', message: 'disconnected' },
          },
        },
      },
    })
    expect(wrapper.findAllComponents(Schema)).toHaveLength(1)
    expect(wrapper.getComponent(Schema).props('schema')).toMatchObject({
      type: 'object',
      properties: { sessionExpiryInterval: { type: 'integer', minimum: 30 } },
    })
    expect(wrapper.text()).toContain('Session duration in seconds.')
    expect(wrapper.text()).toContain('fleet-gateway')
    expect(wrapper.get('summary').text()).toBe('lastWill')
  })

  it('recognizes schemas in custom fields independently of protocol and scope', () => {
    const schema = { type: 'string', description: 'Consumer identifier.' }
    const wrapper = mount(Bindings, {
      props: {
        scope: 'operation',
        bindings: { kafka: { clientId: schema }, mqtt: { clientId: schema }, custom: { clientId: schema } },
      },
    })
    expect(wrapper.findAllComponents(Schema).length).toBe(3)
    expect(wrapper.find('summary').exists()).toBe(false)
  })

  it('renders legacy WebSocket message properties through the schema renderer', () => {
    const wrapper = mount(Bindings, {
      props: {
        scope: 'message',
        options: { expandAllSchemaProperties: true },
        bindings: {
          ws: {
            bindingVersion: '0.1.0',
            message: {
              $ref: '#/components/schemas/Event',
              '$ref-value': {
                type: 'object',
                properties: {
                  eventId: { type: 'string', description: 'Unique event identifier' },
                  timestamp: { type: 'string', format: 'date-time', description: 'When the event occurred' },
                },
              },
            },
          },
        },
      },
    })
    expect(wrapper.findComponent(Schema).exists()).toBe(true)
    expect(wrapper.text()).toContain('Unique event identifier')
    expect(wrapper.text()).toContain('When the event occurred')
    expect(wrapper.text()).toContain('0.1.0')
    expect(wrapper.find('details').exists()).toBe(false)
  })

  it('renders WebSocket operation header schemas instead of raw JSON', () => {
    const wrapper = mount(Bindings, {
      props: {
        scope: 'operation',
        options: { expandAllSchemaProperties: true },
        bindings: {
          ws: {
            bindingVersion: '0.1.0',
            method: 'GET',
            headers: {
              type: 'object',
              properties: {
                'X-RateLimit-Limit': { type: 'integer', description: 'Maximum requests per minute' },
                'X-RateLimit-Remaining': { type: 'integer', description: 'Remaining requests in current window' },
              },
            },
          },
        },
      },
    })
    expect(wrapper.findComponent(Schema).exists()).toBe(true)
    expect(wrapper.text()).toContain('Maximum requests per minute')
    expect(wrapper.text()).toContain('Remaining requests in current window')
    expect(wrapper.text()).toContain('GET')
    expect(wrapper.find('details').exists()).toBe(false)
  })

  it('renders protocol fields and expandable nested JSON', () => {
    const wrapper = mount(Bindings, {
      props: {
        bindings: {
          kafka: { bindingVersion: '0.5.0', partitions: 3, topicConfiguration: { 'cleanup.policy': ['compact'] } },
        },
      },
    })
    expect(wrapper.text()).toContain('Bindings')
    expect(wrapper.text()).toContain('kafka')
    expect(wrapper.text()).toContain('0.5.0')
    expect(wrapper.text()).toContain('partitions')
    expect(wrapper.get('summary').text()).toBe('topicConfiguration')
    expect(wrapper.text()).toContain('cleanup.policy')
    expect(wrapper.text()).toContain('compact')
  })

  it('applies schema configuration and reacts to option changes', async () => {
    const wrapper = mount(Bindings, {
      props: {
        scope: 'channel',
        bindings: {
          ws: {
            query: { type: 'object', properties: { trace: { type: 'string', description: 'Trace identifier.' } } },
          },
        },
        options: {
          expandAllSchemaProperties: true,
          orderRequiredPropertiesFirst: true,
          orderSchemaPropertiesBy: 'alpha',
          schemaKeyboardNav: true,
        },
      },
    })
    expect(wrapper.getComponent(Schema).props('options')).toStrictEqual({
      hideReadOnly: false,
      expandAllSchemaProperties: true,
      orderRequiredPropertiesFirst: true,
      orderSchemaPropertiesBy: 'alpha',
      schemaKeyboardNav: true,
    })
    expect(wrapper.text()).toContain('Trace identifier.')
    await wrapper.setProps({ options: { orderSchemaPropertiesBy: 'preserve' } })
    expect(wrapper.getComponent(Schema).props('options')).toStrictEqual({
      hideReadOnly: false,
      expandAllSchemaProperties: false,
      orderRequiredPropertiesFirst: false,
      orderSchemaPropertiesBy: 'preserve',
      schemaKeyboardNav: false,
    })
  })

  it('updates details when the binding changes and removes absent bindings', async () => {
    const wrapper = mount(Bindings, { props: { bindings: { kafka: { topic: 'orders' } } } })
    await wrapper.setProps({ bindings: { mqtt: { qos: 0 } } })
    expect(wrapper.text()).not.toContain('orders')
    expect(wrapper.text()).toContain('qos')
    expect(wrapper.text()).toContain('0')
    await wrapper.setProps({ bindings: undefined })
    expect(wrapper.text()).toBe('')
  })
})
