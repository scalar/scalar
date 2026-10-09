import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import StickerAgentScalar from './StickerAgentScalar.vue'

/** Collects the ids every `fill="url(#…)"` inside the svg points at */
const referencedIds = (svg: Element): string[] =>
  Array.from(svg.querySelectorAll('[fill]'))
    .map((el) => el.getAttribute('fill')?.match(/^url\(#(.+)\)$/)?.[1])
    .filter((id): id is string => typeof id === 'string')

describe('StickerAgentScalar', () => {
  it('uses unique gradient ids per instance', () => {
    const wrapper = mount(
      defineComponent({
        render: () => h('div', [h(StickerAgentScalar), h(StickerAgentScalar)]),
      }),
    )
    const [first, second] = wrapper.findAll('svg').map((sticker) => sticker.element)
    if (!first || !second) {
      throw new Error('Expected two stickers')
    }

    const idsOf = (svg: Element) => Array.from(svg.querySelectorAll('linearGradient')).map((el) => el.id)
    const firstIds = idsOf(first)
    const secondIds = idsOf(second)

    expect(firstIds).toHaveLength(3)
    expect(secondIds).toHaveLength(3)
    expect(firstIds.filter((id) => secondIds.includes(id))).toEqual([])

    // Every gradient reference resolves inside its own svg
    for (const svg of [first, second]) {
      const ids = idsOf(svg)
      for (const referenced of referencedIds(svg)) {
        expect(ids).toContain(referenced)
      }
      expect(referencedIds(svg).length).toBeGreaterThan(0)
    }
  })

  it('is hidden from assistive technology', () => {
    const wrapper = mount(StickerAgentScalar)

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('focusable')).toBe('false')
    expect(wrapper.attributes('data-sticker')).toBe('agent')
  })
})
