import { describe, expect, it } from 'vitest'

import { curlCases } from '@/fixtures/curl-cases'

import { shellCurl } from './curl'

describe('curl', () => {
  it.each(curlCases)('$name', ({ request, configuration, matcher, expectedCurl }) => {
    expect(shellCurl.generate(request, configuration))[matcher](expectedCurl)
  })

  it('turns off globbing for bracket notation in a query parameter name', () => {
    const result = shellCurl.generate({
      url: 'https://example.com/api/users',
      queryString: [
        {
          name: 'filter[user_id]',
          value: 'me',
        },
      ],
    })

    expect(result).toBe(`curl 'https://example.com/api/users?filter[user_id]=me' \\
  --globoff`)
  })

  it('leaves a path placeholder alone', () => {
    const result = shellCurl.generate({
      url: 'https://galaxy.scalar.com/planets/{planetId}',
    })

    expect(result).toBe(`curl 'https://galaxy.scalar.com/planets/{planetId}'`)
  })

  it('turns off globbing for a curly-brace set in a query value', () => {
    const result = shellCurl.generate({
      url: 'https://example.com/api',
      queryString: [
        {
          name: 'ids',
          value: '{1,2,3}',
        },
      ],
    })

    expect(result).toBe(`curl 'https://example.com/api?ids={1,2,3}' \\
  --globoff`)
  })

  it('leaves a path placeholder alone even with a query string', () => {
    const result = shellCurl.generate({
      url: 'https://galaxy.scalar.com/planets/{planetId}',
      queryString: [
        {
          name: 'limit',
          value: '10',
        },
      ],
    })

    expect(result).toBe(`curl 'https://galaxy.scalar.com/planets/{planetId}?limit=10'`)
  })

  it('turns off globbing for braces already present in the URL query', () => {
    const result = shellCurl.generate({
      url: 'https://example.com/api?ids={1,2,3}',
    })

    expect(result).toBe(`curl 'https://example.com/api?ids={1,2,3}' \\
  --globoff`)
  })

})
