/**
 * Every kind of Markdown the API Reference renders, through both pipelines.
 *
 * Each section of `fixtures/kitchen-sink.md` covers one feature: CommonMark,
 * GFM, raw HTML and sanitizing, and Scalar's own additions (alerts, inline
 * Markdown inside HTML tags, details, heading anchors, image removal, external
 * links). The sections are rendered alone and as one document, under each set
 * of options `ScalarMarkdown` passes, and the pipeline must produce the same
 * DOM as the unified renderer it replaced, which `@scalar/markdown` still ships
 * behind `./renderer`. The samples behind `ScalarMarkdown`'s visual snapshot
 * tests run the same way.
 *
 * Where the prototype deliberately differs, because the current pipeline has a
 * bug, the case lives in `KNOWN_DIFFERENCES` and asserts the fixed output.
 *
 * Needs `pnpm build` first: the current pipeline is loaded from `.out/`.
 */
import { readFileSync } from 'node:fs'

import { type DefaultTreeAdapterMap, parseFragment, serialize } from 'parse5'
import { describe, expect, it } from 'vitest'

import { samples } from '../../../packages/components/src/components/ScalarMarkdown/samples'
import * as shipped from '../../../packages/markdown/src/markdown/index'
import * as prototype from '../../../packages/markdown/src/pipeline/index'
// @ts-expect-error -- built JavaScript without type declarations
import * as current from '../.out/baseline.mjs'
// @ts-expect-error -- built JavaScript without type declarations
import * as currentHighlighted from '../.out/baseline-highlighted.mjs'
// @ts-expect-error -- plain JavaScript helper
import { normalize } from '../bench/normalize.mjs'

type Pipeline = {
  htmlFromMarkdown: (markdown: string, options?: Record<string, unknown>) => string
  getHeadings: (markdown: string) => { depth: number; value: string }[]
  splitContent: (markdown: string) => string[]
  isHeading: (node: unknown) => boolean
  textFromNode: (node: unknown) => string
}

const pipelines = { current: current as Pipeline, prototype: prototype as unknown as Pipeline }

/** The heading anchors `ScalarMarkdown` adds with `withAnchors`, written against either pipeline's tree. */
const anchors = (p: Pipeline) => (node: { data?: unknown }) => {
  if (!p.isHeading(node)) return node
  const slug = p.textFromNode(node).toLowerCase().replace(/\s+/g, '-')
  node.data = { hProperties: { id: `tag/planets/description/${slug}` } }
  return node
}

/** The option sets callers pass today. */
const OPTIONS: Record<string, (p: Pipeline) => Record<string, unknown> | undefined> = {
  'ScalarMarkdown default': () => ({ removeTags: ['img', 'picture'] }),
  'ScalarMarkdown withImages': () => ({ removeTags: [] }),
  'ScalarMarkdown withAnchors': (p) => ({
    removeTags: ['img', 'picture'],
    transformType: 'heading',
    transform: anchors(p),
  }),
  'no options': () => undefined,
  'allowTags and removeTags': () => ({ allowTags: ['u', 'mark', 'abbr'], removeTags: ['em', 'img'] }),
}

const fixture = readFileSync(new URL('./fixtures/kitchen-sink.md', import.meta.url), 'utf8')
const sections = fixture
  .split(/^<!-- section: (.+) -->$/m)
  .slice(1)
  .reduce<{ name: string; markdown: string }[]>((list, part, i, parts) => {
    if (i % 2 === 0) list.push({ name: part, markdown: parts[i + 1]!.trim() })
    return list
  }, [])

/**
 * Bugs in the current pipeline that the prototype fixes. Each entry asserts
 * the prototype's output, and that the current pipeline still differs (so the
 * entry is removed once the current pipeline changes).
 */
