import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ChatMarkdown from './ChatMarkdown.vue'
import { hashMarkdownBlock, splitMarkdownBlocks } from './chat-markdown'

describe('chat-markdown', () => {
  describe('splitMarkdownBlocks', () => {
    it('splits paragraphs on blank lines', () => {
      expect(splitMarkdownBlocks('One\n\nTwo\n\nThree')).toEqual(['One', 'Two', 'Three'])
    })

    it('treats whitespace-only lines as blank and never emits empty blocks', () => {
      expect(splitMarkdownBlocks('One\n  \n\n\nTwo')).toEqual(['One', 'Two'])
    })

    it('returns no blocks for an empty source', () => {
      expect(splitMarkdownBlocks('')).toEqual([])
    })

    it('keeps a backtick fence with blank lines inside as one block', () => {
      const source = 'Intro\n\n```js\nconst a = 1\n\nconst b = 2\n```\n\nOutro'

      expect(splitMarkdownBlocks(source)).toEqual(['Intro', '```js\nconst a = 1\n\nconst b = 2\n```', 'Outro'])
    })

    it('keeps a tilde fence with blank lines inside as one block', () => {
      const source = '~~~\nfirst\n\nsecond\n~~~\n\nAfter'

      expect(splitMarkdownBlocks(source)).toEqual(['~~~\nfirst\n\nsecond\n~~~', 'After'])
    })

    it('keeps everything from an unterminated fence in one trailing block', () => {
      const source = 'Intro\n\n```python\nprint(1)\n\nprint(2)'

      expect(splitMarkdownBlocks(source)).toEqual(['Intro', '```python\nprint(1)\n\nprint(2)'])
    })

    it('only closes a fence with a run at least as long as the opener', () => {
      // The inner three-backtick line is content of the four-backtick fence.
      const source = '````\n```\n\nstill inside\n````\n\nAfter'

      expect(splitMarkdownBlocks(source)).toEqual(['````\n```\n\nstill inside\n````', 'After'])
    })

    it('does not close a fence on a line carrying an info string', () => {
      // A closing fence may only be followed by whitespace, so this stays open.
      const source = '```\ncode\n``` js\n\nstill inside\n```\n\nAfter'

      expect(splitMarkdownBlocks(source)).toEqual(['```\ncode\n``` js\n\nstill inside\n```', 'After'])
    })

    it('keeps consecutive list lines in one block', () => {
      const source = '- one\n- two\n- three\n\nNext paragraph'

      expect(splitMarkdownBlocks(source)).toEqual(['- one\n- two\n- three', 'Next paragraph'])
    })

    it('keeps blockquote and table runs in one block', () => {
      expect(splitMarkdownBlocks('> a\n> b')).toEqual(['> a\n> b'])
      expect(splitMarkdownBlocks('| a | b |\n| - | - |\n| 1 | 2 |')).toEqual(['| a | b |\n| - | - |\n| 1 | 2 |'])
    })
  })

  describe('hashMarkdownBlock', () => {
    it('is stable for identical input', () => {
      expect(hashMarkdownBlock('# Hello', 3)).toBe(hashMarkdownBlock('# Hello', 3))
    })

    it('differentiates identical blocks by index', () => {
      expect(hashMarkdownBlock('Same text', 0)).not.toBe(hashMarkdownBlock('Same text', 1))
    })

    it('differentiates different content at the same index', () => {
      expect(hashMarkdownBlock('First', 0)).not.toBe(hashMarkdownBlock('Second', 0))
    })
  })

  describe('ChatMarkdown', () => {
    it('keeps completed block DOM identity across a streaming append', async () => {
      const wrapper = mount(ChatMarkdown, {
        props: {
          content: 'First paragraph\n\nSecond paragraph strea',
          streaming: true,
        },
      })

      const firstBefore = wrapper.get('[role="log"]').element.children[0]
      const paragraphBefore = firstBefore?.querySelector('p')
      expect(paragraphBefore?.textContent).toBe('First paragraph')

      await wrapper.setProps({
        content: 'First paragraph\n\nSecond paragraph streaming along',
      })

      const firstAfter = wrapper.get('[role="log"]').element.children[0]
      expect(firstAfter).toBe(firstBefore)
      // The same inner node proves the block was not re-parsed or re-rendered.
      expect(firstAfter?.querySelector('p')).toBe(paragraphBefore)
    })

    it('renders the trailing block outside the log while streaming', () => {
      const wrapper = mount(ChatMarkdown, {
        props: { content: 'Alpha done\n\nBeta tail', streaming: true },
      })

      const log = wrapper.get('[role="log"]')
      expect(log.attributes('aria-live')).toBe('polite')
      expect(log.text()).toContain('Alpha done')
      expect(log.text()).not.toContain('Beta tail')

      const trailing = wrapper.get('[aria-live="off"]')
      expect(trailing.text()).toContain('Beta tail')
    })

    it('moves the trailing block into the log when streaming ends', async () => {
      const wrapper = mount(ChatMarkdown, {
        props: { content: 'Alpha done\n\nBeta tail', streaming: true },
      })

      await wrapper.setProps({ streaming: false })

      expect(wrapper.find('[aria-live="off"]').exists()).toBe(false)
      expect(wrapper.get('[role="log"]').text()).toContain('Beta tail')
    })

    it('moves a block into the log when a new block starts after it', async () => {
      const wrapper = mount(ChatMarkdown, {
        props: { content: 'One\n\nTwo partial', streaming: true },
      })

      const firstBefore = wrapper.get('[role="log"]').element.children[0]
      expect(wrapper.get('[role="log"]').element.children).toHaveLength(1)

      await wrapper.setProps({ content: 'One\n\nTwo done\n\nThree strea' })

      const log = wrapper.get('[role="log"]')
      expect(log.element.children).toHaveLength(2)
      expect(log.text()).toContain('Two done')
      expect(log.element.children[0]).toBe(firstBefore)
      expect(wrapper.get('[aria-live="off"]').text()).toContain('Three strea')
    })

    it('keeps a lone streaming block out of the log until it completes', async () => {
      const wrapper = mount(ChatMarkdown, {
        props: { content: 'Only block so far', streaming: true },
      })

      expect(wrapper.get('[role="log"]').element.children).toHaveLength(0)
      expect(wrapper.get('[aria-live="off"]').text()).toContain('Only block so far')

      await wrapper.setProps({ streaming: false })

      expect(wrapper.get('[role="log"]').text()).toContain('Only block so far')
      expect(wrapper.find('[aria-live="off"]').exists()).toBe(false)
    })
  })
})
