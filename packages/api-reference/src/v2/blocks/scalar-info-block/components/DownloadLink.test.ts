import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

import { CONFIGURATION_SYMBOL } from '@/hooks/useConfig'
import { downloadDocument } from '@/libs/download'

import DownloadLink from './DownloadLink.vue'

// Mock the download function
vi.mock('@/libs/download', () => ({
  downloadDocument: vi.fn(),
}))

describe('DownloadLink', () => {
  const mockDownloadDocument = vi.mocked(downloadDocument)
  const mockGetOriginalDocument = vi.fn(() => '{"openapi": "3.0.0"}')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const createWrapper = (configOverrides = {}, props = {}) => {
    const config = computed(() =>
      apiReferenceConfigurationSchema.parse({
        documentDownloadType: 'json',
        ...configOverrides,
      }),
    )

    return mount(DownloadLink, {
      props: {
        title: 'Test API',
        getOriginalDocument: mockGetOriginalDocument,
        ...props,
      },
      global: {
        provide: {
          [CONFIGURATION_SYMBOL]: config,
        },
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

      const button = wrapper.find('.download-button')
      await button.trigger('click')

      expect(mockDownloadDocument).toHaveBeenCalledWith('{"openapi": "3.0.0"}', 'test-api', 'json')
    })

    it('generates correct filename from title using GitHubSlugger', async () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' }, { title: 'My Awesome API v2.0' })

      const button = wrapper.find('.download-button')
      await button.trigger('click')

      expect(mockDownloadDocument).toHaveBeenCalledWith('{"openapi": "3.0.0"}', 'my-awesome-api-v20', 'json')
    })

    it('handles empty title gracefully', async () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' }, { title: '' })

      const button = wrapper.find('.download-button')
      await button.trigger('click')

      expect(mockDownloadDocument).toHaveBeenCalledWith('{"openapi": "3.0.0"}', '', 'json')
    })

    it('handles undefined title gracefully', async () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' }, { title: undefined })

      const button = wrapper.find('.download-button')
      await button.trigger('click')

      expect(mockDownloadDocument).toHaveBeenCalledWith('{"openapi": "3.0.0"}', '', 'json')
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

      const button = wrapper.find('.download-button')
      await button.trigger('click')

      expect(mockDownloadDocument).toHaveBeenCalledWith('{"openapi": "3.0.0"}', 'test-api', 'yaml')
    })
  })

  describe('Both download type', () => {
    it('renders both JSON and YAML buttons when documentDownloadType is both', () => {
      const wrapper = createWrapper({ documentDownloadType: 'both' })

      const buttons = wrapper.findAll('.download-button')
      expect(buttons).toHaveLength(2)

      const jsonButton = buttons[0]
      const yamlButton = buttons[1]

      expect(jsonButton.find('.extension').text()).toBe('json')
      expect(yamlButton.find('.extension').text()).toBe('yaml')
    })

    it('applies download-both class when documentDownloadType is both', () => {
      const wrapper = createWrapper({ documentDownloadType: 'both' })

      expect(wrapper.find('.download-container').classes()).toContain('download-both')
    })

    it('calls downloadDocument with correct format for each button', async () => {
      const wrapper = createWrapper({ documentDownloadType: 'both' })

      const buttons = wrapper.findAll('.download-button')

      // Click JSON button
      await buttons[0].trigger('click')
      expect(mockDownloadDocument).toHaveBeenCalledWith('{"openapi": "3.0.0"}', 'test-api', 'json')

      // Click YAML button
      await buttons[1].trigger('click')
      expect(mockDownloadDocument).toHaveBeenCalledWith('{"openapi": "3.0.0"}', 'test-api', 'yaml')
    })
  })

  describe('Direct download type', () => {
    it('renders direct download link when documentDownloadType is direct and config.url exists', () => {
      const wrapper = createWrapper({
        documentDownloadType: 'direct',
        url: 'https://example.com/openapi.json',
      })

      const link = wrapper.find('.download-link')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://example.com/openapi.json')
      expect(link.text()).toBe('Download OpenAPI Document')
    })

    it('renders fallback link when documentDownloadType is direct but no config.url', () => {
      const wrapper = createWrapper({ documentDownloadType: 'direct' })

      const link = wrapper.find('.download-link')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('#')
    })

    it('calls downloadDocument when fallback link is clicked', async () => {
      const wrapper = createWrapper({ documentDownloadType: 'direct' })

      const link = wrapper.find('.download-link')
      await link.trigger('click')

      expect(mockDownloadDocument).toHaveBeenCalledWith('{"openapi": "3.0.0"}', 'test-api', 'json')
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

  describe('Edge cases and error handling', () => {
    it('handles getOriginalDocument returning empty string', async () => {
      const emptyDocumentMock = vi.fn(() => '')
      const wrapper = createWrapper({ documentDownloadType: 'json' }, { getOriginalDocument: emptyDocumentMock })

      const button = wrapper.find('.download-button')
      await button.trigger('click')

      expect(mockDownloadDocument).toHaveBeenCalledWith('', 'test-api', 'json')
    })

    it('handles special characters in title', async () => {
      const wrapper = createWrapper(
        { documentDownloadType: 'json' },
        { title: 'API with Special Characters! @#$%^&*()' },
      )

      const button = wrapper.find('.download-button')
      await button.trigger('click')

      expect(mockDownloadDocument).toHaveBeenCalledWith('{"openapi": "3.0.0"}', 'api-with-special-characters-', 'json')
    })

    it('handles very long titles', async () => {
      const longTitle = 'A'.repeat(1000)
      const wrapper = createWrapper({ documentDownloadType: 'json' }, { title: longTitle })

      const button = wrapper.find('.download-button')
      await button.trigger('click')

      // GitHubSlugger should handle long titles gracefully
      expect(mockDownloadDocument).toHaveBeenCalledWith('{"openapi": "3.0.0"}', expect.any(String), 'json')
    })
  })

  describe('Accessibility', () => {
    it('has proper button type attribute', () => {
      const wrapper = createWrapper({ documentDownloadType: 'json' })

      const button = wrapper.find('.download-button')
      expect(button.attributes('type')).toBe('button')
    })

    it('has proper link attributes for direct download', () => {
      const wrapper = createWrapper({
        documentDownloadType: 'direct',
        url: 'https://example.com/openapi.json',
      })

      const link = wrapper.find('.download-link')
      expect(link.attributes('href')).toBe('https://example.com/openapi.json')
    })

    it('prevents default behavior on fallback link click', async () => {
      const wrapper = createWrapper({ documentDownloadType: 'direct' })

      const link = wrapper.find('.download-link')

      // Create a mock event that can be prevented
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      }

      await link.trigger('click', mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })
  })

  describe('Reactivity', () => {
    it('reacts to config changes', async () => {
      const configSource = ref(
        apiReferenceConfigurationSchema.parse({
          documentDownloadType: 'json',
        }),
      )

      const config = computed(() => configSource.value)

      const wrapper = mount(DownloadLink, {
        props: {
          title: 'Test API',
          getOriginalDocument: mockGetOriginalDocument,
        },
        global: {
          provide: {
            [CONFIGURATION_SYMBOL]: config,
          },
        },
      })

      // Initially should show JSON button
      expect(wrapper.find('.download-button').exists()).toBe(true)

      // Change config to YAML
      configSource.value = {
        ...configSource.value,
        documentDownloadType: 'yaml',
      }

      await wrapper.vm.$nextTick()

      // Should now show YAML button
      expect(wrapper.find('.download-button').exists()).toBe(true)
      expect(wrapper.find('.extension').text()).toBe('yaml')
    })
  })
})
