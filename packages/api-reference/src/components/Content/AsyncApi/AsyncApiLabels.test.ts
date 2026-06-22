import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AsyncApiLabels from './AsyncApiLabels.vue'

describe('AsyncApiLabels', () => {
  it('renders nothing when there are no labels', () => {
    const wrapper = mount(AsyncApiLabels, { props: {} })

    expect(wrapper.find('.async-api-labels').exists()).toBe(false)
  })

  it('renders a pill per server and per protocol with screen-reader prefixes', () => {
    const wrapper = mount(AsyncApiLabels, {
      props: { servers: ['production', 'development'], protocols: ['wss', 'ws'] },
    })

    expect(wrapper.findAll('.async-api-label--server').map((el) => el.text())).toEqual(['production', 'development'])
    expect(wrapper.findAll('.async-api-label--protocol').map((el) => el.text())).toEqual(['wss', 'ws'])
    expect(wrapper.text()).toContain('Servers:')
    expect(wrapper.text()).toContain('Protocols:')
  })

  it('omits the server row when only protocols are provided', () => {
    const wrapper = mount(AsyncApiLabels, { props: { protocols: ['kafka'] } })

    expect(wrapper.findAll('.async-api-label--server')).toHaveLength(0)
    expect(wrapper.findAll('.async-api-label--protocol')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('Servers:')
  })
})
