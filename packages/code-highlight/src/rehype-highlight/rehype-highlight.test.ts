import type { createLowlight } from 'lowlight'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'

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
})
