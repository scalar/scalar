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

    it('keeps loose lists in one block', () => {
      // Splitting `- alpha` / `- beta` at the blank line would render two
      // separate tight lists instead of one loose list.
      expect(splitMarkdownBlocks('- alpha\n\n- beta')).toEqual(['- alpha\n\n- beta'])
      expect(splitMarkdownBlocks('1. one\n\n2. two')).toEqual(['1. one\n\n2. two'])
    })

    it('glues a bare list marker so mid-stream chunk boundaries do not split', () => {
      // A chunk boundary can land right after the `-`; splitting there would
      // promote the previous block into the live region and re-mount it a
      // moment later when the item text arrives.
      expect(splitMarkdownBlocks('Intro:\n\n-')).toEqual(['Intro:\n\n-'])
      expect(splitMarkdownBlocks('- one\n\n-')).toEqual(['- one\n\n-'])
    })

    it('keeps indented continuations with their list item', () => {
      // The continuation paragraph is part of item 1; split apart it would
      // render as an indented code block and the list would restart at 2.
      const source = '1. Install:\n\n    npm install foo\n\n2. Run it'

      expect(splitMarkdownBlocks(source)).toEqual([source])
    })

    it('keeps indented fences inside list items whole', () => {
      const source = '- item\n\n  ```bash\n\n  npm install\n  ```'

      expect(splitMarkdownBlocks(source)).toEqual([source])
    })

    it('keeps blockquote and table runs in one block', () => {
      expect(splitMarkdownBlocks('> a\n> b')).toEqual(['> a\n> b'])
      expect(splitMarkdownBlocks('| a | b |\n| - | - |\n| 1 | 2 |')).toEqual(['| a | b |\n| - | - |\n| 1 | 2 |'])
    })

    it('keeps an HTML comment spanning a blank line in one block', () => {
      // Split apart, a whole-document parse would swallow the comment while
      // the per-block parse renders the tail (`… -->`) as visible text.
      const source = 'Before\n\n<!--\nline one\n\nline two\n-->\n\nAfter'

      expect(splitMarkdownBlocks(source)).toEqual(['Before', '<!--\nline one\n\nline two\n-->', 'After'])
    })

    it('keeps a script block spanning a blank line in one block', () => {
      const source = '<script>\nconst a = 1\n\nconst b = 2\n</script>\n\nAfter'

      expect(splitMarkdownBlocks(source)).toEqual(['<script>\nconst a = 1\n\nconst b = 2\n</script>', 'After'])
    })

    it('splits normally after an HTML block that closes on its opening line', () => {
      expect(splitMarkdownBlocks('<!-- note -->\n\nAfter')).toEqual(['<!-- note -->', 'After'])
    })

    it('accepts the invalid-but-parsed --!> comment close', () => {
      // Both the HTML spec and micromark end a comment at `--!>`; gluing
      // until a later `-->` would diverge from the parser (js/bad-tag-filter).
      const source = 'Before\n\n<!--\nhidden\n--!>\n\nAfter'

      expect(splitMarkdownBlocks(source)).toEqual(['Before', '<!--\nhidden\n--!>', 'After'])
    })

    it('keeps everything from an unterminated HTML block in one trailing block', () => {
      // Matches whole-document semantics: an unclosed comment swallows the
      // rest of the source, so nothing after it may render independently.
      const source = 'Before\n\n<!--\nstill open\n\nmore'

      expect(splitMarkdownBlocks(source)).toEqual(['Before', '<!--\nstill open\n\nmore'])
    })

    it('appends a link reference definition to every block so usages resolve', () => {
      // The definition binds to usages in other blocks; a per-block parse
      // without the appendix would leave `[scalar]` as literal text. Pure
      // link definitions render to nothing, so the appendix (and any
      // duplicate of a natively-contained definition) is invisible.
      const source = 'Intro.\n\nSee [scalar].\n\n[scalar]: https://scalar.com\n\nOutro'

      expect(splitMarkdownBlocks(source)).toEqual([
        'Intro.\n\n[scalar]: https://scalar.com',
        // The definition glues to the block before it, so it never forms
        // an empty-rendering block of its own.
        'See [scalar].\n\n[scalar]: https://scalar.com\n\n[scalar]: https://scalar.com',
        'Outro\n\n[scalar]: https://scalar.com',
      ])
    })

    it('glues but never collects a still-growing definition line while streaming', () => {
      // The glue is stable from the line's first character; collecting the
      // partial line, though, would re-key every completed block on each
      // of its tokens — only a complete source collects the last line.
      const source = 'See [1].\n\nMore.\n\n[1]: https://e'

      expect(splitMarkdownBlocks(source, { complete: false })).toEqual(['See [1].', 'More.\n\n[1]: https://e'])
      expect(splitMarkdownBlocks(source)).toEqual([
        'See [1].\n\n[1]: https://e',
        'More.\n\n[1]: https://e\n\n[1]: https://e',
      ])
    })

    it('never re-merges a committed block when prose follows a citation line', () => {
      // The glue decision must never flip retroactively: when the line
      // after the definition arrives, earlier blocks keep their shape —
      // they only gain the invisible appendix, in one re-key.
      const before = splitMarkdownBlocks('Intro.\n\nSee [1].\n\n[1]: https://example.com', { complete: false })
      const after = splitMarkdownBlocks('Intro.\n\nSee [1].\n\n[1]: https://example.com\n\nMore prose.', {
        complete: false,
      })

      expect(before).toEqual(['Intro.', 'See [1].\n\n[1]: https://example.com'])
      expect(after).toEqual([
        'Intro.\n\n[1]: https://example.com',
        'See [1].\n\n[1]: https://example.com\n\n[1]: https://example.com',
        'More prose.\n\n[1]: https://example.com',
      ])
    })

    it('glues a plain link-opening paragraph without splitting behavior changes', () => {
      // Coarser memoization, identical rendering: the blank line survives
      // inside the block, so the two paragraphs still render separately.
      const source = 'Para.\n\n[Click here](https://x) to begin.'

      expect(splitMarkdownBlocks(source)).toEqual([source])
    })

    it('glues and collects a definition once a later line terminates it', () => {
      const source = 'Para.\n\nSee [1].\n\n[1]: https://x\n\nNext'

      expect(splitMarkdownBlocks(source, { complete: false })).toEqual([
        'Para.\n\n[1]: https://x',
        'See [1].\n\n[1]: https://x\n\n[1]: https://x',
        'Next\n\n[1]: https://x',
      ])
    })

    it('ignores a definition-looking line that cannot interrupt a paragraph', () => {
      // Per CommonMark, `Foo\n[bar]: /x` is a two-line paragraph and the
      // definition never binds — appending it would fabricate a working
      // link in other blocks that the whole-document parse never grants.
      const source = 'Foo\n[bar]: /real-url\n\nElsewhere, see [bar].'

      expect(splitMarkdownBlocks(source)).toEqual(['Foo\n[bar]: /real-url', 'Elsewhere, see [bar].'])
    })

    it('collects chained definitions at a block start', () => {
      const source = 'See [a] and [b].\n\n[a]: /a\n[b]: /b'

      expect(splitMarkdownBlocks(source)).toEqual(['See [a] and [b].\n\n[a]: /a\n[b]: /b\n\n[a]: /a\n[b]: /b'])
    })

    it('never appends definitions inside an unterminated fence', () => {
      const source = '[a]: https://a\n\n```\ncode still streaming'

      expect(splitMarkdownBlocks(source)).toEqual(['[a]: https://a\n\n[a]: https://a', '```\ncode still streaming'])
    })

    it('never splits a source containing a footnote definition', () => {
      // A footnote definition renders visible content wherever it is
      // parsed, so neither splitting nor appending is safe.
      const source = 'A claim.[^1]\n\n[^1]: The supporting source.'

      expect(splitMarkdownBlocks(source)).toEqual([source])
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
