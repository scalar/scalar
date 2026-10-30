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
 * A celebration that swaps the default theme while it is on.
 *
 * Both `start` and `end` are inclusive. When `end` comes before `start` in the calendar, the
 * window wraps across the new year (for example, December 20 to January 5).
 */
export type Celebration = {
  name: string
  theme: ThemeId
  start: MonthDay
  end: MonthDay
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
  {
    // Through Twelfth Night, so the lights stay up for New Year's Eve and the week after.
    name: 'Christmas and New Year',
    theme: 'winterHolidays',
    start: { month: 12, day: 1 },
    end: { month: 1, day: 6 },
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
const getMonthDay = (date: Date, timeZone: string): MonthDay => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, month: 'numeric', day: 'numeric' }).formatToParts(date)
    const month = Number(parts.find((part) => part.type === 'month')?.value)
    const day = Number(parts.find((part) => part.type === 'day')?.value)

    if (Number.isInteger(month) && Number.isInteger(day)) {
      return { month, day }
    }
  } catch {
    // Fall through to UTC below.
  }

  return { month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}

/** Turn a month and day into a number that sorts in calendar order, for example October 31 is 1031. */
const toOrdinal = ({ month, day }: MonthDay): number => month * 100 + day

/** Whether `today` falls inside the inclusive window, including windows that wrap across the new year. */
const isWithinWindow = (today: MonthDay, { start, end }: Celebration): boolean => {
  const current = toOrdinal(today)
  const from = toOrdinal(start)
  const to = toOrdinal(end)

  return from <= to ? current >= from && current <= to : current >= from || current <= to
}

/**
 * Pick the theme for a given moment: the first celebration whose window contains that day, or
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
  const today = getMonthDay(date, timeZone)

  return celebrations.find((celebration) => isWithinWindow(today, celebration))?.theme ?? FALLBACK_THEME
}
