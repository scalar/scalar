import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ResponseBody from './ResponseBody.vue'
import ResponseBodyRaw from './ResponseBodyRaw.vue'

describe('ResponseBody', () => {
  it.each([
    'application/vnd.com.company.model+xml',
    'application/vnd.com.company.model+xml; charset=utf-8',
    'APPLICATION/VND.COM.COMPANY.MODEL+XML',
  ])('renders %s as XML text with an XML download', (contentType) => {
    const xml = '<person><name>Ada</name></person>'
    const wrapper = mount(ResponseBody, {
      props: {
        title: 'Body',
        layout: 'reference',
        data: xml,
        headers: [{ name: 'Content-Type', value: contentType }],
      },
    })

    expect(wrapper.text()).not.toContain('Binary file')
    expect(wrapper.getComponent(ResponseBodyRaw).props('content')).toBe(xml)
    expect(wrapper.getComponent(ResponseBodyRaw).props('language')).toBe('xml')
    expect(wrapper.get('a[download]').attributes('download')).toBe('response.xml')
    wrapper.unmount()
  })
})
