import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ChatDiff from './ChatDiff.vue'

describe('chat-diff', () => {
  it('labels a single-line hunk from the first context row', () => {
    const wrapper = mount(ChatDiff, {
      props: { contextBefore: [{ line: 12, text: 'const a = 1' }] },
    })

    expect(wrapper.get('.chat-diff-hunk').text()).toBe('Line 12')
  })

  it('labels a range when the trailing context reaches a later line', () => {
    const wrapper = mount(ChatDiff, {
      props: {
        contextBefore: [{ line: 12, text: 'before' }],
        added: [{ line: 13, text: 'added' }],
        contextAfter: [{ line: 15, text: 'after' }],
      },
    })

    expect(wrapper.get('.chat-diff-hunk').text()).toBe('Lines 12–15')
  })

  it('falls back to the line number hint when rows carry no line numbers', () => {
    const wrapper = mount(ChatDiff, {
      props: {
        removed: [{ line: null, text: 'old line' }],
        lineNumberHint: 7,
      },
    })

    expect(wrapper.get('.chat-diff-hunk').text()).toBe('Line 7')
  })

  it('hides the hunk bar when there are no rows at all', () => {
    const wrapper = mount(ChatDiff, { props: { lineNumberHint: 7 } })

    expect(wrapper.find('.chat-diff-hunk').exists()).toBe(false)
  })

  it('renders removed and added rows with their signs and text', () => {
    const wrapper = mount(ChatDiff, {
      props: {
        removed: [{ line: null, text: 'old line' }],
        added: [{ line: 12, text: 'new line' }],
      },
    })

    const removedRow = wrapper.get('.chat-diff-row--removed')
    expect(removedRow.get('.chat-diff-sign').text()).toBe('−')
    expect(removedRow.get('.chat-diff-text').text()).toBe('old line')

    const addedRow = wrapper.get('.chat-diff-row--added')
    expect(addedRow.get('.chat-diff-sign').text()).toBe('+')
    expect(addedRow.get('.chat-diff-text').text()).toBe('new line')
    expect(addedRow.get('.chat-diff-line').text()).toBe('12')
  })

  it('renders context rows around the change without signs', () => {
    const wrapper = mount(ChatDiff, {
      props: {
        contextBefore: [{ line: 1, text: 'first' }],
        contextAfter: [{ line: 3, text: 'last' }],
      },
    })

    const contextRows = wrapper.findAll('.chat-diff-row--context')
    expect(contextRows).toHaveLength(2)
    expect(contextRows[0]?.get('.chat-diff-text').text()).toBe('first')
    expect(contextRows[1]?.get('.chat-diff-text').text()).toBe('last')
  })
})
