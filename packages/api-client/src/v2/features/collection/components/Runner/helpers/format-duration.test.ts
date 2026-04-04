import { expect, it } from 'vitest'

import { formatDuration } from './format-duration'

it('formats zero milliseconds', () => {
  expect(formatDuration(0)).toBe('0ms')
})

it('formats small durations in milliseconds', () => {
  expect(formatDuration(1)).toBe('1ms')
  expect(formatDuration(50)).toBe('50ms')
  expect(formatDuration(350)).toBe('350ms')
  expect(formatDuration(999)).toBe('999ms')
})

it('rounds milliseconds to nearest integer', () => {
  expect(formatDuration(50.4)).toBe('50ms')
  expect(formatDuration(50.5)).toBe('51ms')
  expect(formatDuration(50.9)).toBe('51ms')
})

it('formats exactly 1000ms as seconds', () => {
  expect(formatDuration(1000)).toBe('1.00s')
})

it('formats durations >= 1000ms in seconds with two decimals', () => {
  expect(formatDuration(1337)).toBe('1.34s')
  expect(formatDuration(2000)).toBe('2.00s')
  expect(formatDuration(2500)).toBe('2.50s')
  expect(formatDuration(12345)).toBe('12.35s')
})

it('handles large durations', () => {
  expect(formatDuration(60000)).toBe('60.00s')
  expect(formatDuration(123456)).toBe('123.46s')
})
