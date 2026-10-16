import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Bindings from './Bindings.vue'

describe('Bindings', () => {
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
