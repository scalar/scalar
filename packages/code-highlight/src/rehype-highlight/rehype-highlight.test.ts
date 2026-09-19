import { createLowlight } from 'lowlight'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'

import { standardLanguages } from '@/languages'

import { rehypeHighlight } from './rehype-highlight'

/** Render Markdown through the highlight plugin, mirroring the description pipeline */
const render = (markdown: string, lowlight?: ReturnType<typeof createLowlight>) =>
  unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHighlight, { detect: true, lowlight })
    .use(rehypeStringify)
    .processSync(markdown)

describe('rehypeHighlight', () => {
  it('highlights fenced code blocks', () => {
    const html = String(render('```js\nconst answer = 42\n```'))

    expect(html).toContain('hljs')
    expect(html).toContain('answer')
  })

  // A grammar can throw at runtime (for example a Unicode regex that a production
  // minifier mangles). Highlighting must stay best-effort so the surrounding
  // Markdown section is never dropped.
  it('keeps the code block when highlighting throws', () => {
    const throwing = {
      registerAlias: () => {},
      highlight: () => {
        throw new SyntaxError('Invalid regular expression: Invalid escape')
      },
      highlightAuto: () => {
        throw new SyntaxError('Invalid regular expression: Invalid escape')
      },
    } as unknown as ReturnType<typeof createLowlight>

    const process = () => render('Before\n\n```\nsome code\n```\n\nAfter', throwing)

    expect(process).not.toThrow()

    const html = String(process())

    expect(html).toContain('some code')
    expect(html).toContain('Before')
    expect(html).toContain('After')
  })

  describe('grammar registry', () => {
    it('highlights the same way for every plugin built from one language set', () => {
      const markdown = '```js\nconst answer = 42\n```'

      const first = String(
        unified()
          .use(remarkParse)
          .use(remarkRehype)
          .use(rehypeHighlight, { languages: standardLanguages })
          .use(rehypeStringify)
          .processSync(markdown),
      )
      const second = String(
        unified()
          .use(remarkParse)
          .use(remarkRehype)
          .use(rehypeHighlight, { languages: standardLanguages })
          .use(rehypeStringify)
          .processSync(markdown),
      )

      expect(first).toContain('hljs-keyword')
      expect(second).toBe(first)
    })

    it('keeps aliases out of the registry other callers share', () => {
      const markdown = '```mycustomjs\nconst answer = 42\n```'
      const withAlias = String(
        unified()
          .use(remarkParse)
          .use(remarkRehype)
          .use(rehypeHighlight, { languages: standardLanguages, aliases: { javascript: ['mycustomjs'] } })
          .use(rehypeStringify)
          .processSync(markdown),
      )

      expect(withAlias).toContain('hljs-keyword')

      // A plugin built without the alias must not have inherited it.
      const withoutAlias = String(
        unified()
          .use(remarkParse)
          .use(remarkRehype)
          .use(rehypeHighlight, { languages: standardLanguages })
          .use(rehypeStringify)
          .processSync(markdown),
      )

      expect(withoutAlias).not.toContain('hljs-keyword')
    })

    it('still registers aliases on a lowlight instance the caller supplies', () => {
      const instance = createLowlight(standardLanguages)
      const markdown = '```mycustomjs\nconst answer = 42\n```'

      const html = String(
        unified()
          .use(remarkParse)
          .use(remarkRehype)
          .use(rehypeHighlight, { lowlight: instance, aliases: { javascript: ['mycustomjs'] } })
          .use(rehypeStringify)
          .processSync(markdown),
      )

      expect(html).toContain('hljs-keyword')
    })
  })
})
