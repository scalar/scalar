import { describe, expect, it } from 'vitest'

import {
  aggregateMonthly,
  formatEntry,
  isBot,
  renderSvg,
  resolveRange,
  selectTop,
  updateReadme,
} from './generate-monthly-contributors'

const range = resolveRange('2026-07')

describe('resolveRange', () => {
  it('defaults to the previous full month', () => {
    const result = resolveRange(undefined, new Date('2026-08-11T00:00:00Z'))

    expect(result.slug).toBe('2026-07')
    expect(result.label).toBe('July 2026')
    expect(result.since).toBe('2026-07-01T00:00:00.000Z')
    expect(result.until).toBe('2026-08-01T00:00:00.000Z')
  })

  it('handles the January rollover into the previous year', () => {
    const result = resolveRange(undefined, new Date('2026-01-05T00:00:00Z'))

    expect(result.slug).toBe('2025-12')
    expect(result.label).toBe('December 2025')
  })

  it('exposes unix bounds for week bucketing', () => {
    expect(range.sinceUnix).toBe(Date.UTC(2026, 6, 1) / 1000)
    expect(range.untilUnix).toBe(Date.UTC(2026, 7, 1) / 1000)
  })
})

describe('isBot', () => {
  it('keeps regular users, including staff', () => {
    expect(isBot('hanspagel', 'User')).toBe(false)
  })

  it('drops accounts of type Bot', () => {
    expect(isBot('some-app', 'Bot')).toBe(true)
  })

  it('drops logins ending in [bot]', () => {
    expect(isBot('renovate[bot]', 'User')).toBe(true)
  })

  it('drops AI agents and bot-like accounts on the denylist', () => {
    expect(isBot('scalar-release-bot', 'User')).toBe(true)
    expect(isBot('claude', 'User')).toBe(true)
    expect(isBot('junie-agent', 'User')).toBe(true)
  })
})

describe('aggregateMonthly', () => {
  const inMonth = range.sinceUnix + 60
  const beforeMonth = range.sinceUnix - 60

  it('sums only the weeks inside the month and skips bots', () => {
    const contributors = aggregateMonthly(
      [
        {
          author: { login: 'human', type: 'User' },
          weeks: [
            { w: inMonth, a: 100, d: 10, c: 3 },
            { w: beforeMonth, a: 999, d: 99, c: 9 },
          ],
        },
        { author: { login: 'ci[bot]', type: 'Bot' }, weeks: [{ w: inMonth, a: 1, d: 1, c: 5 }] },
        { author: null, weeks: [{ w: inMonth, a: 1, d: 1, c: 5 }] },
      ],
      range,
    )

    expect(contributors).toEqual([{ login: 'human', commits: 3, additions: 100, deletions: 10 }])
  })
})

describe('selectTop', () => {
  it('ranks by commits, then additions, then login', () => {
    const top = selectTop(
      [
        { login: 'b', commits: 5, additions: 10, deletions: 0 },
        { login: 'a', commits: 5, additions: 99, deletions: 0 },
        { login: 'c', commits: 9, additions: 1, deletions: 0 },
      ],
      2,
    )

    expect(top.map((contributor) => contributor.login)).toEqual(['c', 'a'])
  })
})

describe('formatEntry', () => {
  it('formats a banner line with rank, commits and thousands separators', () => {
    expect(formatEntry({ login: 'hanspagel', commits: 45, additions: 14224, deletions: 1382 }, 1)).toBe(
      '#1 hanspagel - 45 commits 14,224 ++ 1,382 --',
    )
  })
})

describe('renderSvg', () => {
  const entries = ['#1 a - 1 commits 1 ++ 1 --', '#2 b - 1 commits 1 ++ 1 --', '#3 c - 1 commits 1 ++ 1 --']

  it('renders the animated planes with fresh data', () => {
    const svg = renderSvg(entries, 'dark')

    expect(svg).toContain('<foreignObject')
    expect(svg).toContain('@keyframes bannermove')
    // Odd ranks go on banner one, even ranks on banner two.
    expect(svg).toContain('content: "#1 a - 1 commits 1 ++ 1 --"')
    expect(svg).toContain('content: "#3 c - 1 commits 1 ++ 1 --"')
    expect(svg).toContain('content: "#2 b - 1 commits 1 ++ 1 --"')
    // Dark theme text color.
    expect(svg).toContain('#e7e7e7')
  })

  it('keeps the ASCII plane intact with its backslashes', () => {
    const svg = renderSvg(entries, 'light')

    expect(svg).toContain('(..)')
    expect(svg).toContain('\\_|__/--,')
    expect(svg).toContain('#1b1b1b')
  })
})

describe('updateReadme', () => {
  it('replaces the block between the markers and bumps the cache-busting query', () => {
    const readme = [
      'before',
      '<!-- monthly-contributors:start -->',
      'old',
      '<!-- monthly-contributors:end -->',
      'after',
    ].join('\n')

    const result = updateReadme(readme, range)

    expect(result).toContain('top-contributors-light.svg?v=2026-07#gh-light-mode-only')
    expect(result).toContain('top-contributors-dark.svg?v=2026-07#gh-dark-mode-only')
    expect(result).toContain('before')
    expect(result).toContain('after')
    expect(result).not.toContain('old')
  })

  it('throws when the markers are missing', () => {
    expect(() => updateReadme('no markers here', range)).toThrow()
  })
})
