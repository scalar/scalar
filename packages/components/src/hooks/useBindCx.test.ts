import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import { cva } from '../cva'
import { useBindCx } from './useBindCx'

describe('useBindCx', () => {
  const variants = cva({
    base: 'bg-base',
    variants: {
      active: { true: 'bg-active' },
    },
  })

  const TestComponent = defineComponent({
    props: {
      active: Boolean,
    },
    inheritAttrs: false,
    setup() {
      const { cx } = useBindCx()
      return { cx, variants }
    },
    template: '<div v-bind="cx(variants({ active }))">Test</div>',
  })

  it('should merge base classes correctly', () => {
    const wrapper = mount(TestComponent)
    expect(wrapper.attributes('class')).toBe('bg-base')
  })

  it('should apply variant tailwind classes', () => {
    const wrapper = mount(TestComponent, {
      props: { active: true },
    })
    expect(wrapper.attributes('class')).toBe('bg-active')
  })

  it('should merge external classes with internal classes', () => {
    const wrapper = mount(TestComponent, {
      attrs: { class: 'external-class' },
    })
    expect(wrapper.attributes('class')).toBe('bg-base external-class')
  })

  it('should be reactive to prop changes', async () => {
    const wrapper = mount(TestComponent, {
      props: { active: false },
      attrs: { class: 'external-class' },
    })
    expect(wrapper.attributes('class')).toBe('bg-base external-class')

    await wrapper.setProps({ active: true })
    expect(wrapper.attributes('class')).toBe('bg-active external-class')
  })

  it('should be reactive to attribute changes', async () => {
    const WrapperComponent = defineComponent({
      props: { c: { type: String, default: '' } },
      components: { TestComponent },
      template: '<TestComponent :class="c" />',
    })

    const wrapper = mount(WrapperComponent, {
      props: { c: 'external-class' },
    })
    expect(wrapper.attributes('class')).toBe('bg-base external-class')

    await wrapper.setProps({ c: 'updated-class' })
    expect(wrapper.attributes('class')).toBe('bg-base updated-class')
  })

  it('should handle multiple class combinations', () => {
    const wrapper = mount(TestComponent, {
      props: { active: true },
      attrs: { class: 'external-class another-class' },
    })
    expect(wrapper.attributes('class')).toBe('bg-active external-class another-class')
  })

  it('should apply external tailwind classes', () => {
    const wrapper = mount(TestComponent, {
      attrs: { class: 'bg-external' },
    })
    expect(wrapper.attributes('class')).toBe('bg-external')
  })

  it('should apply classes in arrays', () => {
    const wrapper = mount(TestComponent, {
      attrs: { class: ['external-class', 'another-class'] },
    })
    expect(wrapper.attributes('class')).toBe('bg-base external-class another-class')
  })

  it('should apply classes in objects', () => {
    const wrapper = mount(TestComponent, {
      attrs: { class: { 'truthy-class': true, 'falsy-class': false } },
    })
    expect(wrapper.attributes('class')).toBe('bg-base truthy-class')
  })

  it('should pass through other attributes', () => {
    const wrapper = mount(TestComponent, {
      attrs: { 'data-testid': 'test', 'aria-label': 'test label' },
    })
    expect(wrapper.attributes('class')).toBe('bg-base')
    expect(wrapper.attributes('data-testid')).toBe('test')
    expect(wrapper.attributes('aria-label')).toBe('test label')
  })
})
