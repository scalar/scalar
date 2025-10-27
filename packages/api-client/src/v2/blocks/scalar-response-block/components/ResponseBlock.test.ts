// @vitest-environment jsdom

import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import type { ClientLayout } from '@/hooks'
import { createStoreEvents } from '@/store/events'

import ResponseBlock from './ResponseBlock.vue'
import ResponseEmpty from './ResponseEmpty.vue'
import ResponseMetaInformation from './ResponseMetaInformation.vue'

// Mock the plugin manager
vi.mock('@/plugins', () => ({
  usePluginManager: vi.fn(() => ({
    getViewComponents: vi.fn(() => []),
  })),
}))

const events = createStoreEvents()

const getDefaultResponse = (overrides: Partial<ResponseInstance> = {}) => {
  return {
    ...new Response(),
    status: 200,
    headers: {},
    cookieHeaderKeys: [],
    duration: 0,
    method: 'get',
    path: '/',
    reader: new ReadableStreamDefaultReader(new ReadableStream()),
    ...overrides,
  } as ResponseInstance
}

describe('ResponseBlock', () => {
  const defaultLayout: ClientLayout = 'desktop'
  const defaultProps = {
    layout: defaultLayout,
    totalPerformedRequests: 0,
    appVersion: '1.0.0',
    events: events,
  }

  beforeEach(() => {
    vi.clearAllMocks()
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

    it('emits addRequest when ResponseEmpty emits it', async () => {
      const wrapper = mount(ResponseBlock, {
        props: defaultProps,
      })

      const emptyComponent = wrapper.findComponent(ResponseEmpty)
      emptyComponent.vm.$emit('addRequest')

      expect(wrapper.emitted('addRequest')).toBeTruthy()
    })

    it('emits sendRequest when ResponseEmpty emits it', async () => {
      const wrapper = mount(ResponseBlock, {
        props: defaultProps,
      })

      const emptyComponent = wrapper.findComponent(ResponseEmpty)
      emptyComponent.vm.$emit('sendRequest')

      expect(wrapper.emitted('sendRequest')).toBeTruthy()
    })

    it('emits openCommandPalette when ResponseEmpty emits it', async () => {
      const wrapper = mount(ResponseBlock, {
        props: defaultProps,
      })

      const emptyComponent = wrapper.findComponent(ResponseEmpty)
      emptyComponent.vm.$emit('openCommandPalette')

      expect(wrapper.emitted('openCommandPalette')).toBeTruthy()
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
    const PluginResponseComponent = defineComponent<{
      request?: Request
      response?: ResponseInstance
    }>({
      template: '<div>Plugin Response Component</div>',
    })

    const wrapper = mount(ResponseBlock, {
      props: {
        ...defaultProps,
        plugins: [
          {
            components: {
              response: PluginResponseComponent,
            },
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('Plugin Response Component')
  })
})
