/**
 * Pure date/time helpers for the {@link DatePicker}.
 *
 * The picker edits three OpenAPI string formats — `date`, `date-time`, and
 * `time` — as a small bag of integer fields. Keeping the parse/format logic
 * here (free of Vue and, where possible, of the ambient timezone) makes it
 * straightforward to unit test the exact strings we hand back to the request.
 */

/** The OpenAPI string formats the picker knows how to edit. */
export type DatePickerType = 'date' | 'date-time' | 'time'

/**
 * A date/time broken into its editable fields.
 *
 * `offset` only matters for `date-time` values: it holds the timezone
 * designator (`Z` or `±HH:MM`) so a round-trip preserves whatever the user
 * originally typed instead of silently rewriting it to the local zone.
 */
export type DateParts = {
  year: number
  /** 1-12 (human month, not the 0-based `Date` month) */
  month: number
  day: number
  hour: number
  minute: number
  second: number
  /** Timezone designator for `date-time`, e.g. `Z` or `+02:00`. Empty otherwise. */
  offset: string
}

/** Zero-pad a number to two digits. */
const pad2 = (value: number): string => String(Math.abs(value)).padStart(2, '0')

/** Zero-pad a year to four digits. */
const pad4 = (value: number): string => String(value).padStart(4, '0')

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_RE = /^(\d{2}):(\d{2})(?::(\d{2}))?$/
const DATE_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:\d{2})?$/

/**
 * Parse a formatted value into editable fields, or return `null` when it does
 * not match the given format. A `null` result is how the picker recognizes
 * free-text or `{{variable}}` values it should not try to interpret — it just
 * falls back to "now" for its initial view without touching the field.
 */
export const parseValue = (value: string, type: DatePickerType): DateParts | null => {
  const trimmed = value.trim()

  if (type === 'date') {
    const match = DATE_RE.exec(trimmed)
    if (!match) {
      return null
    }
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: 0,
      minute: 0,
      second: 0,
      offset: '',
    }
  }

  if (type === 'time') {
    const match = TIME_RE.exec(trimmed)
    if (!match) {
      return null
    }
    return {
      year: 0,
      month: 0,
      day: 0,
      hour: Number(match[1]),
      minute: Number(match[2]),
      second: Number(match[3] ?? 0),
      offset: '',
    }
  }

  const match = DATE_TIME_RE.exec(trimmed)
  if (!match) {
    return null
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
    offset: match[7] ?? '',
  }
}

/** Format the date portion as `YYYY-MM-DD`. */
export const formatDate = (parts: DateParts): string => `${pad4(parts.year)}-${pad2(parts.month)}-${pad2(parts.day)}`

/** Format the time portion as `HH:MM:SS`. */
export const formatTime = (parts: DateParts): string =>
  `${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`

/**
 * Format editable fields back into the string the request expects.
 *
 * For `date-time` the caller is responsible for supplying a non-empty
 * `offset`; use {@link getLocalTimezoneOffset} to derive one when the original
 * value had none.
 */
export const formatValue = (parts: DateParts, type: DatePickerType): string => {
  if (type === 'date') {
    return formatDate(parts)
  }
  if (type === 'time') {
    return formatTime(parts)
  }
  return `${formatDate(parts)}T${formatTime(parts)}${parts.offset}`
}

/**
 * Read the current fields from a `Date`, in the host's local timezone. Used to
 * seed the picker with "now"/"today" and to fill in an offset when a
 * `date-time` value arrives without one.
 */
export const partsFromDate = (date: Date): DateParts => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
  hour: date.getHours(),
  minute: date.getMinutes(),
  second: date.getSeconds(),
  offset: getLocalTimezoneOffset(date),
})

/**
 * The host's UTC offset for the given date as an RFC 3339 designator
 * (`+02:00`, `-05:00`, or `+00:00`). `Date.getTimezoneOffset` reports minutes
 * *behind* UTC, so the sign is inverted here.
 */
export const getLocalTimezoneOffset = (date: Date): string => {
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  return `${sign}${pad2(Math.floor(Math.abs(offsetMinutes) / 60))}:${pad2(Math.abs(offsetMinutes) % 60)}`
}
