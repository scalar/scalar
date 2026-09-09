import { describe, expect, it } from 'vitest'

import { curlCases } from '@/fixtures/curl-cases'

import { javaAsynchttp } from './asynchttp'

describe('asynchttp', () => {
  it.each(curlCases)('$name', ({ request, configuration }) => {
    expect(javaAsynchttp.generate(request, configuration)).toMatchSnapshot()
  })
})
