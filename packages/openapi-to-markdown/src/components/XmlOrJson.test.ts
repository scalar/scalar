// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import XmlOrJson from './XmlOrJson.vue'

const schema = { type: 'object', xml: { name: 'person' }, properties: { id: { example: 7, xml: { attribute: true } } } }

describe('XmlOrJson', () => {
  it('renders schema-aware XML', () => {
    const wrapper = mount(XmlOrJson, { props: { xml: true, schema } })
    expect(wrapper.find('code').text()).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<person id="7"/>')
  })
  it('uses supplied data examples without generating extra properties', () => {
    const wrapper = mount(XmlOrJson, { props: { xml: true, schema, example: { dataValue: { id: 0 } } } })
    expect(wrapper.find('code').text()).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<person id="0"/>')
  })
  it('preserves serialized XML without JSON quoting', () => {
    const wrapper = mount(XmlOrJson, { props: { xml: true, schema, example: { serializedValue: '<custom />' } } })
    expect(wrapper.find('code').text()).toBe('<custom />')
  })
  it('keeps JSON output unchanged', () => {
    const wrapper = mount(XmlOrJson, { props: { modelValue: { id: 7 } } })
    expect(wrapper.find('code').text()).toBe('{\n  "id": 7\n}')
  })
})
