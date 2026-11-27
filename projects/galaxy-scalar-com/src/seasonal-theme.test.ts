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

    describe('National Hot Dog Day', () => {
      // The third Wednesday of July, which lands on a different date every year.
      it.each([
        ['2026', '2026-07-15T12:00:00Z'],
        ['2027', '2027-07-21T12:00:00Z'],
        ['2028', '2028-07-19T12:00:00Z'],
      ])('uses the Hot Dog Day theme on the third Wednesday of July %s', (_, isoDate) => {
        expect(getSeasonalTheme(new Date(isoDate))).toBe('hotDogDay')
      })

      it('lasts the whole day', () => {
        expect(getSeasonalTheme(new Date('2026-07-15T00:00:00Z'))).toBe('hotDogDay')
        expect(getSeasonalTheme(new Date('2026-07-15T23:59:59Z'))).toBe('hotDogDay')
      })

      it.each([
        ['the day before', '2026-07-14T23:59:59Z'],
        ['the day after', '2026-07-16T00:00:00Z'],
        ['the second Wednesday of July', '2026-07-08T12:00:00Z'],
        ['the fourth Wednesday of July', '2026-07-22T12:00:00Z'],
        ['the third Wednesday of another month', '2026-06-17T12:00:00Z'],
      ])('falls back to the default theme on %s', (_, isoDate) => {
        expect(getSeasonalTheme(new Date(isoDate))).toBe('default')
      })

      it('starts at local midnight in time zones ahead of UTC', () => {
        // 15:30 UTC on July 14 is already 00:30 on July 15 in Tokyo.
        const tokyoJustAfterMidnight = new Date('2026-07-14T15:30:00Z')

        expect(getSeasonalTheme(tokyoJustAfterMidnight)).toBe('default')
        expect(getSeasonalTheme(tokyoJustAfterMidnight, { timeZone: 'Asia/Tokyo' })).toBe('hotDogDay')
      })

      it('keeps going until local midnight in time zones behind UTC', () => {
        // 02:00 UTC on July 16 is still 19:00 on July 15 in Los Angeles.
        const losAngelesEvening = new Date('2026-07-16T02:00:00Z')

        expect(getSeasonalTheme(losAngelesEvening)).toBe('default')
        expect(getSeasonalTheme(losAngelesEvening, { timeZone: 'America/Los_Angeles' })).toBe('hotDogDay')
      })
    })

    describe('with an nth weekday celebration', () => {
      it('reads the year in the visitor time zone', () => {
        // The first Friday of January is January 1 in 2027 but January 2 in 2026. At 12:00 UTC on
        // December 31 2026 it is already January 1 2027 in Auckland, so only the local year matches.
        const celebrations: Celebration[] = [
          { name: 'First Friday', theme: 'moon', on: { month: 1, weekday: 5, nth: 1 } },
        ]
        const aucklandNewYear = new Date('2026-12-31T12:00:00Z')

        expect(getSeasonalTheme(aucklandNewYear, { celebrations })).toBe('default')
        expect(getSeasonalTheme(aucklandNewYear, { celebrations, timeZone: 'Pacific/Auckland' })).toBe('moon')
      })

      it('matches the fifth weekday in a month that has one', () => {
        // July 2026 has five Fridays: the 3rd, 10th, 17th, 24th and 31st.
        const celebrations: Celebration[] = [
          { name: 'Fifth Friday', theme: 'mars', on: { month: 7, weekday: 5, nth: 5 } },
        ]

        expect(getSeasonalTheme(new Date('2026-07-31T12:00:00Z'), { celebrations })).toBe('mars')
        expect(getSeasonalTheme(new Date('2026-07-24T12:00:00Z'), { celebrations })).toBe('default')
      })

      it('never matches a fifth weekday that does not exist', () => {
        // February 2026 has exactly four Wednesdays: the 4th, 11th, 18th and 25th.
        const celebrations: Celebration[] = [
          { name: 'Fifth Wednesday', theme: 'mars', on: { month: 2, weekday: 3, nth: 5 } },
        ]

        for (let day = 1; day <= 28; day++) {
          const isoDate = `2026-02-${String(day).padStart(2, '0')}T12:00:00Z`
          expect(getSeasonalTheme(new Date(isoDate), { celebrations })).toBe('default')
        }
        // Nor does it spill over into the following month.
        expect(getSeasonalTheme(new Date('2026-03-04T12:00:00Z'), { celebrations })).toBe('default')
      })

      it('matches the first weekday when the month starts on that weekday', () => {
        // April 1 2026 is a Wednesday.
        const celebrations: Celebration[] = [
          { name: 'First Wednesday', theme: 'moon', on: { month: 4, weekday: 3, nth: 1 } },
        ]

        expect(getSeasonalTheme(new Date('2026-04-01T12:00:00Z'), { celebrations })).toBe('moon')
        expect(getSeasonalTheme(new Date('2026-04-08T12:00:00Z'), { celebrations })).toBe('default')
      })

      it('can sit alongside window celebrations', () => {
        const celebrations: Celebration[] = [
          { name: 'Window', theme: 'moon', start: { month: 5, day: 1 }, end: { month: 5, day: 7 } },
          { name: 'Weekday', theme: 'mars', on: { month: 5, weekday: 3, nth: 3 } },
        ]

        expect(getSeasonalTheme(new Date('2026-05-04T12:00:00Z'), { celebrations })).toBe('moon')
        expect(getSeasonalTheme(new Date('2026-05-20T12:00:00Z'), { celebrations })).toBe('mars')
        expect(getSeasonalTheme(new Date('2026-05-13T12:00:00Z'), { celebrations })).toBe('default')
      })
    })

    it('falls back to the default theme when there are no celebrations', () => {
      expect(getSeasonalTheme(new Date('2026-10-15T12:00:00Z'), { celebrations: [] })).toBe('default')
    })
  })
})
