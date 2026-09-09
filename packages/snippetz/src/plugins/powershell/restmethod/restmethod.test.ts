import { describe, expect, it } from 'vitest'

import { curlCases } from '@/fixtures/curl-cases'

import { powershellRestmethod } from './restmethod'

describe('restmethod', () => {
  it.each(curlCases)('$name', ({ request, configuration }) => {
    expect(powershellRestmethod.generate(request, configuration)).toMatchSnapshot()
  })

  it('generates a body without a content-type header', () => {
    const result = powershellRestmethod.generate({
      method: 'POST',
      url: 'https://example.com/hello',
      postData: { mimeType: '', text: 'hello' },
    })

    expect(result).toBe(`$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('hello')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com/hello' -Method 'POST' -Body $body.ToArray()
$body.Dispose()
$response`)
  })
})
