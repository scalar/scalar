import type { HarResponse } from '@scalar/snippetz'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { RequestPayload } from '@scalar/workspace-store/request-example'
import { flushPromises, mount } from '@vue/test-utils'
import { assert, describe, expect, it, vi } from 'vitest'
import { type DefineComponent, defineComponent, markRaw } from 'vue'

import { harToFetchResponse } from '@/v2/blocks/operation-block/helpers/har-to-fetch-response'
import { type ResponseInstance, sendRequest } from '@/v2/blocks/operation-block/helpers/send-request'
import type { ClientLayout } from '@/v2/types/layout'

import ResponseEmpty from './components/ResponseEmpty.vue'
import ResponseMetaInformation from './components/ResponseMetaInformation.vue'
import ResponseBlock from './ResponseBlock.vue'

const getDefaultResponse = (overrides: Partial<ResponseInstance> = {}): ResponseInstance => {
  return {
    ...new Response(),
    status: 200,
    headers: {},
    cookieHeaderKeys: [],
    duration: 0,
    method: 'get' as const,
    path: '/',
    reader: new ReadableStreamDefaultReader(new ReadableStream()),
    ...overrides,
  } as ResponseInstance
}

describe('ResponseBlock', () => {
  const defaultLayout: ClientLayout = 'desktop'
  const defaultProps = {
    response: null,
    requestPayload: null,
    layout: defaultLayout,
    totalPerformedRequests: 0,
    appVersion: '1.0.0',
    plugins: [],
    eventBus: createWorkspaceEventBus(),
  }
  const csvHeaders = {
    'Content-Type': 'text/csv',
    'Content-Disposition': 'attachment; filename="export.csv"',
  }
  const downloadLink = 'a[aria-label="Download Response Body"]'
  const expectZeroByteDownload = async (link: Element, filename: string): Promise<void> => {
    const url = link.getAttribute('href')
    assert(url, 'Expected a URL for the response download')
    expect(link.getAttribute('download')).toBe(filename)
    const response = await fetch(url)
    expect((await response.arrayBuffer()).byteLength).toBe(0)
  }

  it.each([
    ['attachment; filename="export.csv"', 'export.csv'],
    ['Attachment', 'response.csv'],
  ])('offers a zero-byte download for an empty CSV with %s', async (disposition, filename) => {
    const [, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: ['https://example.test/download', { method: 'GET' }],
      customFetch: () =>
        Promise.resolve(new Response('', { headers: { ...csvHeaders, 'Content-Disposition': disposition } })),
    })
    const wrapper = mount(ResponseBlock, { props: { ...defaultProps, response: result?.response ?? null } })
    try {
      await expectZeroByteDownload(wrapper.get(downloadLink).element, filename)
    } finally {
      wrapper.unmount()
    }
  })

  it.each([
    ['GET', 204, '204 No Content'],
    ['GET', 205, '205 Reset Content'],
    ['GET', 304, '304 Not Modified'],
    ['HEAD', 200, '200 OK'],
  ])('hides the download for a bodyless %s response with status %i', async (method, status, statusLabel) => {
    const [, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: ['https://example.test/download', { method }],
      customFetch: () =>
        Promise.resolve(
          new Response(null, { status, headers: { ...csvHeaders, 'Content-Type': 'application/octet-stream' } }),
        ),
    })
    const wrapper = mount(ResponseBlock, { props: { ...defaultProps, response: result?.response ?? null } })
    try {
      expect(wrapper.text()).toContain(statusLabel)
      expect(wrapper.find(downloadLink).exists()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })

  it.each([
    { name: 'a recorded empty attachment', size: 0, text: '', filename: 'export.csv' },
    { name: 'an omitted body', size: -1, text: '', filename: undefined },
    { name: 'a history entry without body text', size: 0, text: undefined, filename: undefined },
  ])('restores the expected Download action for $name', async ({ size, text, filename }) => {
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: Object.entries(csvHeaders).map(([name, value]) => ({ name, value })),
      cookies: [],
      content: { size, mimeType: 'text/csv', text },
      redirectURL: '',
      headersSize: -1,
      bodySize: size,
    }
    const response = harToFetchResponse({ harResponse, method: 'GET', path: '/download' })
    const wrapper = mount(ResponseBlock, { props: { ...defaultProps, response } })
    try {
      if (filename === undefined) {
        expect(wrapper.find(downloadLink).exists()).toBe(false)
        return
      }
      await expectZeroByteDownload(wrapper.get(downloadLink).element, filename)
    } finally {
      wrapper.unmount()
    }
  })

  it.each(['Content-Type', 'content-type'])('formats live records using the %s header', async (header) => {
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        controller.enqueue(new TextEncoder().encode('{"ok":true}\n'))
        controller.close()
      },
    })
    const wrapper = mount(ResponseBlock, {
      props: {
        ...defaultProps,
        response: getDefaultResponse({ headers: { [header]: 'application/jsonl' }, reader: stream.getReader() }),
      },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('{\n  "ok": true\n}')
    wrapper.unmount()
  })

  it.each(['Failed to fetch', 'Load failed', 'NetworkError when attempting to fetch resource.'])(
    'keeps browser failure feedback visible for %s',
    async (message) => {
      vi.useFakeTimers()
      const wrapper = mount(ResponseBlock, {
        props: { ...defaultProps, requestError: new TypeError(message) },
      })
      try {
        await vi.advanceTimersByTimeAsync(4000)
        expect(wrapper.get('[role="alert"]').text()).toContain(message)
        expect(wrapper.text()).toContain('Possible causes include CORS restrictions or a network connection problem.')
        expect(wrapper.findComponent(ResponseEmpty).exists()).toBe(false)
        await wrapper.setProps({ requestError: null })
        expect(wrapper.find('[role="alert"]').exists()).toBe(false)
        expect(wrapper.findComponent(ResponseEmpty).exists()).toBe(true)
      } finally {
        wrapper.unmount()
        vi.useRealTimers()
      }
    },
  )

  it('preserves other errors without suggesting CORS', () => {
    const wrapper = mount(ResponseBlock, {
      props: { ...defaultProps, requestError: new TypeError('Cannot decode response') },
    })
    expect(wrapper.get('[role="alert"]').text()).toContain('Cannot decode response')
    expect(wrapper.text()).not.toContain('CORS')
    wrapper.unmount()
  })

  describe('empty state', () => {
    it('renders ResponseEmpty when no response provided', () => {
      const wrapper = mount(ResponseBlock, {
        props: defaultProps,
      })

      const emptyComponent = wrapper.findComponent(ResponseEmpty)
      expect(emptyComponent.exists()).toBe(true)
    })

    it('passes correct props to ResponseEmpty', () => {
      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          totalPerformedRequests: 5,
          appVersion: '2.0.0',
        },
      })

      const emptyComponent = wrapper.findComponent(ResponseEmpty)
      expect(emptyComponent.props('totalPerformedRequests')).toBe(5)
      expect(emptyComponent.props('appVersion')).toBe('2.0.0')
      expect(emptyComponent.props('layout')).toBe('desktop')
    })

    it('emits addRequest when ResponseEmpty emits it', () => {
      const eventBus = createWorkspaceEventBus()
      const fn = vi.fn()
      eventBus.on('ui:open:command-palette', fn)
      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          eventBus,
        },
      })

      const emptyComponent = wrapper.findComponent(ResponseEmpty)
      emptyComponent.vm.$emit('addRequest')

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith({ action: 'create-request', payload: undefined })
    })

    it('emits sendRequest when ResponseEmpty emits it', () => {
      const eventBus = createWorkspaceEventBus()
      const fn = vi.fn()
      eventBus.on('operation:send:request:hotkey', fn)
      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          eventBus,
        },
      })

      const emptyComponent = wrapper.findComponent(ResponseEmpty)
      emptyComponent.vm.$emit('sendRequest')

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('emits openCommandPalette when ResponseEmpty emits it', () => {
      const eventBus = createWorkspaceEventBus()
      const fn = vi.fn()
      eventBus.on('ui:open:command-palette', fn)
      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          eventBus,
        },
      })

      const emptyComponent = wrapper.findComponent(ResponseEmpty)
      emptyComponent.vm.$emit('openCommandPalette')

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('with response', () => {
    it('renders ResponseMetaInformation when response exists', () => {
      const mockResponse = getDefaultResponse()

      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          response: mockResponse,
        },
      })

      const metaInfo = wrapper.findComponent(ResponseMetaInformation)
      expect(metaInfo.exists()).toBe(true)
    })

    it('does not render ResponseEmpty when response exists', () => {
      const mockResponse = getDefaultResponse()

      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          response: mockResponse,
        },
      })

      const emptyComponent = wrapper.findComponent(ResponseEmpty)
      expect(emptyComponent.exists()).toBe(false)
    })

    it('passes response to ResponseMetaInformation', () => {
      const mockResponse = getDefaultResponse({
        statusText: 'OK',
      })

      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          response: mockResponse,
        },
      })

      const metaInfo = wrapper.findComponent(ResponseMetaInformation)
      expect(metaInfo.props('response')).toEqual(mockResponse)
    })
  })

  describe('title display', () => {
    it('shows "Response" text', () => {
      const wrapper = mount(ResponseBlock, {
        props: defaultProps,
      })

      expect(wrapper.text()).toContain('Response')
    })

    it('applies animation classes when response exists', () => {
      const mockResponse = getDefaultResponse()

      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          response: mockResponse,
        },
      })

      const heading = wrapper.find('.animate-response-heading')
      expect(heading.exists()).toBe(true)
    })

    it('has correct CSS class for response children animation', () => {
      const mockResponse = getDefaultResponse()

      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          response: mockResponse,
        },
      })

      const children = wrapper.find('.animate-response-children')
      expect(children.exists()).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('has aria-label on section', () => {
      const wrapper = mount(ResponseBlock, {
        props: defaultProps,
      })

      const section = wrapper.find('[aria-label="Response"]')
      expect(section.exists()).toBe(true)
    })

    it('has aria-live on response heading', () => {
      const mockResponse = getDefaultResponse()

      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          response: mockResponse,
        },
      })

      const liveRegion = wrapper.find('[aria-live="polite"]')
      expect(liveRegion.exists()).toBe(true)
    })

    it('renders the filter tabs without aria-controls', () => {
      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          response: getDefaultResponse(),
        },
      })

      const tabs = wrapper.findAll('[role="tab"]')
      expect(tabs.length).toBeGreaterThan(0)
      expect(tabs.every((tab) => tab.attributes('aria-controls') === undefined)).toBe(true)
    })
  })

  describe('layout prop', () => {
    it('accepts desktop layout', () => {
      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          layout: 'desktop',
        },
      })

      expect(wrapper.props('layout')).toBe('desktop')
    })

    it('accepts modal layout', () => {
      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          layout: 'modal',
        },
      })

      expect(wrapper.props('layout')).toBe('modal')
    })

    it('accepts web layout', () => {
      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          layout: 'web',
        },
      })

      expect(wrapper.props('layout')).toBe('web')
    })
  })

  describe('filters', () => {
    it('initializes with "All" filter', () => {
      const wrapper = mount(ResponseBlock, {
        props: defaultProps,
      })

      const vm = wrapper.vm
      expect(vm.activeFilter).toBe('All')
    })

    it('generates filters array', () => {
      const wrapper = mount(ResponseBlock, {
        props: defaultProps,
      })

      const vm = wrapper.vm
      expect(vm.filters).toEqual(['All', 'Cookies', 'Headers', 'Body'])
    })
  })

  describe('computed properties', () => {
    it('responseHeaders returns empty array when no response', () => {
      const wrapper = mount(ResponseBlock, {
        props: defaultProps,
      })

      const vm = wrapper.vm
      expect(vm.responseHeaders).toEqual([])
    })

    it('responseHeaders transforms headers object to array', () => {
      const mockResponse = getDefaultResponse({
        headers: {
          'Content-Type': 'application/json',
          'X-Custom': 'value',
        },
      })

      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          response: mockResponse,
        },
      })

      const vm = wrapper.vm
      expect(vm.responseHeaders).toEqual([
        { name: 'Content-Type', value: 'application/json' },
        { name: 'X-Custom', value: 'value' },
      ])
    })

    it('responseCookies returns empty array when no cookieHeaderKeys', () => {
      const mockResponse = getDefaultResponse()

      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          response: mockResponse,
        },
      })

      const vm = wrapper.vm
      expect(vm.responseCookies).toEqual([])
    })

    it('responseCookies parses Set-Cookie header values correctly', () => {
      const mockResponse = {
        ...getDefaultResponse(),
        cookieHeaderKeys: [
          'sessionId=abc123; Path=/; HttpOnly',
          'userId=xyz789; Path=/; Secure',
          'theme=dark; Path=/; SameSite=Strict',
        ],
      }

      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          response: mockResponse,
        },
      })

      const vm = wrapper.vm
      expect(vm.responseCookies).toEqual([
        { name: 'sessionId', value: 'abc123; Path=/; HttpOnly' },
        { name: 'userId', value: 'xyz789; Path=/; Secure' },
        { name: 'theme', value: 'dark; Path=/; SameSite=Strict' },
      ])
    })

    it('responseCookies filters out invalid cookie values', () => {
      const mockResponse = {
        ...getDefaultResponse(),
        cookieHeaderKeys: [
          'validCookie=value; Path=/',
          'invalidcookie', // No equals sign
          '=noname', // No name
          'anotherValid=test; HttpOnly',
        ],
      }

      const wrapper = mount(ResponseBlock, {
        props: {
          ...defaultProps,
          response: mockResponse,
        },
      })

      const vm = wrapper.vm
      expect(vm.responseCookies).toEqual([
        { name: 'validCookie', value: 'value; Path=/' },
        { name: 'anotherValid', value: 'test; HttpOnly' },
      ])
    })

    it('requestHeaders returns empty array when no request', () => {
      const wrapper = mount(ResponseBlock, {
        props: defaultProps,
      })

      const vm = wrapper.vm
      expect(vm.requestHeaders).toEqual([])
    })
  })

  describe('virtualization threshold', () => {
    it('VIRTUALIZATION_THRESHOLD constant is defined', () => {
      const wrapper = mount(ResponseBlock, {
        props: defaultProps,
      })

      const vm = wrapper.vm
      // The threshold should be accessible
      expect(vm.shouldVirtualize).toBeDefined()
    })

    it('shouldVirtualize returns false when no response', () => {
      const wrapper = mount(ResponseBlock, {
        props: defaultProps,
      })

      const vm = wrapper.vm
      expect(vm.shouldVirtualize).toBe(false)
    })
  })

  it('renders plugin component when provided', () => {
    const PluginResponseComponent = markRaw(
      defineComponent({
        template: '<div>Plugin Response Component</div>',
      }) as DefineComponent<{}, {}, {}, {}, {}, {}, {}, Record<string, never>>,
    )

    const wrapper = mount(ResponseBlock, {
      props: {
        ...defaultProps,
        requestPayload: ['https://example.com', { headers: new Headers() }] as RequestPayload,
        response: getDefaultResponse(),
        plugins: [
          {
            components: {
              response: { component: PluginResponseComponent, additionalProps: {} },
            },
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('Plugin Response Component')
  })
})
