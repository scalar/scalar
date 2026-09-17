import type { Nodes } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'

import { createDescriptionParser } from './parse-description'

const serializer = unified().use(remarkGfm).use(remarkStringify, { bullet: '-' })
const stringify = async (value: string): Promise<string> =>
  serializer.stringify({ type: 'root', children: await createDescriptionParser()()(value) })

const identifiers = (node: Nodes): string[] => [
  ...('identifier' in node ? [node.identifier] : []),
  ...('children' in node ? node.children.flatMap(identifiers) : []),
]

describe('parse-description', () => {
  it('preserves Markdown blocks, inline syntax, and code without HTML conversion', async () => {
    const value =
      '# Heading\n\n**Bold** and *italic* with `a<b>`.\n\n- first\n  - nested\n\n```unknown-language\n<div>literal & content</div>\n```\n\n| A | B |\n| - | - |\n| one | two |\n'
    expect(await stringify(value)).toBe(
      '# Heading\n\n**Bold** and *italic* with `a<b>`.\n\n- first\n  - nested\n\n```unknown-language\n<div>literal & content</div>\n```\n\n| A   | B   |\n| --- | --- |\n| one | two |\n',
    )
  })

  it('removes images and neutralizes unsafe links', async () => {
    expect(
      await stringify(
        '![hidden](https://example.com/image.png) [safe](https://example.com) [unsafe](javascript:alert)',
      ),
    ).toBe('[safe](https://example.com) [unsafe]()\n')
  })

  it('converts raw HTML and strips dangerous elements while retaining inline Markdown', async () => {
    expect(
      await stringify('<p>**Hello** <em>world</em></p><script>alert(1)</script><style>bad</style><img src="x">'),
    ).toBe('**Hello***world*\n')
  })

  it('retains Scalar alerts', async () => {
    expect(await stringify('> [!NOTE]\n> Remember **this**.')).toBe('Remember **this**.\n')
    expect(await stringify('> [!SUCCESS]\n> Done.')).toBe('Done.\n')
    expect(await stringify('> [!note]\n> Remember.')).toBe('Remember.\n')
    expect(await stringify('> [!WaRnInG]\n> Careful.')).toBe('Careful.\n')
  })

  it('removes empty image wrappers without leaving Markdown artifacts', async () => {
    expect(await stringify('**![hidden](https://example.com/image.png)**')).toBe('')
    expect(await stringify('[![hidden](https://example.com/image.png)](https://example.com)')).toBe('')
    expect(await stringify('> - ***![hidden](https://example.com/image.png)***')).toBe('')
    expect(await stringify('# ![hidden](https://example.com/image.png)')).toBe('')
    expect(await stringify('**Keep ![hidden](https://example.com/image.png) this**')).toBe('**Keep  this**\n')
  })

  it('isolates definitions within a page and keeps namespaces independent of render order', async () => {
    const descriptions = createDescriptionParser()
    const render = descriptions()
    const a = '[read][docs]\n\n[docs]: https://a.example'
    const b = '[read][docs]\n\n[docs]: https://b.example'
    const first = await render(a)
    const second = await render(b)
    expect(first.flatMap(identifiers)).toStrictEqual(['description-0-docs', 'description-0-docs'])
    expect(second.flatMap(identifiers)).toStrictEqual(['description-1-docs', 'description-1-docs'])
    expect(await descriptions()(b)).toStrictEqual(await createDescriptionParser()()(b))
    expect(serializer.stringify({ type: 'root', children: [...first, ...second] })).toBe(
      '[read][description-0-docs]\n\n[description-0-docs]: https://a.example\n\n[read][description-1-docs]\n\n[description-1-docs]: https://b.example\n',
    )
  })

  it('isolates footnotes and repeated fragments in concurrent renders', async () => {
    const descriptions = createDescriptionParser()
    const content = 'Text[^note].\n\n[^note]: Footnote.'
    const a = descriptions()
    const b = descriptions()
    const [first, independent] = await Promise.all([a(content), b(content)])
    const repeated = await a(content)
    expect(first).toStrictEqual(independent)
    expect(first.flatMap(identifiers)).toStrictEqual(['description-0-note', 'description-0-note'])
    expect(repeated.flatMap(identifiers)).toStrictEqual(['description-1-note', 'description-1-note'])
  })
  it('removes image-only definitions and unused footnotes', async () => {
    expect(
      await stringify(
        '![hidden][image]\n\n[image]: https://example.com/hidden.png\n\n[^unused]: [unused][link]\n\n[link]: https://example.com/unused',
      ),
    ).toBe('')
  })
})
