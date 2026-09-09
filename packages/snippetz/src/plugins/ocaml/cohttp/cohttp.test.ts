import { describe, expect, it } from 'vitest'

import { curlCases } from '@/fixtures/curl-cases'

import { ocamlCohttp } from './cohttp'

describe('cohttp', () => {
  it.each(curlCases)('$name', ({ request, configuration }) => {
    expect(ocamlCohttp.generate(request, configuration)).toMatchSnapshot()
  })
})
