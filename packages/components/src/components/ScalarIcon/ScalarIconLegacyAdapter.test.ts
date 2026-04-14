import { ScalarIconPlus } from '@scalar/icons'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { markRaw, nextTick } from 'vue'

import ScalarIcon from './ScalarIcon.vue'
import ScalarIconLegacyAdapter from './ScalarIconLegacyAdapter.vue'

describe('ScalarIconLegacyAdapter', () => {
  describe('legacy string-based icons', () => {
    it('renders ScalarIcon with label', async () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add', label: 'Test Icon' },
      })
      await flushPromises()
      await nextTick()

      const component = wrapper.findComponent(ScalarIcon)
      expect(component.exists()).toBe(true)
      expect(component.props('label')).toBe('Test Icon')
    })

    it('renders ScalarIcon with size', async () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add', size: 'md' },
      })
      await flushPromises()
      await nextTick()

      const component = wrapper.findComponent(ScalarIcon)
      expect(component.exists()).toBe(true)
      expect(component.props('size')).toBe('md')
    })

    it('renders ScalarIcon with accessibility attributes with no label', async () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add' },
      })
      await flushPromises()
      await nextTick()

      const component = wrapper.findComponent(ScalarIcon)
      expect(component.exists()).toBe(true)
      expect(component.props('label')).toBeUndefined()
    })

    it('renders ScalarIcon with default size when no size is provided', async () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add' },
      })
      await flushPromises()
      await nextTick()

      const component = wrapper.findComponent(ScalarIcon)
      expect(component.exists()).toBe(true)
      expect(component.props('size')).toBeUndefined()
    })

    it('merges external classes with internal classes', async () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add', size: 'md' },
        attrs: { class: 'external-class' },
      })
      await flushPromises()
      await nextTick()

      const component = wrapper.findComponent(ScalarIcon)
      expect((component.vm.$attrs as Record<string, string>).class).toContain('external-class')
    })

    it('handles class conflicts by preferring external classes', async () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add', size: 'md' },
        attrs: { class: 'size-8' },
      })
      await flushPromises()
      await nextTick()

      const component = wrapper.findComponent(ScalarIcon)
      expect((component.vm.$attrs as Record<string, string>).class).toContain('size-8')
    })

    it('passes through class prop to ScalarIcon', async () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add', class: 'custom-class' },
      })
      await flushPromises()
      await nextTick()

      const component = wrapper.findComponent(ScalarIcon)
      expect((component.vm.$attrs as Record<string, string>).class).toContain('custom-class')
    })

    it('passes through data attributes to ScalarIcon', async () => {
      const wrapper = mount(ScalarIconLegacyAdapter, {
        props: { icon: 'Add', 'data-test': 'test-data-attribute' },
      })
      await flushPromises()
      await nextTick()

      const component = wrapper.findComponent(ScalarIcon)
      expect((component.vm.$attrs as Record<string, string>)['data-test']).toBe('test-data-attribute')
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
