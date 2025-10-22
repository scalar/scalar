import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import { cva } from './cva'
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

  it('should merge classes and apply styles with stylingAttrsCx without other attributes', () => {
    const StylingCxComponent = defineComponent({
      props: { active: Boolean },
      inheritAttrs: false,
      setup() {
        const { stylingAttrsCx } = useBindCx()
        return { stylingAttrsCx }
      },
      template: '<div v-bind="stylingAttrsCx(\'internal-class\')">Test</div>',
    })

    const wrapper = mount(StylingCxComponent, {
      props: { active: true },
      attrs: { class: 'external-class', style: 'display: block;', 'data-testid': 'test' },
    })

    expect(wrapper.attributes('class')).toBe('internal-class external-class')
    expect(wrapper.attributes('style')).toBe('display: block;')
    expect(wrapper.attributes('data-testid')).toBeUndefined()
  })

  it('should apply object style attributes with stylingAttrsCx', () => {
    const StylingCxComponent = defineComponent({
      inheritAttrs: false,
      setup() {
        const { stylingAttrsCx } = useBindCx()
        return { stylingAttrsCx }
      },
      template: '<div v-bind="stylingAttrsCx()">Test</div>',
    })

    const wrapper = mount(StylingCxComponent, {
      attrs: { style: { display: 'block' }, 'data-testid': 'test' },
    })

    expect(wrapper.attributes('style')).toBe('display: block;')
    expect(wrapper.attributes('data-testid')).toBeUndefined()
  })

  it('should provide other attributes via otherAttrs', () => {
    const OtherAttrsComponent = defineComponent({
      inheritAttrs: false,
      setup() {
        const { otherAttrs } = useBindCx()
        return { otherAttrs }
      },
      template: '<div v-bind="otherAttrs">Test</div>',
    })

    const wrapper = mount(OtherAttrsComponent, {
      attrs: {
        class: 'should-not-appear',
        style: 'should-not-appear-either',
        'data-testid': 'test',
        'aria-label': 'test label',
      },
    })

    expect(wrapper.attributes('class')).toBeUndefined()
    expect(wrapper.attributes('style')).toBeUndefined()
    expect(wrapper.html()).not.toContain('should-not-appear')
    expect(wrapper.attributes('data-testid')).toBe('test')
    expect(wrapper.attributes('aria-label')).toBe('test label')
  })

  it('should handle reactive attribute changes with stylingAttrsCx and otherAttrs', async () => {
    const WrapperComponent = defineComponent({
      props: {
        classAttr: { type: String, default: '' },
        styleAttr: { type: String, default: '' },
        testId: { type: String, default: '' },
      },
      components: {
        InnerComponent: defineComponent({
          inheritAttrs: false,
          setup() {
            const { stylingAttrsCx, otherAttrs } = useBindCx()
            return { stylingAttrsCx, otherAttrs, variants }
          },
          template: `
            <div>
              <div data-test="styling" v-bind="stylingAttrsCx(variants({}))">Class</div>
              <div data-test="other" v-bind="otherAttrs">Attrs</div>
            </div>
          `,
        }),
      },
      template: '<InnerComponent :class="classAttr" :style="styleAttr" :data-testid="testId" />',
    })

    const wrapper = mount(WrapperComponent, {
      props: {
        classAttr: 'initial-class',
        styleAttr: 'color: red;',
        testId: 'initial-id',
      },
    })

    const stylingDiv = wrapper.find('[data-test="styling"]')
    const otherAttrsDiv = wrapper.find('[data-test="other"]')

    expect(stylingDiv.attributes('class')).toBe('bg-base initial-class')
    expect(stylingDiv.attributes('style')).toBe('color: red;')
    expect(otherAttrsDiv.attributes('data-testid')).toBe('initial-id')

    await wrapper.setProps({
      classAttr: 'updated-class',
      styleAttr: 'color: blue;',
      testId: 'updated-id',
    })

    expect(stylingDiv.attributes('class')).toBe('bg-base updated-class')
    expect(stylingDiv.attributes('style')).toBe('color: blue;')
    expect(otherAttrsDiv.attributes('data-testid')).toBe('updated-id')
  })
})
