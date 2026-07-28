import { describe, expect, it } from 'vitest'

import {
  type DateParts,
  formatDate,
  formatTime,
  formatValue,
  getLocalTimezoneOffset,
  parseValue,
  partsFromDate,
} from './date-parts'

const parts = (overrides: Partial<DateParts> = {}): DateParts => ({
  year: 2024,
  month: 3,
  day: 20,
  hour: 13,
  minute: 45,
  second: 30,
  offset: 'Z',
  ...overrides,
})

describe('parseValue', () => {
  it('parses a date value', () => {
    expect(parseValue('2024-03-20', 'date')).toMatchObject({
      year: 2024,
      month: 3,
      day: 20,
    })
  })

  it('parses a time value with seconds', () => {
    expect(parseValue('13:45:30', 'time')).toMatchObject({
      hour: 13,
      minute: 45,
      second: 30,
    })
  })

  it('parses a time value without seconds', () => {
    expect(parseValue('09:05', 'time')).toMatchObject({
      hour: 9,
      minute: 5,
      second: 0,
    })
  })

  it('parses a date-time value and keeps the offset', () => {
    expect(parseValue('2024-03-20T13:45:30+02:00', 'date-time')).toMatchObject({
      year: 2024,
      month: 3,
      day: 20,
      hour: 13,
      minute: 45,
      second: 30,
      offset: '+02:00',
    })
  })

  it('parses a date-time value with a Z offset and fractional seconds', () => {
    expect(parseValue('2024-03-20T13:45:30.123Z', 'date-time')).toMatchObject({
      hour: 13,
      minute: 45,
      second: 30,
      offset: 'Z',
    })
  })

  it('returns null for free-text or variable values', () => {
    expect(parseValue('not a date', 'date')).toBeNull()
    expect(parseValue('{{myDate}}', 'date-time')).toBeNull()
    expect(parseValue('', 'time')).toBeNull()
  })

  it('does not treat a bare date as a date-time', () => {
    expect(parseValue('2024-03-20', 'date-time')).toBeNull()
  })
})

describe('formatValue', () => {
  it('formats a date', () => {
    expect(formatValue(parts(), 'date')).toBe('2024-03-20')
  })

  it('formats a time', () => {
    expect(formatValue(parts(), 'time')).toBe('13:45:30')
  })

  it('formats a date-time with the supplied offset', () => {
    expect(formatValue(parts({ offset: '+02:00' }), 'date-time')).toBe('2024-03-20T13:45:30+02:00')
  })

  it('zero-pads single-digit fields', () => {
    expect(formatValue(parts({ month: 1, day: 5, hour: 9 }), 'date-time')).toBe('2024-01-05T09:45:30Z')
  })

  it('round-trips a parsed date-time', () => {
    const value = '2024-03-20T13:45:30+02:00'
    const parsed = parseValue(value, 'date-time')
    expect(parsed).not.toBeNull()
    expect(formatValue(parsed!, 'date-time')).toBe(value)
  })
})

describe('formatDate / formatTime', () => {
  it('formats the date portion', () => {
    expect(formatDate(parts())).toBe('2024-03-20')
  })

  it('formats the time portion', () => {
    expect(formatTime(parts())).toBe('13:45:30')
  })
})

describe('getLocalTimezoneOffset', () => {
  it('formats a positive offset', () => {
    // -120 minutes reported → UTC+02:00
    const date = { getTimezoneOffset: () => -120 } as Date
    expect(getLocalTimezoneOffset(date)).toBe('+02:00')
  })

  it('formats a negative offset', () => {
    const date = { getTimezoneOffset: () => 300 } as Date
    expect(getLocalTimezoneOffset(date)).toBe('-05:00')
  })

  it('formats UTC as +00:00', () => {
    const date = { getTimezoneOffset: () => 0 } as Date
    expect(getLocalTimezoneOffset(date)).toBe('+00:00')
  })
})

describe('partsFromDate', () => {
  it('reads the local fields from a date', () => {
    const date = new Date(2024, 2, 20, 13, 45, 30)
    expect(partsFromDate(date)).toMatchObject({
      year: 2024,
      month: 3,
      day: 20,
      hour: 13,
      minute: 45,
      second: 30,
    })
  })
})
