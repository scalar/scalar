import { describe, expect, it } from 'vitest'

import { curlCases } from '@/fixtures/curl-cases'

import { powershellWebrequest } from './webrequest'

describe('webrequest', () => {
  it.each(curlCases)('$name', ({ request, configuration }) => {
    expect(powershellWebrequest.generate(request, configuration)).toMatchSnapshot()
  })
})
