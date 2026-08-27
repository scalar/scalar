import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { type OutlineRole, provideDocumentOutline, useDocumentOutline } from './use-document-outline'

/** A block that renders the level it resolves, so a mount can assert on it. */
const Block = defineComponent({
  props: { role: { type: String as () => OutlineRole, required: true } },
  setup(props, { slots }) {
    const { level } = useDocumentOutline(props.role)
    return () => h('div', [h(`h${level}`, String(level)), slots.default?.()])
  },
})

/** A composer that anchors the outline, the way Content does. */
const Composer = defineComponent({
  props: { root: { type: String as () => OutlineRole, required: true } },
  setup(props, { slots }) {
    provideDocumentOutline(props.root)
    return () => h('div', slots.default?.())
  },
})

/** Level a block resolves to, optionally inside a composed outline. */
const levelOf = (role: OutlineRole, root?: OutlineRole) => {
  const block = h(Block, { role })
  const wrapper = mount(
    defineComponent({
      setup: () => () => (root ? h(Composer, { root }, { default: () => [block] }) : block),
    }),
  )
  return Number(wrapper.find('h1,h2,h3,h4,h5,h6').text())
}

describe('useDocumentOutline', () => {
  describe('a block rendered on its own', () => {
    // The default: a block assumes it is the page, so it is the h1. This is what
    // makes a standalone operation page work with no configuration at all.
    it.each(['document', 'tag', 'channel', 'modelGroup', 'operation', 'model', 'message'] as const)(
      'resolves %s to h1',
      (role) => {
        expect(levelOf(role)).toBe(1)
      },
    )
  })

  describe('inside a document outline', () => {
    // These are the levels the embedded reference renders today, so this is the
    // regression guard for the full single-page reference.
    it.each([
      ['document', 1],
      ['tag', 2],
      ['channel', 2],
      ['modelGroup', 2],
      ['operation', 3],
      ['model', 3],
      ['message', 4],
    ] as const)('resolves %s to h%i', (role, expected) => {
      expect(levelOf(role, 'document')).toBe(expected)
    })
  })

  it('keeps an untagged operation at the same level as a tagged one', () => {
    // Level tracks the page hierarchy, not nesting — an operation is an
    // operation whether or not a tag wraps it.
    expect(levelOf('operation', 'document')).toBe(3)
  })

  it('nests beneath a block that anchors its own outline', () => {
    // A standalone tag page: the tag is the h1 and its operations follow under
    // it, without the page declaring anything.
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Block,
            { role: 'tag' },
            {
              default: () => [h(Block, { role: 'operation' })],
            },
          ),
      }),
    )

    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.find('h2').exists()).toBe(true)
    expect(wrapper.find('h3').exists()).toBe(false)
  })

  it('leaves a nested tag at the same level as its parent tag', () => {
    // Brynn's rule: nested tags stay h2, because level is the page hierarchy.
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Composer,
            { root: 'document' },
            {
              default: () => [
                h(
                  Block,
                  { role: 'tag' },
                  {
                    default: () => [h(Block, { role: 'tag' })],
                  },
                ),
              ],
            },
          ),
      }),
    )

    expect(wrapper.findAll('h2')).toHaveLength(2)
    expect(wrapper.find('h3').exists()).toBe(false)
  })

  it('clamps rather than resolving below h1', () => {
    expect(levelOf('document', 'message')).toBe(1)
  })

  it('reaches a block passed in as slot content', () => {
    // The real shape — a composer wraps content it does not own.
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Composer,
            { root: 'document' },
            {
              default: () => [h('section', [h(Block, { role: 'operation' })])],
            },
          ),
      }),
    )

    expect(wrapper.find('h3').exists()).toBe(true)
  })
})
