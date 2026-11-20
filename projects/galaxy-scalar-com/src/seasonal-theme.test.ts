import { describe, expect, it } from 'vitest'

import { type Celebration, getSeasonalTheme } from './seasonal-theme'

describe('seasonal-theme', () => {
  describe('getSeasonalTheme', () => {
    it.each([
      ['the first day of Halloween', '2026-10-01T00:00:00Z'],
      ['the middle of Halloween', '2026-10-15T12:00:00Z'],
      ['the last day of Halloween', '2026-10-31T23:59:59Z'],
    ])('uses the Halloween theme on %s', (_, isoDate) => {
      expect(getSeasonalTheme(new Date(isoDate))).toBe('halloween')
    })

    it.each([
      ['the day before Halloween starts', '2026-09-30T23:59:59Z'],
      ['the day after Halloween ends', '2026-11-01T00:00:00Z'],
      ['a day with no celebration', '2026-03-14T12:00:00Z'],
    ])('falls back to the default theme on %s', (_, isoDate) => {
      expect(getSeasonalTheme(new Date(isoDate))).toBe('default')
    })

    it.each([
      ['September 12, the 256th day of a leap year', '2028-09-12T00:00:00Z'],
      ['September 13, the 256th day of a common year', '2026-09-13T23:59:59Z'],
    ])("uses the Programmer's Day theme on %s", (_, isoDate) => {
      expect(getSeasonalTheme(new Date(isoDate))).toBe('programmersDay')
    })

    it.each([
      ["the day before Programmer's Day", '2026-09-11T23:59:59Z'],
      ["the day after Programmer's Day", '2026-09-14T00:00:00Z'],
    ])('falls back to the default theme on %s', (_, isoDate) => {
      expect(getSeasonalTheme(new Date(isoDate))).toBe('default')
    })

    it('recurs every year', () => {
      expect(getSeasonalTheme(new Date('2031-10-31T12:00:00Z'))).toBe('halloween')
    })

    it('reads the day in the given time zone', () => {
      // 03:00 UTC on November 1 is still 23:00 on October 31 in New York.
      const lateHalloweenEvening = new Date('2026-11-01T03:00:00Z')

      expect(getSeasonalTheme(lateHalloweenEvening)).toBe('default')
      expect(getSeasonalTheme(lateHalloweenEvening, { timeZone: 'America/New_York' })).toBe('halloween')
    })

    it('starts at local midnight in time zones ahead of UTC', () => {
      // 15:00 UTC on September 30 is already 00:00 on October 1 in Tokyo.
      const tokyoMidnight = new Date('2026-09-30T15:00:00Z')

      expect(getSeasonalTheme(tokyoMidnight)).toBe('default')
      expect(getSeasonalTheme(tokyoMidnight, { timeZone: 'Asia/Tokyo' })).toBe('halloween')
    })

    it('falls back to UTC for an unknown time zone', () => {
      expect(getSeasonalTheme(new Date('2026-10-01T00:30:00Z'), { timeZone: 'Not/A_Zone' })).toBe('halloween')
      expect(getSeasonalTheme(new Date('2026-09-30T23:30:00Z'), { timeZone: 'Not/A_Zone' })).toBe('default')
    })

    describe('with a window that wraps across the new year', () => {
      // A test-only list, so no make-believe celebration ships with the site.
      const celebrations: Celebration[] = [
        { name: 'Winter', theme: 'deepSpace', start: { month: 12, day: 20 }, end: { month: 1, day: 5 } },
      ]

      it.each([
        ['the first day', '2026-12-20T00:00:00Z'],
        ['December 31', '2026-12-31T23:59:59Z'],
        ['January 1', '2027-01-01T00:00:00Z'],
        ['the last day', '2027-01-05T23:59:59Z'],
      ])('uses the celebration theme on %s', (_, isoDate) => {
        expect(getSeasonalTheme(new Date(isoDate), { celebrations })).toBe('deepSpace')
      })

      it.each([
        ['the day before it starts', '2026-12-19T23:59:59Z'],
        ['the day after it ends', '2027-01-06T00:00:00Z'],
        ['midsummer', '2026-07-01T12:00:00Z'],
      ])('falls back to the default theme on %s', (_, isoDate) => {
        expect(getSeasonalTheme(new Date(isoDate), { celebrations })).toBe('default')
      })
    })

    it('uses the first matching celebration when windows overlap', () => {
      const celebrations: Celebration[] = [
        { name: 'First', theme: 'moon', start: { month: 5, day: 1 }, end: { month: 5, day: 31 } },
        { name: 'Second', theme: 'mars', start: { month: 5, day: 10 }, end: { month: 5, day: 20 } },
      ]

      expect(getSeasonalTheme(new Date('2026-05-15T12:00:00Z'), { celebrations })).toBe('moon')
    })

    it('falls back to the default theme when there are no celebrations', () => {
      expect(getSeasonalTheme(new Date('2026-10-15T12:00:00Z'), { celebrations: [] })).toBe('default')
    })
  })
})
