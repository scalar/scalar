import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import Overview from './Overview.vue'

// Mock ResizeObserver
window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

describe('Overview', () => {
  const baseEnvironment = {
    uid: 'env-1',
    name: 'Default',
    color: '#FFFFFF',
    value: '',
    isDefault: true,
  }

  const baseEnvVariables = [
    { key: 'API_URL', value: 'https://api.example.com' },
    { key: 'API_KEY', value: 'test-key-123' },
  ]

  const mountWithProps = (
    custom: Partial<{
      description: string
      environment: any
      envVariables: any[]
    }> = {},
  ) => {
    const description = 'description' in custom ? custom.description : 'Test description'
    const environment = custom.environment ?? baseEnvironment
    const envVariables = custom.envVariables ?? baseEnvVariables

    return mount(Overview, {
      props: {
        description: description ?? 'default description',
        environment,
        envVariables,
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

    it('renders in preview mode by default', () => {
      const wrapper = mountWithProps()

      const editButton = wrapper.find('[type="button"]')
      expect(editButton.text()).toContain('Edit')
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

    it('passes environment to CodeInput', async () => {
      const customEnvironment = {
        uid: 'custom-env',
        name: 'Custom',
        color: '#FF0000',
        value: 'custom',
        isDefault: false,
      }
      const wrapper = mountWithProps({ environment: customEnvironment })

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.props('environment')).toEqual(customEnvironment)
    })

    it('passes envVariables to CodeInput', async () => {
      const customEnvVariables = [
        { key: 'BASE_URL', value: 'https://test.com' },
        { key: 'TOKEN', value: 'token-xyz' },
      ]
      const wrapper = mountWithProps({ envVariables: customEnvVariables })

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.props('envVariables')).toEqual(customEnvVariables)
    })

    it('passes empty envVariables array to CodeInput', async () => {
      const wrapper = mountWithProps({ envVariables: [] })

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.props('envVariables')).toEqual([])
    })
  })

  describe('event emission', () => {
    it('emits overview:update:description when CodeInput value changes', async () => {
      const wrapper = mountWithProps()

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      const newDescription = 'Updated description'
      await codeInput.vm.$emit('update:modelValue', newDescription)
      await nextTick()

      expect(wrapper.emitted('overview:update:description')).toBeTruthy()
      expect(wrapper.emitted('overview:update:description')?.[0]).toEqual([newDescription])
    })

    it('emits multiple update events when description changes multiple times', async () => {
      const wrapper = mountWithProps()

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })

      await codeInput.vm.$emit('update:modelValue', 'First update')
      await nextTick()
      await codeInput.vm.$emit('update:modelValue', 'Second update')
      await nextTick()
      await codeInput.vm.$emit('update:modelValue', 'Third update')
      await nextTick()

      expect(wrapper.emitted('overview:update:description')).toHaveLength(3)
      expect(wrapper.emitted('overview:update:description')?.[0]).toEqual(['First update'])
      expect(wrapper.emitted('overview:update:description')?.[1]).toEqual(['Second update'])
      expect(wrapper.emitted('overview:update:description')?.[2]).toEqual(['Third update'])
    })

    it('emits event with empty string', async () => {
      const wrapper = mountWithProps()

      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('update:modelValue', '')
      await nextTick()

      expect(wrapper.emitted('overview:update:description')).toBeTruthy()
      expect(wrapper.emitted('overview:update:description')?.[0]).toEqual([''])
    })
  })

  describe('ScalarMarkdown props', () => {
    it('passes withImages prop to ScalarMarkdown', () => {
      const wrapper = mountWithProps()

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('withImages')).toBe(true)
    })

    it('renders different description content', () => {
      const customDescription = '## Custom Title\n\nCustom content here.'
      const wrapper = mountWithProps({ description: customDescription })

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('value')).toBe(customDescription)
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

    it('handles switching modes multiple times', async () => {
      const wrapper = mountWithProps()

      // Switch to edit
      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()
      expect(wrapper.findComponent({ name: 'CodeInput' }).exists()).toBe(true)

      // Switch to preview
      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      await codeInput.vm.$emit('blur')
      await nextTick()
      expect(wrapper.findComponent({ name: 'ScalarMarkdown' }).exists()).toBe(true)

      // Switch to edit again
      const editButtonAgain = wrapper.find('button')
      await editButtonAgain.trigger('click')
      await nextTick()
      expect(wrapper.findComponent({ name: 'CodeInput' }).exists()).toBe(true)

      // Switch to preview again
      const codeInputAgain = wrapper.findComponent({ name: 'CodeInput' })
      await codeInputAgain.vm.$emit('blur')
      await nextTick()
      expect(wrapper.findComponent({ name: 'ScalarMarkdown' }).exists()).toBe(true)
    })

    it('preserves description when switching between modes', async () => {
      const description = 'Original description'
      const wrapper = mountWithProps({ description })

      // Verify preview mode shows description
      let markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('value')).toBe(description)

      // Switch to edit mode
      const editButton = wrapper.find('button')
      await editButton.trigger('click')
      await nextTick()

      // Verify edit mode has description
      const codeInput = wrapper.findComponent({ name: 'CodeInput' })
      expect(codeInput.props('modelValue')).toBe(description)

      // Switch back to preview
      await codeInput.vm.$emit('blur')
      await nextTick()

      // Verify preview mode still shows description
      markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('value')).toBe(description)
    })

    it('handles markdown with line breaks', () => {
      const descriptionWithBreaks = 'Line 1\n\nLine 2\n\nLine 3'
      const wrapper = mountWithProps({ description: descriptionWithBreaks })

      const markdown = wrapper.findComponent({ name: 'ScalarMarkdown' })
      expect(markdown.props('value')).toBe(descriptionWithBreaks)
    })
  })
})
