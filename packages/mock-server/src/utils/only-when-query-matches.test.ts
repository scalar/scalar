import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { onlyWhenQueryMatches } from './only-when-query-matches'

/** Build an app that answers `/messages` from a gated handler, falling back to a plain one. */
const createApp = (query: Array<{ name: string; value: string }>) => {
  const app = new Hono()

  app.get(
    '/messages',
    onlyWhenQueryMatches(query, (c) => c.text('gated')),
  )
  app.get('/messages', (c) => c.text('plain'))

  return app
}

describe('onlyWhenQueryMatches', () => {
  it('returns the handler untouched when nothing is required', () => {
    const handler = () => new Response()

    expect(onlyWhenQueryMatches([], handler)).toBe(handler)
  })

  it('runs the handler when the query matches', async () => {
    const response = await createApp([{ name: 'beta', value: 'true' }]).request('/messages?beta=true')

    expect(await response.text()).toBe('gated')
  })

  it('falls through when the query parameter is missing', async () => {
    const response = await createApp([{ name: 'beta', value: 'true' }]).request('/messages')

    expect(await response.text()).toBe('plain')
  })

  it('falls through when the query parameter has another value', async () => {
    const response = await createApp([{ name: 'beta', value: 'true' }]).request('/messages?beta=false')

    expect(await response.text()).toBe('plain')
  })

  it('requires every query parameter', async () => {
    const app = createApp([
      { name: 'beta', value: 'true' },
      { name: 'version', value: '2' },
    ])

    expect(await (await app.request('/messages?beta=true')).text()).toBe('plain')
    expect(await (await app.request('/messages?beta=true&version=2')).text()).toBe('gated')
  })

  it('matches a repeated query parameter', async () => {
    const response = await createApp([{ name: 'beta', value: 'true' }]).request('/messages?beta=false&beta=true')

    expect(await response.text()).toBe('gated')
  })

  it('matches a query parameter without a value', async () => {
    const response = await createApp([{ name: 'beta', value: '' }]).request('/messages?beta')

    expect(await response.text()).toBe('gated')
  })

  it('matches a query parameter named after an object member', async () => {
    // Hono builds its query record as a plain object, so a name like `toString` reads back something
    // inherited unless the lookup insists on an actual list of values.
    for (const name of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
      const response = await createApp([{ name, value: '1' }]).request(`/messages?${name}=1`)

      expect(await response.text()).toBe('gated')
    }
  })

  it('falls through for a query parameter named after an object member the request omits', async () => {
    for (const name of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
      const response = await createApp([{ name, value: '1' }]).request('/messages')

      expect(await response.text()).toBe('plain')
    }
  })

  it('falls through for a query parameter without a name', async () => {
    // Hono answers its query accessors with the whole query record for an empty name, so an empty
    // name has to read as "no such parameter" rather than reaching into that record.
    const response = await createApp([{ name: '', value: '1' }]).request('/messages?=1')

    expect(await response.text()).toBe('plain')
  })

  it('responds with a 404 when there is no plain sibling to fall through to', async () => {
    const app = new Hono()

    app.get(
      '/messages',
      onlyWhenQueryMatches([{ name: 'beta', value: 'true' }], (c) => c.text('gated')),
    )

    expect((await app.request('/messages')).status).toBe(404)
  })
})
