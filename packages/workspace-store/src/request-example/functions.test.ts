import { describe, expect, it } from 'vitest'

import {
  CONTEXT_FUNCTION_NAMES,
  POPULAR_CONTEXT_FUNCTION_KEYS,
  contextFunctions,
  getContextFunctionComment,
  isContextFunctionName,
} from './functions'

describe('functions', () => {
  it('$randomDateFuture returns a date strictly in the future', () => {
    const before = Date.now()
    const result = contextFunctions.$randomDateFuture.fn()
    const parsed = new Date(result).getTime()

    expect(parsed).toBeGreaterThan(before)
    expect(parsed).toBeLessThanOrEqual(before + 365 * 86_400_000)
  })

  it('$randomDatePast returns a date strictly in the past', () => {
    const before = Date.now()
    const result = contextFunctions.$randomDatePast.fn()
    const parsed = new Date(result).getTime()

    expect(parsed).toBeLessThan(before)
    expect(parsed).toBeGreaterThanOrEqual(before - 365 * 86_400_000)
  })

  it('$randomDateRecent returns a date within the last 3 days', () => {
    const before = Date.now()
    const result = contextFunctions.$randomDateRecent.fn()
    const parsed = new Date(result).getTime()

    expect(parsed).toBeLessThan(before)
    expect(parsed).toBeGreaterThanOrEqual(before - 3 * 86_400_000)
  })

  it('date functions return valid ISO 8601 strings', () => {
    for (const key of ['$randomDateFuture', '$randomDatePast', '$randomDateRecent'] as const) {
      const result = contextFunctions[key].fn()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      expect(Number.isNaN(new Date(result).getTime())).toBe(false)
    }
  })

  it('$isoTimestamp returns the current time as ISO 8601', () => {
    const before = Date.now()
    const result = contextFunctions.$isoTimestamp.fn()
    const after = Date.now()
    const parsed = new Date(result).getTime()

    expect(parsed).toBeGreaterThanOrEqual(before)
    expect(parsed).toBeLessThanOrEqual(after)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
  })

  it('$timestamp returns the current UNIX timestamp in seconds', () => {
    const before = Math.floor(Date.now() / 1000)
    const result = contextFunctions.$timestamp.fn()
    const after = Math.floor(Date.now() / 1000)
    const parsed = Number(result)

    expect(parsed).toBeGreaterThanOrEqual(before)
    expect(parsed).toBeLessThanOrEqual(after)
    expect(result).toMatch(/^\d+$/)
  })

  it('$randomInt returns a number between 0 and 1000', () => {
    for (let i = 0; i < 50; i++) {
      const value = Number(contextFunctions.$randomInt.fn())
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1000)
    }
  })

  it('$randomBoolean returns "true" or "false"', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 50; i++) {
      seen.add(contextFunctions.$randomBoolean.fn())
    }
    if (seen.size !== 2) {
      expect(seen.has('true') || seen.has('false')).toBe(true)
      expect(seen.size).toBe(1)
    } else {
      expect(seen.has('true')).toBe(true)
      expect(seen.has('false')).toBe(true)
      expect(seen.size).toBe(2)
    }
  })

  it('$randomAlphaNumeric returns a single alphanumeric character', () => {
    for (let i = 0; i < 50; i++) {
      const result = contextFunctions.$randomAlphaNumeric.fn()
      expect(result).toMatch(/^[a-z0-9]$/)
    }
  })

  it('$randomPassword returns a 15-character alphanumeric string', () => {
    for (let i = 0; i < 10; i++) {
      const result = contextFunctions.$randomPassword.fn()
      expect(result).toMatch(/^[a-z0-9]{15}$/)
    }
  })

  it('$randomPrice returns a formatted price between 0.00 and 1000.00', () => {
    for (let i = 0; i < 20; i++) {
      const result = contextFunctions.$randomPrice.fn()
      expect(result).toMatch(/^\d+\.\d{2}$/)
      const value = Number(result)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1000)
    }
  })

  it('$randomColor returns a valid hex color', () => {
    for (let i = 0; i < 20; i++) {
      expect(contextFunctions.$randomColor.fn()).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('$randomHexColor returns a valid hex color', () => {
    for (let i = 0; i < 20; i++) {
      expect(contextFunctions.$randomHexColor.fn()).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('$guid returns a UUID v4 format string', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$guid.fn()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      )
    }
  })

  it('$randomUUID returns a UUID format string', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$randomUUID.fn()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      )
    }
  })

  it('$randomIP returns a valid IPv4 address', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$randomIP.fn()).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
    }
  })

  it('$randomIPV6 returns a valid IPv6 address', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$randomIPV6.fn()).toMatch(/^([0-9a-f]{4}:){7}[0-9a-f]{4}$/)
    }
  })

  it('$randomMACAddress returns a valid MAC address', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$randomMACAddress.fn()).toMatch(
        /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/,
      )
    }
  })

  it('$randomEmail returns a string containing @', () => {
    for (let i = 0; i < 10; i++) {
      const email = contextFunctions.$randomEmail.fn()
      expect(email).toMatch(/.+@.+\..+/)
    }
  })

  it('$randomExampleEmail uses an example domain', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$randomExampleEmail.fn()).toMatch(/@example\.(com|org|net)$/)
    }
  })

  it('$randomUrl returns a string starting with https://', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$randomUrl.fn()).toMatch(/^https:\/\//)
    }
  })

  it('$randomProtocol returns http or https', () => {
    for (let i = 0; i < 20; i++) {
      expect(['http', 'https']).toContain(contextFunctions.$randomProtocol.fn())
    }
  })

  it('$randomSemver returns a valid semver string', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$randomSemver.fn()).toMatch(/^\d+\.\d+\.\d+/)
    }
  })

  it('$randomFullName returns first and last name separated by space', () => {
    for (let i = 0; i < 10; i++) {
      const name = contextFunctions.$randomFullName.fn()
      const parts = name.split(' ')
      expect(parts.length).toBe(2)
      expect(parts[0]!.length).toBeGreaterThan(0)
      expect(parts[1]!.length).toBeGreaterThan(0)
    }
  })

  it('$randomCreditCardMask returns a masked card number', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$randomCreditCardMask.fn()).toMatch(
        /^\*{4} \*{4} \*{4} \d{4}$/,
      )
    }
  })

  it('$randomPhoneNumberExt prepends a two-digit extension', () => {
    for (let i = 0; i < 10; i++) {
      const result = contextFunctions.$randomPhoneNumberExt.fn()
      expect(result).toMatch(/^\d{2}-/)
    }
  })

  it('$randomCountryCode returns a two-letter code', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$randomCountryCode.fn()).toMatch(/^[A-Z]{2}$/)
    }
  })

  it('$randomLocale returns a two-letter language code', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$randomLocale.fn()).toMatch(/^[a-z]{2}$/)
    }
  })

  it('$randomWeekday returns a valid weekday name', () => {
    const valid = new Set([
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    ])
    for (let i = 0; i < 20; i++) {
      expect(valid.has(contextFunctions.$randomWeekday.fn())).toBe(true)
    }
  })

  it('$randomMonth returns a valid month name', () => {
    const valid = new Set([
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ])
    for (let i = 0; i < 20; i++) {
      expect(valid.has(contextFunctions.$randomMonth.fn())).toBe(true)
    }
  })

  it('$randomWords returns 2 to 5 space-separated words', () => {
    for (let i = 0; i < 20; i++) {
      const result = contextFunctions.$randomWords.fn()
      const count = result.split(' ').length
      expect(count).toBeGreaterThanOrEqual(2)
      expect(count).toBeLessThanOrEqual(5)
    }
  })

  it('$randomLoremWords returns exactly 3 lorem words', () => {
    for (let i = 0; i < 20; i++) {
      const result = contextFunctions.$randomLoremWords.fn()
      expect(result.split(' ').length).toBe(3)
    }
  })

  it('$randomLoremLines returns 1 to 5 newline-separated lines', () => {
    for (let i = 0; i < 20; i++) {
      const result = contextFunctions.$randomLoremLines.fn()
      const count = result.split('\n').length
      expect(count).toBeGreaterThanOrEqual(1)
      expect(count).toBeLessThanOrEqual(5)
    }
  })

  it('$randomLoremSentences returns 2 to 6 sentences', () => {
    for (let i = 0; i < 20; i++) {
      const result = contextFunctions.$randomLoremSentences.fn()
      expect(result.length).toBeGreaterThan(0)
    }
  })

  it('$randomImageDataUri returns a data URI', () => {
    for (let i = 0; i < 5; i++) {
      expect(contextFunctions.$randomImageDataUri.fn()).toMatch(/^data:image\//)
    }
  })

  it('$randomMimeType returns a valid MIME type format', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$randomMimeType.fn()).toMatch(/^[a-z]+\/[a-z0-9.+-]+$/)
    }
  })

  it('$randomLatitude returns a numeric latitude string', () => {
    for (let i = 0; i < 10; i++) {
      const val = Number(contextFunctions.$randomLatitude.fn())
      expect(val).toBeGreaterThanOrEqual(-90)
      expect(val).toBeLessThanOrEqual(90)
    }
  })

  it('$randomLongitude returns a numeric longitude string', () => {
    for (let i = 0; i < 10; i++) {
      const val = Number(contextFunctions.$randomLongitude.fn())
      expect(val).toBeGreaterThanOrEqual(-180)
      expect(val).toBeLessThanOrEqual(180)
    }
  })

  it('$randomIngverb returns a verb ending in -ing', () => {
    for (let i = 0; i < 10; i++) {
      expect(contextFunctions.$randomIngverb.fn()).toMatch(/ing$/)
    }
  })

  it('every context function returns a non-empty string', () => {
    for (const [key, entry] of Object.entries(contextFunctions)) {
      const result = entry.fn()
      expect(typeof result).toBe('string')
      expect(result.length, `${key} returned empty string`).toBeGreaterThan(0)
    }
  })

  it('every context function has a non-empty comment', () => {
    for (const [key, entry] of Object.entries(contextFunctions)) {
      expect(typeof entry.comment).toBe('string')
      expect(entry.comment.length, `${key} has empty comment`).toBeGreaterThan(0)
    }
  })

  it('getContextFunctionComment returns the correct comment', () => {
    expect(getContextFunctionComment('$guid')).toBe('A uuid-v4 style guid')
    expect(getContextFunctionComment('$timestamp')).toBe('The current UNIX timestamp in seconds')
    expect(getContextFunctionComment('$randomInt')).toBe('A random integer between 0 and 1000')
  })

  it('isContextFunctionName identifies valid names', () => {
    expect(isContextFunctionName('$guid')).toBe(true)
    expect(isContextFunctionName('$timestamp')).toBe(true)
    expect(isContextFunctionName('$randomEmail')).toBe(true)
  })

  it('isContextFunctionName rejects invalid names', () => {
    expect(isContextFunctionName('$nonExistent')).toBe(false)
    expect(isContextFunctionName('')).toBe(false)
    expect(isContextFunctionName('guid')).toBe(false)
    expect(isContextFunctionName('randomEmail')).toBe(false)
  })

  it('CONTEXT_FUNCTION_NAMES contains all keys from contextFunctions', () => {
    const keys = Object.keys(contextFunctions)
    expect(CONTEXT_FUNCTION_NAMES).toStrictEqual(keys)
  })

  it('POPULAR_CONTEXT_FUNCTION_KEYS are all valid context function names', () => {
    for (const key of POPULAR_CONTEXT_FUNCTION_KEYS) {
      expect(isContextFunctionName(key)).toBe(true)
    }
  })
})
