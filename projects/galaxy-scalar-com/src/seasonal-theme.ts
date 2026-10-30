import type { ApiReferenceConfiguration } from '@scalar/hono-api-reference'

/**
 * A theme id the API reference configuration accepts.
 *
 * Derived from the configuration type so a celebration can only name a theme that exists.
 */
type ThemeId = NonNullable<ApiReferenceConfiguration['theme']>

/**
 * A calendar day that recurs every year. `month` runs from 1 (January) to 12 (December).
 */
type MonthDay = {
  month: number
  day: number
}

/**
 * A calendar day with its year, as the visitor sees it. The year matters for celebrations whose
 * date moves around the calendar, like "the third Wednesday of July".
 */
type LocalDate = MonthDay & {
  year: number
}

/**
 * The nth weekday of a month, for example the third Wednesday of July.
 *
 * - `month` runs from 1 (January) to 12 (December).
 * - `weekday` runs from 0 (Sunday) to 6 (Saturday), matching `Date.prototype.getDay`.
 * - `nth` runs from 1 (the first) to 5 (the fifth). Not every month has a fifth of every weekday.
 */
type NthWeekday = {
  month: number
  weekday: number
  nth: number
}

/**
 * A celebration that swaps the default theme while it is on.
 *
 * It is either:
 * - a window from `start` to `end`, both inclusive. When `end` comes before `start` in the
 *   calendar, the window wraps across the new year (for example, December 20 to January 5).
 * - a single day `on` the nth weekday of a month, for celebrations whose date moves every year.
 */
export type Celebration =
  | {
      name: string
      theme: ThemeId
      start: MonthDay
      end: MonthDay
    }
  | {
      name: string
      theme: ThemeId
      on: NthWeekday
    }

/**
 * The celebrations galaxy.scalar.com dresses up for. Add an entry here to add one.
 */
const CELEBRATIONS: readonly Celebration[] = [
  {
    name: 'Halloween',
    theme: 'halloween',
    start: { month: 10, day: 1 },
    end: { month: 10, day: 31 },
  },
]

/** The theme used outside every celebration. */
const FALLBACK_THEME: ThemeId = 'default'

/**
 * Read the calendar date of `date` in the given IANA time zone.
 *
 * An unknown time zone makes `Intl.DateTimeFormat` throw, so we fall back to UTC rather than
 * failing the whole page over a cosmetic choice.
 */
const getLocalDate = (date: Date, timeZone: string): LocalDate => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(date)
    const year = Number(parts.find((part) => part.type === 'year')?.value)
    const month = Number(parts.find((part) => part.type === 'month')?.value)
    const day = Number(parts.find((part) => part.type === 'day')?.value)

    if (Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)) {
      return { year, month, day }
    }
  } catch {
    // Fall through to UTC below.
  }

  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}

/** Turn a month and day into a number that sorts in calendar order, for example October 31 is 1031. */
const toOrdinal = ({ month, day }: MonthDay): number => month * 100 + day

/** Whether `today` falls inside the inclusive window, including windows that wrap across the new year. */
const isWithinWindow = (today: MonthDay, { start, end }: { start: MonthDay; end: MonthDay }): boolean => {
  const current = toOrdinal(today)
  const from = toOrdinal(start)
  const to = toOrdinal(end)

  return from <= to ? current >= from && current <= to : current >= from || current <= to
}

/**
 * Find the day of the month that is the nth weekday of that month in a given year, or `undefined`
 * when the month has no such day (for example, a fifth Wednesday in a month with only four).
 *
 * The dates are built with `Date.UTC` and read back with the UTC getters, so the time zone of the
 * machine running this cannot nudge them onto a neighbouring day. The visitor's own time zone has
 * already been applied by the time we know which year and month to look at.
 *
 * @example
 * getNthWeekdayOfMonth(2026, { month: 7, weekday: 3, nth: 3 }) // 15, the third Wednesday of July 2026
 * getNthWeekdayOfMonth(2026, { month: 2, weekday: 3, nth: 5 }) // undefined, February 2026 has four
 */
const getNthWeekdayOfMonth = (year: number, { month, weekday, nth }: NthWeekday): number | undefined => {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  // Step forward from the 1st to the first matching weekday, then whole weeks from there.
  const day = 1 + ((weekday - firstWeekday + 7) % 7) + (nth - 1) * 7
  // Day 0 of the next month is the last day of this one.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  return nth >= 1 && day <= daysInMonth ? day : undefined
}

/** Whether the celebration is on for `today`, whichever way its date is defined. */
const isCelebrating = (today: LocalDate, celebration: Celebration): boolean => {
  if ('on' in celebration) {
    const { on } = celebration

    return today.month === on.month && today.day === getNthWeekdayOfMonth(today.year, on)
  }

  return isWithinWindow(today, celebration)
}

/**
 * Pick the theme for a given moment: the first celebration that is on that day, or `'default'`
 * when none is.
 *
 * The day is read in `timeZone` (UTC unless told otherwise), because a celebration is a calendar
 * date for the person looking at the page. In UTC, Halloween would end at 8pm on October 31 in
 * New York, right in the middle of trick-or-treating.
 *
 * @example
 * getSeasonalTheme(new Date('2026-10-15T12:00:00Z')) // 'halloween'
 * getSeasonalTheme(new Date('2026-11-01T03:00:00Z'), { timeZone: 'America/New_York' }) // 'halloween'
 */
export const getSeasonalTheme = (
  date: Date,
  { timeZone = 'UTC', celebrations = CELEBRATIONS }: { timeZone?: string; celebrations?: readonly Celebration[] } = {},
): ThemeId => {
  const today = getLocalDate(date, timeZone)

  return celebrations.find((celebration) => isCelebrating(today, celebration))?.theme ?? FALLBACK_THEME
}
