import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import SchemaRailPanel from './SchemaRailPanel.vue'

describe('SchemaRailPanel', () => {
  it('renders the slot content', () => {
    const wrapper = mount(SchemaRailPanel, {
      props: { depth: 1 },
      slots: { default: '<p>child row</p>' },
    })

    expect(wrapper.text()).toContain('child row')
  })

  it('writes the depth as an inline custom property', () => {
    const wrapper = mount(SchemaRailPanel, {
      props: { depth: 3 },
    })

    expect((wrapper.element as HTMLElement).style.getPropertyValue('--schema-depth')).toBe('3')
  })

  it('keeps the inline depth current when the prop changes', async () => {
    const wrapper = mount(SchemaRailPanel, {
      props: { depth: 1 },
    })

    await wrapper.setProps({ depth: 4 })

    expect((wrapper.element as HTMLElement).style.getPropertyValue('--schema-depth')).toBe('4')
  })

  it('renders no close strip by default', () => {
    const wrapper = mount(SchemaRailPanel, {
      props: { depth: 1 },
    })

    expect(wrapper.find('[data-rail-hit]').exists()).toBe(false)
  })

  it('renders the close strip only with closeOnRail', () => {
    const wrapper = mount(SchemaRailPanel, {
      props: { depth: 1, closeOnRail: true },
    })

    const strip = wrapper.find('[data-rail-hit]')

    expect(strip.exists()).toBe(true)
    expect(strip.attributes('aria-hidden')).toBe('true')
  })

  /*
   * Emits are asserted through a listener rather than `wrapper.emitted()`.
   * This package compiles with `process.env.NODE_ENV` defined as production,
   * which strips the devtools hook test-utils records emits from — so
   * `emitted()` stays empty here even when the event fires.
   */
  it('emits close when the strip is clicked', async () => {
    let closed = 0
    const wrapper = mount(SchemaRailPanel, {
      props: { depth: 1, closeOnRail: true },
      attrs: {
        onClose: () => {
          closed += 1
        },
      },
    })

    await wrapper.find('[data-rail-hit]').trigger('click')

    expect(closed).toBe(1)
  })

  it('stops the strip click from reaching the panel', async () => {
    let bubbled = 0
    const wrapper = mount(SchemaRailPanel, {
      props: { depth: 1, closeOnRail: true },
      attrs: {
        onClick: () => {
          bubbled += 1
        },
      },
    })

    await wrapper.find('[data-rail-hit]').trigger('click')

    expect(bubbled).toBe(0)
  })

  it('renders a div by default', () => {
    const wrapper = mount(SchemaRailPanel, {
      props: { depth: 1 },
    })

    expect(wrapper.element.tagName).toBe('DIV')
  })

  it('renders a custom element from the as prop', () => {
    const wrapper = mount(SchemaRailPanel, {
      props: { depth: 1, as: 'section' },
    })

    expect(wrapper.element.tagName).toBe('SECTION')
  })

  it('renders a custom component from the as prop', () => {
    const Panel = defineComponent({
      name: 'Panel',
      setup:
        (_props, { slots }) =>
        () =>
          h('ul', { 'data-panel': '' }, slots.default?.()),
    })

    const wrapper = mount(SchemaRailPanel, {
      props: { depth: 2, as: Panel },
      slots: { default: '<li>item</li>' },
    })

    expect(wrapper.find('ul[data-panel]').exists()).toBe(true)
    expect(wrapper.text()).toContain('item')
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--schema-depth')).toBe('2')
  })

  it('passes attributes through to the root', () => {
    const wrapper = mount(SchemaRailPanel, {
      props: { depth: 1 },
      attrs: { id: 'panel-1', class: 'mt-1.5' },
    })

    expect(wrapper.attributes('id')).toBe('panel-1')
    expect(wrapper.classes()).toContain('mt-1.5')
    expect(wrapper.classes()).toContain('schema-rail-panel')
  })
})
