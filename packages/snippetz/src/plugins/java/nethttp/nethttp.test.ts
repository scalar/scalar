import { describe, expect, it } from 'vitest'

import { curlCases } from '@/fixtures/curl-cases'

import { javaNethttp } from './nethttp'

describe('nethttp', () => {
  it.each(curlCases)('$name', ({ request, configuration }) => {
    expect(javaNethttp.generate(request, configuration)).toMatchSnapshot()
  })
})
