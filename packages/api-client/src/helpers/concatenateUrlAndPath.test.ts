import { describe, expect, it } from 'vitest'

import { concatenateUrlAndPath } from './concatenateUrlAndPath'

describe('concatenateUrlAndPath', () => {
  it('trims a slash from the URL', async () => {
    expect(concatenateUrlAndPath('http://127.0.0.1/', 'foobar')).toBe(
      'http://127.0.0.1/foobar',
    )
  })

  it('adds a slash between url and path', async () => {
    expect(concatenateUrlAndPath('http://127.0.0.1', 'foobar')).toBe(
      'http://127.0.0.1/foobar',
    )
  })

  it('trims a slash from the path', async () => {
    expect(concatenateUrlAndPath('http://127.0.0.1', '/foobar')).toBe(
      'http://127.0.0.1/foobar',
    )
  })

  it('works without a path', async () => {
    expect(concatenateUrlAndPath('http://127.0.0.1')).toBe('http://127.0.0.1')
  })
})
