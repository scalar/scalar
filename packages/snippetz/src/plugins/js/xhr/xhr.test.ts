import { describe, expect, it } from 'vitest'

import { curlCases } from '@/fixtures/curl-cases'

import { jsXhr } from './xhr'

describe('xhr', () => {
  it.each(curlCases)('$name', ({ request, configuration }) => {
    const result = jsXhr.generate(request, configuration)
    expect(result).toMatchSnapshot()
    expect(() => new Function(result)).not.toThrow()
  })
})
