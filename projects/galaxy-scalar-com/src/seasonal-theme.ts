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

/** A calendar day together with its year, which a day-of-year celebration needs. */
type CalendarDate = MonthDay & {
  year: number
}

/**
 * A celebration that swaps the default theme while it is on. It is one of:
 *
 * - a window from `start` to `end`. Both are inclusive. When `end` comes before `start` in the
 *   calendar, the window wraps across the new year (for example, December 20 to January 5).
 * - a single day of the year, `on: { dayOfYear }`, counting January 1 as day 1. Its date moves
 *   with leap years, so it cannot be written as a fixed month and day.
 */
export type Celebration = {
  name: string
  theme: ThemeId
} & ({ start: MonthDay; end: MonthDay } | { on: { dayOfYear: number } })

/**
 * The celebrations galaxy.scalar.com dresses up for. Add an entry here to add one.
 */
const CELEBRATIONS: readonly Celebration[] = [
  {
    // Programmer's Day is the 256th day of the year: September 13, or September 12 in leap years
    name: "Programmer's Day",
    theme: 'programmersDay',
    on: { dayOfYear: 256 },
  },
  {
    name: 'Halloween',
    theme: 'halloween',
    start: { month: 10, day: 1 },
    end: { month: 10, day: 31 },
  },
]

/** The theme used outside every celebration window. */
const FALLBACK_THEME: ThemeId = 'default'

/**
 * Read the calendar day of `date` in the given IANA time zone.
 *
 * An unknown time zone makes `Intl.DateTimeFormat` throw, so we fall back to UTC rather than
 * failing the whole page over a cosmetic choice.
 */
const getCalendarDate = (date: Date, timeZone: string): CalendarDate => {
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

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Count the day of the year, with January 1 as day 1. Both dates are taken at UTC midnight, so
 * daylight saving changes cannot shift the count.
 */
const getDayOfYear = ({ year, month, day }: CalendarDate): number =>
  (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / MILLISECONDS_PER_DAY + 1

/** Turn a month and day into a number that sorts in calendar order, for example October 31 is 1031. */
const toOrdinal = ({ month, day }: MonthDay): number => month * 100 + day

/**
 * Whether `today` is the celebration's day, or falls inside its inclusive window, including
 * windows that wrap across the new year.
 */
const isCelebratedOn = (today: CalendarDate, celebration: Celebration): boolean => {
  if ('on' in celebration) {
    return getDayOfYear(today) === celebration.on.dayOfYear
  }

  const current = toOrdinal(today)
  const from = toOrdinal(celebration.start)
  const to = toOrdinal(celebration.end)

  return from <= to ? current >= from && current <= to : current >= from || current <= to
}

/**
 * Pick the theme for a given moment: the first celebration that falls on that day, or
 * `'default'` when none does.
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
  const today = getCalendarDate(date, timeZone)

  return celebrations.find((celebration) => isCelebratedOn(today, celebration))?.theme ?? FALLBACK_THEME
}
