import { describe, expect, it } from 'vitest'

import { humanDiff } from './humanDiff'

describe('humanDiff', () => {
  it('returns just now for the first 45 seconds', async () => {
    expect(humanDiff(new Date().getTime() - 44 * 1000)).toBe('just now')
  })

  it('returns singular for 1 minute', async () => {
    expect(humanDiff(new Date().getTime() - 60 * 1000)).toBe('1 minute ago')
  })

  it('returns plural for more than 1 minute', async () => {
    expect(humanDiff(new Date().getTime() - 2 * 60 * 1000)).toBe(
      '2 minutes ago',
    )
  })

  it('returns 1 hour', async () => {
    expect(humanDiff(new Date().getTime() - 60 * 60 * 1000)).toBe('1 hour ago')
  })

  it('returns 2 hours', async () => {
    expect(humanDiff(new Date().getTime() - 2 * 60 * 60 * 1000)).toBe(
      '2 hours ago',
    )
  })

  it('returns 1 day', async () => {
    expect(humanDiff(new Date().getTime() - 24 * 60 * 60 * 1000)).toBe(
      '1 day ago',
    )
  })

  it('returns 2 days', async () => {
    expect(humanDiff(new Date().getTime() - 2 * 24 * 60 * 60 * 1000)).toBe(
      '2 days ago',
    )
  })

  it('returns 1 month', async () => {
    expect(humanDiff(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)).toBe(
      '1 month ago',
    )
  })

  it('returns 2 months', async () => {
    expect(humanDiff(new Date().getTime() - 2 * 30 * 24 * 60 * 60 * 1000)).toBe(
      '2 months ago',
    )
  })

  it('returns more than a year ago', async () => {
    expect(
      humanDiff(new Date().getTime() - 2 * 365 * 24 * 60 * 60 * 1000),
    ).toBe('more than a year ago')
  })
})
