import { describe, expect, it } from 'vitest'

import { DEFAULT_RELEASE_NOTES_PREAMBLE, type ReleaseNoteEntry, serializeReleaseNotes } from './release-notes'

/** Test-only: `## semver (YYYY-MM-DD)` headings in document order. */
const versionHeadingsInOrder = (markdown: string): string[] =>
  [...markdown.matchAll(/^##\s+(\S+)\s+\(\s*\d{4}-\d{2}-\d{2}\s*\)\s*$/gm)].map((m) => m[1] ?? '')

describe('serializeReleaseNotes', () => {
  it('produces a deterministic markdown document with default preamble', () => {
    const entry: ReleaseNoteEntry = {
      version: '1.0.0',
      date: '2026-01-01',
      title: 'Hello world',
      content: [
        { type: 'paragraph', text: 'Initial release.' },
        { type: 'list', items: ['First feature.', 'Second feature.'], ordered: false },
        {
          type: 'href',
          href: 'https://example.com/release/1.0.0',
          label: 'Read full release notes',
        },
      ],
    }

    const output = serializeReleaseNotes([entry])
    expect(output.startsWith(DEFAULT_RELEASE_NOTES_PREAMBLE.replace(/\s+$/, ''))).toBe(true)
    expect(output).toContain('## 1.0.0 (2026-01-01)')
    expect(output).toContain('### Hello world')
    expect(output).toContain('Initial release.')
    expect(output).toContain('- First feature.')
    expect(output).toContain('[Read full release notes](https://example.com/release/1.0.0)')
    expect(output.endsWith('\n')).toBe(true)
  })

  it('emits multiple entries in the order provided', () => {
    const entries: ReleaseNoteEntry[] = [
      {
        version: '2.0.0',
        date: '2026-02-01',
        title: 'Big release',
        content: [
          { type: 'paragraph', text: 'Lots of changes.' },
          { type: 'list', items: ['Improved A.', 'Polished B.'], ordered: false },
          {
            type: 'href',
            href: 'https://example.com/release/2.0.0',
            label: 'Read full release notes',
          },
        ],
      },
      {
        version: '1.0.0',
        date: '2026-01-01',
        title: 'First release',
      },
    ]

    const serialized = serializeReleaseNotes(entries)
    expect(versionHeadingsInOrder(serialized)).toEqual(['2.0.0', '1.0.0'])
    expect(serialized).toContain('### Big release')
    expect(serialized).toContain('Lots of changes.')
    expect(serialized).toContain('- Improved A.')
    expect(serialized).toContain('### First release')
    expect(serialized.indexOf('## 2.0.0')).toBeLessThan(serialized.indexOf('## 1.0.0'))
  })

  it('joins multi-paragraph descriptions with blank lines in the output', () => {
    const entry: ReleaseNoteEntry = {
      version: '1.0.0',
      date: '2026-01-01',
      title: 'Multi paragraph',
      content: [
        { type: 'paragraph', text: 'First paragraph of context.\n\nSecond paragraph adds more detail.' },
        { type: 'list', items: ['Highlight one.'], ordered: false },
      ],
    }
    const serialized = serializeReleaseNotes([entry], { preamble: '# Test\n' })
    expect(serialized).toContain('First paragraph of context.\n\nSecond paragraph adds more detail.')
    expect(serialized).toContain('- Highlight one.')
  })

  it('omits optional sections when fields are absent', () => {
    const serialized = serializeReleaseNotes([{ version: '1.0.0', date: '2026-01-01', title: 'Just a title' }], {
      preamble: '# Test\n',
    })
    expect(serialized).toContain('### Just a title')
    expect(/\n-\s/.test(serialized)).toBe(false)
    expect(serialized.includes('[Read full release notes]')).toBe(false)
  })

  it('honors a custom preamble', () => {
    const output = serializeReleaseNotes([{ version: '1.0.0', date: '2026-01-01', title: 'Hi' }], {
      preamble: '# Custom preamble',
    })
    expect(output.startsWith('# Custom preamble\n\n## 1.0.0')).toBe(true)
  })

  it('renders paragraph and heading content blocks as markdown headings and copy', () => {
    const serialized = serializeReleaseNotes(
      [
        {
          version: '1.0.0',
          date: '2026-01-01',
          title: 'Rich entry',
          content: [
            { type: 'heading', text: 'A subsection' },
            { type: 'paragraph', text: 'First paragraph of context.' },
            { type: 'heading', text: 'A smaller heading', level: 4 },
            { type: 'paragraph', text: 'Second paragraph adds more detail.' },
          ],
        },
      ],
      { preamble: '# Test\n' },
    )
    expect(serialized).toContain('### A subsection')
    expect(serialized).toContain('First paragraph of context.')
    expect(serialized).toContain('#### A smaller heading')
    expect(serialized).toContain('Second paragraph adds more detail.')
  })

  it('renders href blocks as markdown anchors', () => {
    const serialized = serializeReleaseNotes(
      [
        {
          version: '1.0.0',
          date: '2026-01-01',
          title: 'With link',
          content: [
            {
              type: 'href',
              href: 'https://example.com/changelog#100',
              label: 'See changelog',
            },
          ],
        },
      ],
      { preamble: '# Test\n' },
    )
    expect(serialized).toContain('[See changelog](https://example.com/changelog#100)')
  })

  it('renders bullet and numbered lists from content blocks', () => {
    const serialized = serializeReleaseNotes(
      [
        {
          version: '1.0.0',
          date: '2026-01-01',
          title: 'Lists',
          content: [
            { type: 'list', items: ['Apple', 'Banana'], ordered: false },
            { type: 'list', items: ['Step one', 'Step two'], ordered: true },
          ],
        },
      ],
      { preamble: '# Test\n' },
    )
    expect(serialized).toContain('- Apple')
    expect(serialized).toContain('- Banana')
    expect(serialized).toContain('1. Step one')
    expect(serialized).toContain('2. Step two')
  })

  it('renders image blocks as markdown images with optional captions', () => {
    const serialized = serializeReleaseNotes(
      [
        {
          version: '1.0.0',
          date: '2026-01-01',
          title: 'Image',
          content: [
            { type: 'image', src: 'https://example.com/a.png', alt: 'Alt text' },
            {
              type: 'image',
              src: 'https://example.com/b.png',
              alt: 'Alt text',
              caption: 'A short caption.',
            },
          ],
        },
      ],
      { preamble: '# Test\n' },
    )
    expect(serialized).toContain('![Alt text](https://example.com/a.png)')
    expect(serialized).toContain('![Alt text](https://example.com/b.png)')
    expect(serialized).toContain('_A short caption._')
  })

  it('renders video blocks as inline video tags with the requested attributes', () => {
    const serialized = serializeReleaseNotes(
      [
        {
          version: '1.0.0',
          date: '2026-01-01',
          title: 'Video',
          content: [
            {
              type: 'video',
              src: 'https://example.com/demo.mp4',
              poster: 'https://example.com/poster.png',
              autoplay: true,
              loop: true,
              muted: true,
              caption: 'Demo of the new feature.',
            },
          ],
        },
      ],
      { preamble: '# Test\n' },
    )
    expect(serialized).toContain('<video src="https://example.com/demo.mp4"')
    expect(serialized).toContain('style="max-width: 100%; width: 100%; height: auto;"')
    expect(serialized).toContain('poster="https://example.com/poster.png"')
    expect(serialized).toContain('autoplay')
    expect(serialized).toContain('loop')
    expect(serialized).toContain('muted')
    expect(serialized).toContain('controls')
    expect(serialized).toContain('playsinline')
    expect(serialized).toContain('_Demo of the new feature._')
  })

  it('omits controls on a video block when explicitly disabled', () => {
    const serialized = serializeReleaseNotes(
      [
        {
          version: '1.0.0',
          date: '2026-01-01',
          title: 'Video',
          content: [{ type: 'video', src: 'https://example.com/demo.mp4', controls: false }],
        },
      ],
      { preamble: '# Test\n' },
    )
    expect(serialized).not.toContain('controls')
    expect(serialized).toContain('style="max-width: 100%; width: 100%; height: auto;"')
    expect(serialized).toContain('playsinline')
  })
})
