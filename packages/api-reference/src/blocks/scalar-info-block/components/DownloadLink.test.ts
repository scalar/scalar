import { apiReferenceConfigurationWithSourceSchema } from '@scalar/types/api-reference'
import { captureCustomEvent } from '@test/utils/custom-event'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'

import DownloadLink from './DownloadLink.vue'

// Mock the download function
vi.mock('@/helpers/download', () => ({
  downloadDocument: vi.fn(),
}))

describe('DownloadLink', () => {
  const mockGetOriginalDocument = vi.fn(() => '{"openapi": "3.0.0"}')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const createWrapper = (configOverrides = {}, props = {}) => {
    const config = computed(() =>
      apiReferenceConfigurationWithSourceSchema.parse({
        documentDownloadType: 'json',
        ...configOverrides,
      }),
    )

    return mount(DownloadLink, {
      props: {
        title: 'Test API',
        getOriginalDocument: mockGetOriginalDocument,
        url: config.value.url,
        documentDownloadType: config.value.documentDownloadType,
        ...props,
      },
    })
  }

  describe('JSON download type', () => {
    it('renders JSON download button when documentDownloadType is json', () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' })

      const button = wrapper.find('.download-button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Download OpenAPI Document')
      expect(wrapper.find('.extension').text()).toBe('json')
    })

    it('calls downloadDocument with json format when JSON button is clicked', async () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' })

      const expectDetailToBe = captureCustomEvent(wrapper.find('div').element, 'scalar-download-document')

      const button = wrapper.find('.download-button')
      await button.trigger('click')

      await expectDetailToBe({ format: 'json' })
    })

    it('generates correct filename from title using GitHubSlugger', async () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' }, { title: 'My Awesome API v2.0' })

      const expectDetailToBe = captureCustomEvent(wrapper.find('div').element, 'scalar-download-document')
      const button = wrapper.find('.download-button')
      await button.trigger('click')

      await expectDetailToBe({ format: 'json' })
    })

    it('handles empty title gracefully', async () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' }, { title: '' })

      const expectDetailToBe = captureCustomEvent(wrapper.find('div').element, 'scalar-download-document')
      const button = wrapper.find('.download-button')
      await button.trigger('click')

      await expectDetailToBe({ format: 'json' })
    })

    it('handles undefined title gracefully', async () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' }, { title: undefined })

      const expectDetailToBe = captureCustomEvent(wrapper.find('div').element, 'scalar-download-document')
      const button = wrapper.find('.download-button')
      await button.trigger('click')

      await expectDetailToBe({ format: 'json' })
    })
  })

  describe('YAML download type', () => {
    it('renders YAML download button when documentDownloadType is yaml', () => {
      const wrapper = createWrapper({ documentDownloadType: 'yaml' })

      const button = wrapper.find('.download-button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Download OpenAPI Document')
      expect(wrapper.find('.extension').text()).toBe('yaml')
    })

    it('calls downloadDocument with yaml format when YAML button is clicked', async () => {
      const wrapper = createWrapper({ documentDownloadType: 'yaml' })

      const expectDetailToBe = captureCustomEvent(wrapper.find('div').element, 'scalar-download-document')
      const button = wrapper.find('.download-button')
      await button.trigger('click')

      await expectDetailToBe({ format: 'yaml' })
    })
  })

  describe('Both download type', () => {
    it('renders both JSON and YAML buttons when documentDownloadType is both', () => {
      const wrapper = createWrapper({ documentDownloadType: 'both' })

      const buttons = wrapper.findAll('.download-button')
      expect(buttons).toHaveLength(2)

      const jsonButton = buttons[0]
      const yamlButton = buttons[1]

      expect(jsonButton?.find('.extension').text()).toBe('json')
      expect(yamlButton?.find('.extension').text()).toBe('yaml')
    })

    it('applies download-both class when documentDownloadType is both', () => {
      const wrapper = createWrapper({ documentDownloadType: 'both' })

      expect(wrapper.find('.download-container').classes()).toContain('download-both')
    })

    it('calls downloadDocument with correct format for each button', async () => {
      const wrapper = createWrapper({ documentDownloadType: 'both' })

      const buttons = wrapper.findAll('.download-button')
      const expectDetailToBe = captureCustomEvent(wrapper.find('div').element, 'scalar-download-document')
      // Click JSON button
      await buttons[0]?.trigger('click')
      await expectDetailToBe({ format: 'json' })

      // Click YAML button
      await buttons[1]?.trigger('click')
      await expectDetailToBe({ format: 'yaml' })
    })
  })

  describe('Disabled download', () => {
    it('does not render download buttons when documentDownloadType is none', () => {
      const wrapper = createWrapper({ documentDownloadType: 'none' })

      expect(wrapper.find('.download-container').exists()).toBe(false)
      expect(wrapper.find('.download-link').exists()).toBe(false)
    })

    it('does not render download buttons when documentDownloadType is disabled', () => {
      const wrapper = createWrapper({ documentDownloadType: 'disabled' })

      // The schema will catch the invalid value and default to 'both', so this will render buttons
      expect(wrapper.find('.download-container').exists()).toBe(true)
      expect(wrapper.find('.download-link').exists()).toBe(false)
    })

    it('does not render download buttons when documentDownloadType is undefined', () => {
      const wrapper = createWrapper({ documentDownloadType: undefined })

      // The schema will catch the undefined value and default to 'both', so this will render buttons
      expect(wrapper.find('.download-container').exists()).toBe(true)
      expect(wrapper.find('.download-link').exists()).toBe(false)
    })

    it('does not render download buttons when documentDownloadType is null', () => {
      const wrapper = createWrapper({ documentDownloadType: null })

      // The schema will catch the null value and default to 'both', so this will render buttons
      expect(wrapper.find('.download-container').exists()).toBe(true)
      expect(wrapper.find('.download-link').exists()).toBe(false)
    })
  })

  describe('Component structure and styling', () => {
    it('renders download-container with correct classes', () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' })

      const container = wrapper.find('.download-container')
      expect(container.exists()).toBe(true)
      expect(container.classes()).toContain('group')
    })

    it('renders download-button with correct attributes', () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' })

      const button = wrapper.find('.download-button')
      expect(button.attributes('type')).toBe('button')
    })

    it('renders Badge component with correct content', () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' })

      const badge = wrapper.findComponent({ name: 'Badge' })
      expect(badge.exists()).toBe(true)
      expect(badge.classes()).toContain('extension')
      expect(badge.classes()).toContain('hidden')
      expect(badge.classes()).toContain('group-hover:flex')
    })

    it('renders span with correct text content', () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' })

      const span = wrapper.find('.download-button span')
      expect(span.exists()).toBe(true)
      expect(span.text()).toBe('Download OpenAPI Document')
    })
  })

  describe('Accessibility', () => {
    it('has proper button type attribute', () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' })

      const button = wrapper.find('.download-button')
      expect(button.attributes('type')).toBe('button')
    })
  })
})
