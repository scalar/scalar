import { describe, expect, it } from 'vitest'

import { curlCases } from '@/fixtures/curl-cases'

import { javaUnirest } from './unirest'

describe('unirest', () => {
  it.each(curlCases)('$name', ({ request, configuration }) => {
    expect(javaUnirest.generate(request, configuration)).toMatchSnapshot()
  })
})
