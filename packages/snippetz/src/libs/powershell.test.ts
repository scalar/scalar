import { describe, expect, it } from 'vitest'

import { generatePowershell } from './powershell'

describe('powershell', () => {
  it('uses literal string values and combines repeated headers', () => {
    expect(
      generatePowershell('Invoke-RestMethod', {
        url: 'https://example.com',
        headers: [
          { name: 'X-Name', value: "one'$variable" },
          { name: 'x-name', value: 'two' },
          { name: 'X-Empty', value: '' },
        ],
      }),
    ).toBe(`$headers = @{
  'X-Name' = 'one''$variable, two'
  'X-Empty' = ''
}

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET' -Headers $headers
$response`)
  })

  it.each(['propfind', 'PROPFIND', 'customMethod'])('preserves extension method %s using CustomMethod', (method) => {
    expect(generatePowershell('Invoke-WebRequest', { url: 'https://example.com', method })).toBe(
      `$response = Invoke-WebRequest -Uri 'https://example.com' -CustomMethod '${method}'\n$response`,
    )
  })
  it.each([
    ['‘', '‘‘'],
    ['’', '’’'],
    ['‚', '‚‚'],
    ['‛', '‛‛'],
  ])('keeps the %s apostrophe inside a literal header value', (quote, escaped) => {
    expect(
      generatePowershell('Invoke-RestMethod', {
        url: 'https://example.com',
        headers: [{ name: 'X-Name', value: `x${quote}; injected = (Write-Output 123); other=${quote}y` }],
      }),
    ).toBe(`$headers = @{
  'X-Name' = 'x${escaped}; injected = (Write-Output 123); other=${escaped}y'
}

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET' -Headers $headers
$response`)
  })
})
