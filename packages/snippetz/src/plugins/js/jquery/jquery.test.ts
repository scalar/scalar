import { describe, expect, it } from 'vitest'

import { curlCases } from '@/fixtures/curl-cases'

import { jsJquery } from './jquery'

describe('jquery', () => {
  it.each(curlCases)('$name', ({ request, configuration }) => {
    const result = jsJquery.generate(request, configuration)
    expect(result).toMatchSnapshot()
    expect(() => new Function(result)).not.toThrow()
  })
})
