import { describe, expect, it } from 'vitest'

import { makePoweredByUrl } from './make-powered-by-url'

describe('make-powered-by-url', () => {
  it.each([
    ['express', 'https://scalar.com/?utm_source=powered-by&utm_medium=api-reference&utm_campaign=express'],
    ['fastify', 'https://scalar.com/?utm_source=powered-by&utm_medium=api-reference&utm_campaign=fastify'],
    ['dotnet', 'https://scalar.com/?utm_source=powered-by&utm_medium=api-reference&utm_campaign=dotnet'],
    ['nextjs', 'https://scalar.com/?utm_source=powered-by&utm_medium=api-reference&utm_campaign=nextjs'],
    ['html', 'https://scalar.com/?utm_source=powered-by&utm_medium=api-reference&utm_campaign=html'],
  ])('adds the %s integration as the campaign', (integration, expected) => {
    expect(makePoweredByUrl(integration)).toBe(expected)
  })

  it.each([undefined, null, '', '   '])('omits the campaign when the integration is %j', (integration) => {
    expect(makePoweredByUrl(integration)).toBe('https://scalar.com/?utm_source=powered-by&utm_medium=api-reference')
  })

  it('omits the campaign when called without arguments', () => {
    expect(makePoweredByUrl()).toBe('https://scalar.com/?utm_source=powered-by&utm_medium=api-reference')
  })

  it('trims whitespace around the integration', () => {
    expect(makePoweredByUrl('  hono  ')).toBe(
      'https://scalar.com/?utm_source=powered-by&utm_medium=api-reference&utm_campaign=hono',
    )
  })

  it('encodes characters that would break the query string', () => {
    expect(makePoweredByUrl('a&b=c #d/é')).toBe(
      'https://scalar.com/?utm_source=powered-by&utm_medium=api-reference&utm_campaign=a%26b%3Dc+%23d%2F%C3%A9',
    )
  })

  it('does not allow the integration to override the other parameters', () => {
    const url = new URL(makePoweredByUrl('express&utm_source=evil'))

    expect(url.origin).toBe('https://scalar.com')
    expect(url.searchParams.getAll('utm_source')).toStrictEqual(['powered-by'])
    expect(url.searchParams.get('utm_campaign')).toBe('express&utm_source=evil')
  })

  it('ignores values that are not strings at runtime', () => {
    // The configuration comes from user land (for example JSON in a data attribute), so we guard against odd input
    expect(makePoweredByUrl(42 as unknown as string)).toBe(
      'https://scalar.com/?utm_source=powered-by&utm_medium=api-reference',
    )
  })
})
