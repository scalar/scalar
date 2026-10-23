import { registerLanguage } from '@scalar/highlight'
import { loadLanguage } from '@scalar/highlight/lazy'
import type { Root } from 'hast'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { describe, expect, it } from 'vitest'

import { rehypeHighlight } from './rehype-highlight'

/** Render Markdown through the highlight plugin, mirroring the description pipeline */
const render = (markdown: string) =>
  unified().use(remarkParse).use(remarkRehype).use(rehypeHighlight).use(rehypeStringify).processSync(markdown)

describe('rehypeHighlight', () => {
  it('highlights fenced code blocks', async () => {
    await loadLanguage('javascript')
    const html = String(render('```js\nconst answer = 42\n```'))

    expect(html).toContain('<code class="hljs language-js">')
    expect(html).toContain('<span class="hljs-keyword">const</span>')
    expect(html).toContain('<span class="hljs-number">42</span>')
  })

  it('resolves the lowlight aliases', async () => {
    await loadLanguage('javascript')
    const html = String(render('```node\nconst answer = 42\n```'))

    expect(html).toContain('<span class="hljs-keyword">const</span>')
  })

  it('leaves a fence without a language uncoloured', () => {
    const html = String(render('```\nconst answer = 42\n```'))

    expect(html).toContain('<code class="hljs">const answer = 42\n</code>')
  })

  it('leaves a fence in an unknown language uncoloured and reports it', () => {
    const file = render('```brainfuck\n+[----->+++<]>+.\n```')

    expect(String(file)).toContain('<code class="hljs language-brainfuck">+[----->+++&#x3C;]>+.\n</code>')
    expect(file.messages.map((message) => message.ruleId)).toEqual(['missing-language'])
    expect(file.data.missingLanguages).toEqual(['brainfuck'])
  })

  it('leaves a fence uncoloured until its grammar is loaded', async () => {
    // No other test here loads Ruby, so it is not registered yet
    const markdown = '```rb\nputs 1\n```\n\n```ruby\nputs 2\n```\n\n```rb\nputs 3\n```'
    const before = render(markdown)

    expect(String(before)).toContain('<code class="hljs language-rb">puts 1\n</code>')
    // One entry per language name, in the order the blocks appear
    expect(before.data.missingLanguages).toEqual(['rb', 'ruby'])

    await loadLanguage('ruby')
    const after = render(markdown)

    expect(String(after)).toContain('<span class="hljs-number">1</span>')
    expect(after.data.missingLanguages).toBeUndefined()
  })

  it('skips blocks marked no-highlight', () => {
    const html = String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(() => (tree: Root) => {
          // remark has no syntax for the class, so set it the way raw HTML would.
          visit(tree, 'element', (node) => {
            if (node.tagName === 'code') {
              node.properties.className = ['no-highlight']
            }
          })
        })
        .use(rehypeHighlight)
        .use(rehypeStringify)
        .processSync('```\nconst answer = 42\n```'),
    )

    expect(html).toContain('<code class="no-highlight">')
  })

  it('adds extra class names', () => {
    const html = String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeHighlight, { className: 'custom-scroll' })
        .use(rehypeStringify)
        .processSync('```js\n1\n```'),
    )

    expect(html).toContain('<code class="hljs language-js custom-scroll">')
  })

  // A grammar can throw at runtime (for example a regex that a production
  // minifier mangled). Highlighting must stay best-effort so the surrounding
  // Markdown section is never dropped.
  it('keeps the code block when highlighting throws', () => {
    registerLanguage({ name: 'broken', states: { root: { rules: [{ match: '(', scope: 'keyword' }] } } })

    const process = () => render('Before\n\n```broken\nsome code\n```\n\nAfter')

    expect(process).not.toThrow()

    const file = process()

    expect(String(file)).toContain('some code')
    expect(String(file)).toContain('Before')
    expect(String(file)).toContain('After')
    expect(file.messages.map((message) => message.ruleId)).toEqual(['highlight-error'])
  })
})
