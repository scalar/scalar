import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScalarIconLegacyAdapter from './ScalarIconLegacyAdapter.vue'
import ScalarIcon from './ScalarIcon.vue'
import { ScalarIconPlus } from '@scalar/icons'
import { markRaw } from 'vue'

describe('ScalarIconLegacyAdapter', () => {
  describe('legacy string-based icons', () => {
    it('renders ScalarIcon with label', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add', label: 'Test Icon' },
      })

      const component = wrapper.findComponent(ScalarIcon)
      expect(component.exists()).toBe(true)
      expect(component.attributes('aria-label')).toBe('Test Icon')
    })

    it('renders ScalarIcon with size', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add', size: 'md' },
      })

      const component = wrapper.findComponent(ScalarIcon)
      expect(component.exists()).toBe(true)
      expect(component.attributes('class')).toContain('size-4')
    })

    it('renders ScalarIcon with accessibility attributes with no label', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add' },
      })

      const component = wrapper.findComponent(ScalarIcon)
      expect(component.exists()).toBe(true)
      expect(component.attributes('aria-hidden')).toBe('true')
      expect(component.attributes('role')).toBe('presentation')
    })

    it('renders ScalarIcon with default size when no size is provided', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add' },
      })

      const component = wrapper.findComponent(ScalarIcon)
      expect(component.exists()).toBe(true)
      expect(component.attributes('class')).toContain('size-full')
    })

    it('merges external classes with internal classes', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add', size: 'md' },
        attrs: { class: 'external-class' },
      })

      const component = wrapper.findComponent(ScalarIcon)
      expect(component.attributes('class')).toContain('size-4')
      expect(component.attributes('class')).toContain('external-class')
    })

    it('handles class conflicts by preferring external classes', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add', size: 'md' },
        attrs: { class: 'size-8' },
      })

      const component = wrapper.findComponent(ScalarIcon)
      expect(component.attributes('class')).toContain('size-8')
      expect(component.attributes('class')).not.toContain('size-4')
    })

    it('passes through class prop to ScalarIcon', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add', class: 'custom-class' },
      })

      const component = wrapper.findComponent(ScalarIcon)
      expect(component.attributes('class')).toContain('custom-class')
    })

    it('passes through data attributes to ScalarIcon', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add', 'data-test': 'test-data-attribute' },
      })

      const component = wrapper.findComponent(ScalarIcon)
      expect(component.attributes('data-test')).toBe('test-data-attribute')
    })
  })

  describe('component-based icons', () => {
    it('renders component with label', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: markRaw(ScalarIconPlus), label: 'Test Component Icon' },
      })

      const component = wrapper.findComponent(ScalarIconPlus)
      expect(component.exists()).toBe(true)
      expect(component.attributes('aria-label')).toBe('Test Component Icon')
    })

    it('renders component with size', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: markRaw(ScalarIconPlus), size: 'md' },
      })

      const component = wrapper.findComponent(ScalarIconPlus)
      expect(component.exists()).toBe(true)
      expect(component.attributes('class')).toContain('size-4')
    })

    it('renders component with accessibility attributes when no label', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: markRaw(ScalarIconPlus) },
      })

      const component = wrapper.findComponent(ScalarIconPlus)
      expect(component.exists()).toBe(true)
      expect(component.attributes('aria-hidden')).toBe('true')
      expect(component.attributes('role')).toBe('presentation')
    })

    it('renders component with default size when no size is provided', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: markRaw(ScalarIconPlus) },
      })

      const component = wrapper.findComponent(ScalarIconPlus)
      expect(component.exists()).toBe(true)
      expect(component.attributes('class')).toContain('size-full')
    })

    it('merges external classes with internal classes', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: markRaw(ScalarIconPlus), size: 'md' },
        attrs: { class: 'external-class' },
      })

      const component = wrapper.findComponent(ScalarIconPlus)
      expect(component.attributes('class')).toContain('size-4')
      expect(component.attributes('class')).toContain('external-class')
    })

    it('handles class conflicts by preferring external classes', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: markRaw(ScalarIconPlus), size: 'md' },
        attrs: { class: 'size-8' },
      })

      const component = wrapper.findComponent(ScalarIconPlus)
      expect(component.attributes('class')).toContain('size-8')
      expect(component.attributes('class')).not.toContain('size-4')
    })

    it('passes through class prop to component', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: markRaw(ScalarIconPlus), class: 'custom-class' },
      })

      const component = wrapper.findComponent(ScalarIconPlus)
      expect(component.attributes('class')).toContain('custom-class')
    })

    it('passes through data attributes to component', () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: markRaw(ScalarIconPlus), 'data-test': 'test-data-attribute' },
      })

      const component = wrapper.findComponent(ScalarIconPlus)
      expect(component.attributes('data-test')).toBe('test-data-attribute')
    })
  })
})
