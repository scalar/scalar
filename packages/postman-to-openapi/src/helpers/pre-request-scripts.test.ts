import { describe, expect, it } from 'vitest'

import type { Event } from '@/types'

import { processPreRequestScripts } from './pre-request-scripts'

describe('pre-request-scripts', () => {
  it('extracts pre-request script from events', () => {
    const events: Event[] = [
      {
        listen: 'prerequest',
        script: {
          exec: ['console.log("pre-request");', 'pm.environment.set("token", "abc123");'],
          type: 'text/javascript',
        },
      },
    ]

    const result = processPreRequestScripts(events)

    expect(result).toBe('console.log("pre-request");\npm.environment.set("token", "abc123");')
  })

  it('returns undefined when no pre-request event exists', () => {
    const events: Event[] = [
      {
        listen: 'test',
        script: {
          exec: ['pm.test("Status is 200", function() {})'],
          type: 'text/javascript',
        },
      },
    ]

    const result = processPreRequestScripts(events)

    expect(result).toBeUndefined()
  })

  it('returns undefined when events array is empty', () => {
    const result = processPreRequestScripts([])

    expect(result).toBeUndefined()
  })

  it('returns undefined when events is undefined', () => {
    const result = processPreRequestScripts(undefined)

    expect(result).toBeUndefined()
  })

  it('returns undefined when pre-request event has no script', () => {
    const events: Event[] = [
      {
        listen: 'prerequest',
        script: {
          exec: [],
          type: 'text/javascript',
        },
      },
    ]

    const result = processPreRequestScripts(events)

    expect(result).toBeUndefined()
  })

  it('returns undefined when script exec is empty', () => {
    const events: Event[] = [
      {
        listen: 'prerequest',
        script: {
          exec: [],
          type: 'text/javascript',
        },
      },
    ]

    const result = processPreRequestScripts(events)

    expect(result).toBeUndefined()
  })

  it('handles string exec value', () => {
    const events = [
      {
        listen: 'prerequest',
        script: {
          exec: 'pm.environment.set("key", "value");',
          type: 'text/javascript',
        },
      },
    ]

    const result = processPreRequestScripts(events as Event[])

    expect(result).toBe('pm.environment.set("key", "value");')
  })

  it('trims whitespace from script content', () => {
    const events: Event[] = [
      {
        listen: 'prerequest',
        script: {
          exec: ['  ', 'pm.environment.set("key", "value");', '  '],
          type: 'text/javascript',
        },
      },
    ]

    const result = processPreRequestScripts(events)

    expect(result).toBe('pm.environment.set("key", "value");')
  })

  it('returns undefined when script is only whitespace', () => {
    const events: Event[] = [
      {
        listen: 'prerequest',
        script: {
          exec: ['   ', '  '],
          type: 'text/javascript',
        },
      },
    ]

    const result = processPreRequestScripts(events)

    expect(result).toBeUndefined()
  })
})
