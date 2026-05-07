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

  it('emits multiple entries in the order provided', () => {
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
      description: 'First paragraph of context.\n\nSecond paragraph adds more detail.',
      highlights: ['Highlight one.'],
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
})