const KNOWN_DIFFERENCES: Record<string, { reason: string; check: (html: string) => void }> = {
  'Known difference: raw link with a target attribute': {
    reason: 'The current pipeline empties the link and moves its text after it, so it cannot be clicked.',
    check: (html) =>
      expect(html).toContain(
        '<a href="https://example.com/guide" rel="nofollow" target="_blank">integration guide</a>',
      ),
  },
  'Known difference: details with Markdown in the summary': {
    reason: 'The current pipeline re-parses the raw fragment alone and closes <details> before its body.',
    check: (html) =>
      expect(html).toBe(
        '<details>\n<summary>\n<strong>Bold</strong> summary\n</summary>\n<p>\nBody text after a blank line.\n</p>\n</details>',
      ),
  },
  'Known difference: alert followed by a list': {
    reason: 'The current pipeline renders the alert with empty content.',
    check: (html) =>
      expect(html).toMatch(/markdown-alert-content">\n<ul>\n<li>\nFirst point\n<\/li>\n<li>\nSecond point/),
  },
  'Known difference: raw paragraph with a Markdown marker': {
    reason: 'The `_` makes the current pipeline re-parse the text, which trims the space after </code>.',
    check: (html) => expect(html).toContain('<code>OnboardingLink</code> object'),
  },
}

/** Sections the current `splitContent` changes, because it re-serializes them. */
const RESPLIT_BUGS = ['Tables', 'Whitespace-only lines in lists', 'Literals next to non-ASCII text']

const render = (p: Pipeline, markdown: string, option: string) =>
  normalize(p.htmlFromMarkdown(markdown, OPTIONS[option]!(p)))

const cases = sections.flatMap(({ name, markdown }) =>
  Object.keys(OPTIONS).map((option) => ({ name, option, markdown })),
)

describe('kitchen sink', () => {
  it('renders the whole document identically', () => {
    const document = sections
      .filter(({ name }) => !KNOWN_DIFFERENCES[name])
      .map(({ markdown }) => markdown)
      .join('\n\n')
    for (const option of Object.keys(OPTIONS)) {
      expect(render(pipelines.prototype, document, option), option).toBe(render(pipelines.current, document, option))
    }
  })

  it.each(cases.filter(({ name }) => !KNOWN_DIFFERENCES[name]))('$name ($option)', ({ markdown, option }) => {
    expect(render(pipelines.prototype, markdown, option)).toBe(render(pipelines.current, markdown, option))
  })

  it.each(samples.flatMap(({ label, value }) => Object.keys(OPTIONS).map((option) => ({ label, value, option }))))(
    'ScalarMarkdown sample: $label ($option)',
    ({ value, option }) => {
      expect(render(pipelines.prototype, value, option)).toBe(render(pipelines.current, value, option))
    },
  )

  it('extracts the same headings and sections', () => {
    const others = sections.filter(({ name }) => !RESPLIT_BUGS.includes(name)).map((s) => s.markdown)
    for (const markdown of [others.join('\n\n'), ...others, ...samples.map((s) => s.value)]) {
      expect(prototype.getHeadings(markdown)).toEqual(current.getHeadings(markdown))
      expect(prototype.splitContent(markdown).map((s) => normalize(current.htmlFromMarkdown(s)))).toEqual(
        current.splitContent(markdown).map((s: string) => normalize(current.htmlFromMarkdown(s))),
      )
    }
  })

  it('highlights code blocks exactly as the unified renderer did', () => {
    const codeBlocks = (html: string) => {
      const out: { className: string; html: string }[] = []
      const walk = (n: DefaultTreeAdapterMap['parentNode'] | DefaultTreeAdapterMap['childNode']) => {
        if (
          'tagName' in n &&
          n.tagName === 'code' &&
          (n.parentNode as { tagName?: string } | null)?.tagName === 'pre'
        ) {
          out.push({ className: n.attrs.find((a) => a.name === 'class')?.value ?? '', html: serialize(n) })
        }
        if ('childNodes' in n) for (const c of n.childNodes) walk(c)
      }
      walk(parseFragment(html))
      return out
    }
    // Both pipelines highlight with `@scalar/highlight` and neither guesses a language,
    // so every block has to match: labelled, unlabelled and indented.
    const document = sections
      .map(({ markdown }) => markdown)
      .concat(samples.map((s) => s.value))
      .join('\n\n')
    const before = codeBlocks(currentHighlighted.htmlFromMarkdown(document))
    const after = codeBlocks(shipped.htmlFromMarkdown(document))
    expect(after.length).toBeGreaterThan(10)
    expect(after.some((b) => b.html.includes('hljs-'))).toBe(true)
    expect(after).toEqual(before)
  })

  it.each(RESPLIT_BUGS)('fixes a bug in the current pipeline: splitContent keeps %s as written', (name) => {
    // The current pipeline re-serializes each section, which pads a table with an over-long row
    // to an extra, empty column, drops a whitespace-only line that keeps a list tight, and
    // rewrites `**_x_**` as `***x***` (strong inside emphasis, where it was the other way round).
    // Slicing the source renders the section unchanged.
    const { markdown } = sections.find((s) => s.name === name)!
    const unsplit = normalize(current.htmlFromMarkdown(markdown))
    const split = (p: Pipeline) => normalize(current.htmlFromMarkdown(p.splitContent(markdown).join('\n\n')))
    expect(split(pipelines.prototype)).toBe(unsplit)
    expect(split(pipelines.current)).not.toBe(unsplit)
  })

  it.each(Object.entries(KNOWN_DIFFERENCES))('fixes a bug in the current pipeline: %s', (name, { check }) => {
    const { markdown } = sections.find((s) => s.name === name)!
    const html = render(pipelines.prototype, markdown, 'ScalarMarkdown default')
    expect(html).not.toBe(render(pipelines.current, markdown, 'ScalarMarkdown default'))
    check(html)
  })

  it('covers every section of the fixture', () => {
    expect(sections.length).toBeGreaterThan(30)
  })
})
