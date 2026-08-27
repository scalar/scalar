import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { onlyWhenPathKeyAnswers, selectPathKey } from './select-path-key'

/**
 * Build the query record Hono hands to the selection, from a query string.
 *
 * Hono accumulates into a plain object, so this does too — a name such as `__proto__` then lands on
 * the record the same way it does at runtime.
 */
const queriesFrom = (search: string): Record<string, string[]> => {
  const queries: Record<string, string[]> = {}

  new URLSearchParams(search).forEach((value, name) => {
    const existing = queries[name]

    queries[name] = Array.isArray(existing) ? [...existing, value] : [value]
  })

  return queries
}

/** Shorthand for the query parameters of one path key, written as a query string. */
const key = (search: string) => [...new URLSearchParams(search)].map(([name, value]) => ({ name, value }))

describe('selectPathKey', () => {
  it('answers with the only path key of a route', () => {
    expect(selectPathKey([key('')], queriesFrom(''))).toBe(0)
    expect(selectPathKey([key('beta=true')], queriesFrom(''))).toBe(0)
  })

  it('answers with the key whose parameters the request carries', () => {
    const keys = [key(''), key('beta=true')]

    expect(selectPathKey(keys, queriesFrom('beta=true'))).toBe(1)
    expect(selectPathKey(keys, queriesFrom(''))).toBe(0)
    expect(selectPathKey(keys, queriesFrom('beta=false'))).toBe(0)
  })

  it('answers with the key that carries the most parameters', () => {
    const keys = [key('beta=true'), key('beta=true&version=2'), key('')]

    expect(selectPathKey(keys, queriesFrom('beta=true&version=2'))).toBe(1)
    expect(selectPathKey(keys, queriesFrom('beta=true'))).toBe(0)
    expect(selectPathKey(keys, queriesFrom('version=2'))).toBe(2)
  })

  it('answers with the key declared first when two carry the same number of parameters', () => {
    const keys = [key('a=1'), key('b=2')]

    expect(selectPathKey(keys, queriesFrom('a=1&b=2'))).toBe(0)
    expect(selectPathKey(keys, queriesFrom('b=2'))).toBe(1)
  })

  it('answers with the least specific key when the request carries none of them', () => {
    expect(selectPathKey([key('beta=true&version=2'), key('beta=true')], queriesFrom(''))).toBe(1)
    // Nothing separates two keys of the same size, so the one declared first answers.
    expect(selectPathKey([key('a=1'), key('b=2')], queriesFrom(''))).toBe(0)
  })

  it('matches a repeated query parameter', () => {
    expect(selectPathKey([key(''), key('beta=true')], queriesFrom('beta=false&beta=true'))).toBe(1)
  })

  it('matches a query parameter without a value', () => {
    expect(selectPathKey([key(''), key('beta')], queriesFrom('beta'))).toBe(1)
  })

  it('matches a query parameter named after an object member', () => {
    for (const name of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
      expect(selectPathKey([key(''), key(`${name}=1`)], queriesFrom(`${name}=1`))).toBe(1)
      expect(selectPathKey([key(''), key(`${name}=1`)], queriesFrom(''))).toBe(0)
    }
  })
})

describe('onlyWhenPathKeyAnswers', () => {
  /** Build an app whose `/messages` route is served by the given path keys, in document order. */
  const createApp = (keys: string[]) => {
    const app = new Hono()
    const parsed = keys.map(key)

    parsed.forEach((_, position) =>
      app.get(
        '/messages',
        onlyWhenPathKeyAnswers(parsed, position, (c) => c.text(String(position))),
      ),
    )

    return app
  }

  it('returns the handler untouched for a route with a single path key', () => {
    const handler = () => new Response()

    expect(onlyWhenPathKeyAnswers([key('beta=true')], 0, handler)).toBe(handler)
  })

  it('answers from the key the request selects', async () => {
    const app = createApp(['', 'beta=true'])

    expect(await (await app.request('/messages?beta=true')).text()).toBe('1')
    expect(await (await app.request('/messages')).text()).toBe('0')
  })

  it('answers from a key declared after the one that does not match', async () => {
    const app = createApp(['beta=true', ''])

    expect(await (await app.request('/messages?beta=true')).text()).toBe('0')
    expect(await (await app.request('/messages')).text()).toBe('1')
  })

  it('hands the request on when no key of the route answers it', async () => {
    const app = new Hono()
    const parsed = [key('a=1'), key('b=2')]

    // Only the first key is mounted, so the request the second one answers falls through.
    app.get(
      '/messages',
      onlyWhenPathKeyAnswers(parsed, 0, (c) => c.text('first')),
    )
    app.get('/messages', (c) => c.text('next route'))

    expect(await (await app.request('/messages?b=2')).text()).toBe('next route')
    expect(await (await app.request('/messages?a=1')).text()).toBe('first')
  })
})
