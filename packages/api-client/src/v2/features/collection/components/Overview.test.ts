import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { xScalarEnvironmentSchema } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { OpenAPIDocumentSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { mockEventBus } from '@/v2/helpers/test-utils'

import Overview from './Overview.vue'

describe('Overview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseEnvironment = coerceValue(xScalarEnvironmentSchema, {
    color: '#FFFFFF',
    variables: [
      { name: 'API_URL', value: 'https://api.example.com' },
      { name: 'API_KEY', value: 'test-key-123' },
    ],
  })

  const mountWithProps = (
    custom: Partial<{
      description: string
    }> = {},
  ) => {
    const description = 'description' in custom ? custom.description : 'Test description'

    const document = coerceValue(OpenAPIDocumentSchema, {
      info: {
        title: 'Test API',
        description,
      },
    })

    return mount(Overview, {
      props: {
        document,
        eventBus: mockEventBus,
        layout: 'desktop',
        environment: baseEnvironment,
        collectionType: 'document' as const,
        workspaceStore: createWorkspaceStore(),
      },
    })
  }

  describe('rendering', () => {
    it('renders the component', () => {
      const wrapper = mountWithProps()

      expect(wrapper.exists()).toBe(true)
    })

    it('renders the title "Description"', () => {
      const wrapper = mountWithProps()

      expect(wrapper.text()).toContain('Description')
    })

    it('renders the description content in preview mode', () => {
      const description = '# API Documentation\n\nThis is a test API.'
      const wrapper = mountWithProps({ description })

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.exists()).toBe(true)
      expect(markdown.props('value')).toBe(description)
    })

    it('renders "Write a description" button when description is empty', () => {
      const wrapper = mountWithProps({ description: '' })

      expect(wrapper.text()).toContain('Write a description')
    })

    it('renders "Write a description" button when description is only whitespace', () => {
      const wrapper = mountWithProps({ description: '   ' })

      expect(wrapper.text()).toContain('Write a description')
    })

    it('renders the Edit button in preview mode', () => {
      const wrapper = mountWithProps()

      const editButton = wrapper.find('[type="button"]')
      expect(editButton.exists()).toBe(true)
      expect(editButton.text()).toContain('Edit')
    })
  })

  describe('mode switching', () => {
    it('switches to edit mode when Edit button is clicked', async () => {
      const wrapper = mountWithProps()

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.exists()).toBe(true)
    })

    it('switches to edit mode when "Write a description" is clicked', async () => {
      const wrapper = mountWithProps({ description: '' })

      const writeButton = wrapper.find('button')
      await writeButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.exists()).toBe(true)
    })

    it('switches to preview mode when CodeInput loses focus', async () => {
      const wrapper = mountWithProps()

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('blur')
      await nextTick()

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.exists()).toBe(true)
    })

    it('does not show Edit button in edit mode', async () => {
      const wrapper = mountWithProps()

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const buttons = wrapper.findAll('button').filter((btn) => btn.text().includes('Edit'))
      expect(buttons.length).toBe(0)
    })
  })

  describe('CodeInput props in edit mode', () => {
    it('passes description to CodeInput as modelValue', async () => {
      const description = 'Test API description'
      const wrapper = mountWithProps({ description })

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.props('modelValue')).toBe(description)
    })

    it('passes undefined as environment to CodeInput', async () => {
      const wrapper = mountWithProps()

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.props('environment')).toBeUndefined()
    })

    it('passes layout to CodeInput', async () => {
      const wrapper = mountWithProps()

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.props('layout')).toBe('desktop')
    })
  })

  describe('event emission', () => {
    it('emits document:update:info on eventBus when CodeInput value changes', async () => {
      const wrapper = mountWithProps()

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      const newDescription = 'Updated description'
      await codeInput.vm.$emit('update:modelValue', newDescription)
      await nextTick()

      expect(mockEventBus.emit).toHaveBeenCalledWith('document:update:info', { description: newDescription })
    })

    it('emits event with empty string', async () => {
      const wrapper = mountWithProps()

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('update:modelValue', '')
      await nextTick()

      expect(mockEventBus.emit).toHaveBeenCalledWith('document:update:info', { description: '' })
    })
  })

  describe('ScalarMarkdown props', () => {
    it('passes withImages prop to ScalarMarkdown', () => {
      const wrapper = mountWithProps()

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('withImages')).toBe(true)
    })

    it('switches to edit mode on markdown double click', async () => {
      const wrapper = mountWithProps()

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      await markdown.vm.$emit('dblclick')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.exists()).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles very long description', () => {
      const longDescription = 'A'.repeat(10000)
      const wrapper = mountWithProps({ description: longDescription })

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('value')).toBe(longDescription)
    })

    it('handles description with special characters', () => {
      const specialDescription = '# Test\n\n**Bold** & _italic_ & `code` & [link](https://example.com)'
      const wrapper = mountWithProps({ description: specialDescription })

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('value')).toBe(specialDescription)
    })

    it('handles markdown with line breaks', () => {
      const descriptionWithBreaks = 'Line 1\n\nLine 2\n\nLine 3'
      const wrapper = mountWithProps({ description: descriptionWithBreaks })

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('value')).toBe(descriptionWithBreaks)
    })
  })
})
