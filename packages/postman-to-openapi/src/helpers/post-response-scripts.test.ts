import { describe, expect, it } from 'vitest'

import type { Event } from '@/types'

import { processPostResponseScripts } from './post-response-scripts'

describe('post-response-scripts', () => {
  it('extracts test script from events', () => {
    const events: Event[] = [
      {
        listen: 'test',
        script: {
          exec: ['pm.test("Status code is 200", function () {', '  pm.response.to.have.status(200);', '});'],
        },
      },
    ]

    const result = processPostResponseScripts(events)

    expect(result).toBe('pm.test("Status code is 200", function () {\n  pm.response.to.have.status(200);\n});')
  })

  it('joins multiple script lines with newline', () => {
    const events: Event[] = [
      {
        listen: 'test',
        script: {
          exec: ['line1', 'line2', 'line3'],
        },
      },
    ]

    const result = processPostResponseScripts(events)

    expect(result).toBe('line1\nline2\nline3')
  })

  it('trims whitespace from result', () => {
    const events: Event[] = [
      {
        listen: 'test',
        script: {
          exec: ['  line1  ', '  line2  '],
        },
      },
    ]

    const result = processPostResponseScripts(events)

    expect(result).toBe('line1  \n  line2')
  })

  it('returns undefined when no test event is present', () => {
    const events: Event[] = [
      {
        listen: 'prerequest',
        script: {
          exec: ['console.log("pre");'],
        },
      },
    ]

    const result = processPostResponseScripts(events)

    expect(result).toBeUndefined()
  })

  it('returns undefined when events array is empty', () => {
    const events: Event[] = []

    const result = processPostResponseScripts(events)

    expect(result).toBeUndefined()
  })

  it('returns undefined when script exec is missing', () => {
    const events: Event[] = [
      {
        listen: 'test',
        script: {},
      },
    ]

    const result = processPostResponseScripts(events)

    expect(result).toBeUndefined()
  })

  it('returns undefined when script is missing', () => {
    const events: Event[] = [
      {
        listen: 'test',
        script: {
          exec: [],
        },
      },
    ]

    const result = processPostResponseScripts(events as Event[])

    expect(result).toBeUndefined()
  })

  it('handles single line script', () => {
    const events: Event[] = [
      {
        listen: 'test',
        script: {
          exec: ['pm.response.to.have.status(200);'],
        },
      },
    ]

    const result = processPostResponseScripts(events)

    expect(result).toBe('pm.response.to.have.status(200);')
  })

  it('handles empty script array', () => {
    const events: Event[] = [
      {
        listen: 'test',
        script: {
          exec: [],
        },
      },
    ]

    const result = processPostResponseScripts(events)

    expect(result).toBeUndefined()
  })
})
