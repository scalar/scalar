import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ResponseBodyVirtual from './ResponseBodyVirtual.vue'

// Mock URL
global.URL.createObjectURL = vi.fn(() => 'mocked-url')

describe('ResponseBodyVirtual', () => {
  it('displays the download link button when dataUrl is present', () => {
    const mockResponseInstance = {
      data: 'data:application/json;base64,eyJrZXkiOiAidmFsdWUifQ==',
      headers: [{ name: 'Content-Type', value: 'application/json', required: true }],
    }

    const wrapper = mount(ResponseBodyVirtual, {
      props: {
        content: '{"key": "value"}',
        headers: mockResponseInstance.headers,
        data: mockResponseInstance.data,
      },
    })

    console.log(wrapper.vm)

    const downloadButton = wrapper.findComponent({
      name: 'ResponseBodyDownload',
    })

    expect(downloadButton.exists()).toBe(true)
    expect(downloadButton.props('href')).toBe('mocked-url')
  })
})
