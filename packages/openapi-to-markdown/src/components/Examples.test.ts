// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Examples from './Examples.vue'

describe('Examples', () => {
  it('renders literal XML without turning its characters into element names', () => {
    const xml = '<Pet id="42"><name>A &amp; B</name></Pet>'
    const wrapper = mount(Examples, { props: { source: { example: xml }, mediaType: 'application/xml' } })
    expect(wrapper.get('pre').text()).toBe(xml)
  })

  it('renders named examples in order and exposes external values as links', () => {
    const wrapper = mount(Examples, {
      props: {
        source: {
          examples: {
            first: { value: { id: 42 }, summary: 'First pet' },
            second: { value: null },
            remote: { externalValue: 'https://example.com/pet.json' },
          },
        },
      },
    })
    expect(wrapper.findAll('pre').map((block) => JSON.parse(block.text()))).toStrictEqual([{ id: 42 }, null])
    expect(wrapper.text()).toContain('First pet')
    expect(wrapper.get('a').attributes('href')).toBe('https://example.com/pet.json')
  })

  it('does not leave an empty example label without a schema or example', () => {
    expect(mount(Examples, { props: { source: {} } }).text()).toBe('')
  })
})
