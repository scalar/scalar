import { describe, expect, it } from 'vitest'

import { parseServerTiming } from './parse-server-timing'

describe('parse-server-timing', () => {
  it('returns null for an empty or missing header', () => {
    expect(parseServerTiming(null)).toBeNull()
    expect(parseServerTiming(undefined)).toBeNull()
    expect(parseServerTiming('')).toBeNull()
  })

  it('parses named phases with durations', () => {
    const result = parseServerTiming('dns;dur=1.56, connect;dur=12.69, tls;dur=95.03, ttfb;dur=148.93')

    expect(result).toEqual({
      reused: false,
      phases: [
        { name: 'dns', duration: 1.56 },
        { name: 'connect', duration: 12.69 },
        { name: 'tls', duration: 95.03 },
        { name: 'ttfb', duration: 148.93 },
      ],
    })
  })

  it('marks reused connections and keeps their phases', () => {
    const result = parseServerTiming('ttfb;dur=29.99, reused')

    expect(result).toEqual({
      reused: true,
      phases: [{ name: 'ttfb', duration: 29.99 }],
    })
  })

  it('captures descriptions and ignores phases without a duration', () => {
    const result = parseServerTiming('cache;desc="HIT", ttfb;dur=10')

    expect(result).toEqual({
      reused: false,
      phases: [{ name: 'ttfb', duration: 10 }],
    })
  })

  it('ignores malformed durations', () => {
    expect(parseServerTiming('ttfb;dur=not-a-number')).toBeNull()
  })
})
