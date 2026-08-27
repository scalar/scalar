import { describe, expect, it } from 'vitest'

import { splitPathKey } from './split-path-key'

describe('splitPathKey', () => {
  it('returns the path unchanged when there is no query string', () => {
    expect(splitPathKey('/v1/messages')).toEqual({ path: '/v1/messages', query: [] })
  })

  it('splits a pinned query parameter off the path', () => {
    expect(splitPathKey('/v1/messages?beta=true')).toEqual({
      path: '/v1/messages',
      query: [{ name: 'beta', value: 'true' }],
    })
  })

  it('splits multiple pinned query parameters', () => {
    expect(splitPathKey('/v1/messages?beta=true&version=2')).toEqual({
      path: '/v1/messages',
      query: [
        { name: 'beta', value: 'true' },
        { name: 'version', value: '2' },
      ],
    })
  })

  it('pins the name only when the key carries no value', () => {
    expect(splitPathKey('/v1/messages?beta')).toEqual({
      path: '/v1/messages',
      query: [{ name: 'beta', value: undefined }],
    })
  })

  it('keeps an empty value distinct from a missing one', () => {
    expect(splitPathKey('/v1/messages?beta=')).toEqual({
      path: '/v1/messages',
      query: [{ name: 'beta', value: '' }],
    })
  })

  it('keeps path parameters in the path portion', () => {
    expect(splitPathKey('/v1/models/{model_id}?beta=true')).toEqual({
      path: '/v1/models/{model_id}',
      query: [{ name: 'beta', value: 'true' }],
    })
  })

  it('ignores a question mark inside a path parameter', () => {
    expect(splitPathKey('/v1/models/{model?id}')).toEqual({ path: '/v1/models/{model?id}', query: [] })
  })

  it('treats an unbalanced brace as literal text rather than an open template', () => {
    expect(splitPathKey('/v4/i{j?beta=true')).toEqual({
      path: '/v4/i{j',
      query: [{ name: 'beta', value: 'true' }],
    })
  })

  it('pins the name only when the value is a template', () => {
    expect(splitPathKey('/pets/findByStatus?status={status}')).toEqual({
      path: '/pets/findByStatus',
      query: [{ name: 'status', value: undefined }],
    })
  })

  it('splits at the first question mark only', () => {
    expect(splitPathKey('/search?q=a?b')).toEqual({ path: '/search', query: [{ name: 'q', value: 'a?b' }] })
  })

  it('decodes percent-encoded names and values', () => {
    expect(splitPathKey('/search?a%20b=c%20d')).toEqual({ path: '/search', query: [{ name: 'a b', value: 'c d' }] })
  })

  it('decodes a plus as a space', () => {
    expect(splitPathKey('/search?q=hello+world')).toEqual({
      path: '/search',
      query: [{ name: 'q', value: 'hello world' }],
    })
  })

  it('keeps a malformed escape sequence verbatim', () => {
    expect(splitPathKey('/search?q=100%')).toEqual({ path: '/search', query: [{ name: 'q', value: '100%' }] })
  })

  it('drops empty pairs', () => {
    expect(splitPathKey('/search?&beta=true&')).toEqual({ path: '/search', query: [{ name: 'beta', value: 'true' }] })
  })

  it('returns an empty query for a trailing question mark', () => {
    expect(splitPathKey('/search?')).toEqual({ path: '/search', query: [] })
  })
})
