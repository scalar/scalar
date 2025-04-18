import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useScalarIcon } from './useScalarIcon'
import type { ScalarIconProps } from '@/types'

describe('useScalarIcon', () => {
  // Create a test component that uses the hook
  const TestComponent = defineComponent({
    props: {
      label: String,
      weight: String,
    } as unknown as { [K in keyof ScalarIconProps]: any },
    setup(props) {
      const { bind, weight } = useScalarIcon(props)
      return { bind, weight }
    },
    template: '<div v-bind="bind">{{ weight }}</div>',
  })

  it('returns default dimensions of 1em', () => {
    const wrapper = mount(TestComponent)
    expect(wrapper.attributes('width')).toBe('1em')
    expect(wrapper.attributes('height')).toBe('1em')
  })

  it('returns default weight of regular', () => {
    const wrapper = mount(TestComponent)
    expect(wrapper.text()).toBe('regular')
  })

  it('uses provided weight when specified', () => {
    const wrapper = mount(TestComponent, {
      props: {
        weight: 'bold',
      },
    })
    expect(wrapper.text()).toBe('bold')
  })

  describe('accessibility attributes', () => {
    it('sets aria-hidden and role when no label is provided', () => {
      const wrapper = mount(TestComponent)
      expect(wrapper.attributes('aria-hidden')).toBe('true')
      expect(wrapper.attributes('role')).toBe('presentation')
    })

    it('sets aria-label when label is provided', () => {
      const wrapper = mount(TestComponent, {
        props: {
          label: 'Test Icon',
        },
      })
      expect(wrapper.attributes('aria-label')).toBe('Test Icon')
      expect(wrapper.attributes('aria-hidden')).toBeUndefined()
      expect(wrapper.attributes('role')).toBeUndefined()
    })
  })

  describe('class binding', () => {
    it('merges external classes with internal classes', () => {
      const wrapper = mount(TestComponent, {
        attrs: {
          class: 'external-class',
        },
      })
      expect(wrapper.attributes('class')).toBe('external-class')
    })

    it('handles multiple classes', () => {
      const wrapper = mount(TestComponent, {
        attrs: {
          class: 'first-class second-class',
        },
      })
      expect(wrapper.attributes('class')).toBe('first-class second-class')
    })
  })

  describe('reactivity', () => {
    it('updates weight when prop changes', async () => {
      const wrapper = mount(TestComponent, {
        props: {
          weight: 'thin',
        },
      })
      expect(wrapper.text()).toBe('thin')

      await wrapper.setProps({
        weight: 'bold',
      })
      expect(wrapper.text()).toBe('bold')
    })

    it('updates accessibility attributes when label changes', async () => {
      const wrapper = mount(TestComponent)
      expect(wrapper.attributes('aria-hidden')).toBe('true')

      await wrapper.setProps({
        label: 'New Label',
      })
      expect(wrapper.attributes('aria-label')).toBe('New Label')
      expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    })

    it('updates classes when attrs change', async () => {
      const WrapperComponent = defineComponent({
        props: {
          customClass: String,
        },
        components: { TestComponent },
        template: '<TestComponent :class="customClass" />',
      })

      const wrapper = mount(WrapperComponent, {
        props: {
          customClass: 'initial-class',
        },
      })
      expect(wrapper.attributes('class')).toBe('initial-class')

      await wrapper.setProps({
        customClass: 'updated-class',
      })
      expect(wrapper.attributes('class')).toBe('updated-class')
    })
  })
})
