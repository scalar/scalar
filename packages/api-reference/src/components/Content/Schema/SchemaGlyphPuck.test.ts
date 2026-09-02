import { ScalarIconMinus, ScalarIconPlus } from '@scalar/icons'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaGlyphPuck from './SchemaGlyphPuck.vue'

describe('SchemaGlyphPuck', () => {
  it('shows the plus glyph when closed', () => {
    const wrapper = mount(SchemaGlyphPuck, {
      props: { open: false },
    })

    expect(wrapper.findComponent(ScalarIconPlus).exists()).toBe(true)
    expect(wrapper.findComponent(ScalarIconMinus).exists()).toBe(false)
  })

  it('shows the plus glyph when open is not provided', () => {
    const wrapper = mount(SchemaGlyphPuck)

    expect(wrapper.findComponent(ScalarIconPlus).exists()).toBe(true)
    expect(wrapper.findComponent(ScalarIconMinus).exists()).toBe(false)
  })

  it('shows the minus glyph when open', () => {
    const wrapper = mount(SchemaGlyphPuck, {
      props: { open: true },
    })

    expect(wrapper.findComponent(ScalarIconMinus).exists()).toBe(true)
    expect(wrapper.findComponent(ScalarIconPlus).exists()).toBe(false)
  })

  it('swaps the glyph as open changes', async () => {
    const wrapper = mount(SchemaGlyphPuck, {
      props: { open: false },
    })

    await wrapper.setProps({ open: true })

    expect(wrapper.findComponent(ScalarIconMinus).exists()).toBe(true)
    expect(wrapper.findComponent(ScalarIconPlus).exists()).toBe(false)
  })

  it('lets slot content replace the default glyph', () => {
    const wrapper = mount(SchemaGlyphPuck, {
      props: { open: true },
      slots: { default: '<i data-custom-glyph>?</i>' },
    })

    expect(wrapper.find('[data-custom-glyph]').exists()).toBe(true)
    expect(wrapper.findComponent(ScalarIconMinus).exists()).toBe(false)
    expect(wrapper.findComponent(ScalarIconPlus).exists()).toBe(false)
  })

  it('is hidden from assistive technology', () => {
    const wrapper = mount(SchemaGlyphPuck)

    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })

  // `floating` only ever emits positioning classes, and jsdom runs no layout, so
  // the positioning class is the only place this prop is observable at all.
  it('floats in the margin by default', () => {
    const wrapper = mount(SchemaGlyphPuck)

    expect(wrapper.classes()).toContain('absolute')
  })

  // The complement matters on its own: SchemaGutterToggle places the puck
  // inside an already-positioned button, where floating would offset it twice.
  it('stays in the flow when floating is off', () => {
    const wrapper = mount(SchemaGlyphPuck, {
      props: { floating: false },
    })

    expect(wrapper.classes()).not.toContain('absolute')
  })

  // Same story as `floating`: the anchor picks a vertical offset class and
  // nothing else, so there is no behaviour to assert on instead.
  it('centres on the first text line with the line anchor', () => {
    const wrapper = mount(SchemaGlyphPuck, {
      props: { anchor: 'line' },
    })

    expect(wrapper.classes()).toContain('top-[0.5lh]')
  })
})
