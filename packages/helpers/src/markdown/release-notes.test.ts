import { describe, expect, it } from 'vitest'

import {
  DEFAULT_RELEASE_NOTES_PREAMBLE,
  type ReleaseNoteEntry,
  parseReleaseNotes,
  serializeReleaseNotes,
} from './release-notes'

const sampleMarkdown = `# Release notes

<!-- Generated -->

## 3.5.1 (2026-04-25)

### Smoother request runs and a friendlier slugger

A small follow-up to the 3.5.0 release that polishes a couple of edges around running requests and generating route slugs.

- Pending edits are now flushed before a request runs, so the request that goes out always matches what you see in the editor.
- Switched to our own slug generator for cleaner, more predictable URLs.

[Read full release notes](https://github.com/scalar/scalar/releases/tag/%40scalar%2Fapi-client%403.5.1)

## 3.2.1 (2026-03-26)

### Header support for the web layout

The standalone web client now renders the workspace header so navigation is consistent with the app and modal layouts.

[Read full release notes](https://github.com/scalar/scalar/releases/tag/%40scalar%2Fapi-client%403.2.1)
`

describe('parseReleaseNotes', () => {
  it('parses a multi-entry document into structured release notes', () => {
    const result = parseReleaseNotes(sampleMarkdown)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      version: '3.5.1',
      date: '2026-04-25',
      title: 'Smoother request runs and a friendlier slugger',
      description:
        'A small follow-up to the 3.5.0 release that polishes a couple of edges around running requests and generating route slugs.',
      highlights: [
        'Pending edits are now flushed before a request runs, so the request that goes out always matches what you see in the editor.',
        'Switched to our own slug generator for cleaner, more predictable URLs.',
      ],
      href: 'https://github.com/scalar/scalar/releases/tag/%40scalar%2Fapi-client%403.5.1',
    })
    expect(result[1]).toEqual({
      version: '3.2.1',
      date: '2026-03-26',
      title: 'Header support for the web layout',
      description:
        'The standalone web client now renders the workspace header so navigation is consistent with the app and modal layouts.',
      href: 'https://github.com/scalar/scalar/releases/tag/%40scalar%2Fapi-client%403.2.1',
    })
  })

  it('returns an empty array when the document has no version headings', () => {
    expect(parseReleaseNotes('# Release notes\n\nNothing yet.')).toEqual([])
  })

  it('skips entries that are missing a title heading', () => {
    const markdown = `# Release notes

## 1.0.0 (2026-01-01)

A description without a title heading.

## 2.0.0 (2026-02-01)

### Has a title

The good entry.
`
    const result = parseReleaseNotes(markdown)
    expect(result.map((entry) => entry.version)).toEqual(['2.0.0'])
  })

  it('joins multi-paragraph descriptions with two newlines', () => {
    const markdown = `## 1.0.0 (2026-01-01)

### Multi paragraph

First paragraph of context.

Second paragraph adds more detail.

- Highlight one.
`
    const [entry] = parseReleaseNotes(markdown)
    expect(entry?.description).toBe('First paragraph of context.\n\nSecond paragraph adds more detail.')
    expect(entry?.highlights).toEqual(['Highlight one.'])
  })

  it('omits optional fields when they are not present in the source', () => {
    const markdown = `## 1.0.0 (2026-01-01)

### Just a title
`
    const [entry] = parseReleaseNotes(markdown)
    expect(entry).toEqual({
      version: '1.0.0',
      date: '2026-01-01',
      title: 'Just a title',
    })
  })
})

describe('serializeReleaseNotes', () => {
  it('produces a deterministic markdown document with default preamble', () => {
    const entry: ReleaseNoteEntry = {
      version: '1.0.0',
      date: '2026-01-01',
      title: 'Hello world',
      description: 'Initial release.',
      highlights: ['First feature.', 'Second feature.'],
      href: 'https://example.com/release/1.0.0',
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

  it('round-trips a generated document without losing information', () => {
    const entries: ReleaseNoteEntry[] = [
      {
        version: '2.0.0',
        date: '2026-02-01',
        title: 'Big release',
        description: 'Lots of changes.',
        highlights: ['Improved A.', 'Polished B.'],
        href: 'https://example.com/release/2.0.0',
      },
      {
        version: '1.0.0',
        date: '2026-01-01',
        title: 'First release',
      },
    ]

    const serialized = serializeReleaseNotes(entries)
    const parsed = parseReleaseNotes(serialized)
    expect(parsed).toEqual(entries)
  })

  it('honors a custom preamble', () => {
    const output = serializeReleaseNotes([{ version: '1.0.0', date: '2026-01-01', title: 'Hi' }], {
      preamble: '# Custom preamble',
    })
    expect(output.startsWith('# Custom preamble\n\n## 1.0.0')).toBe(true)
  })
})
