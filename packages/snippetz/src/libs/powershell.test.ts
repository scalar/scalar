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

  it('supports extension methods using CustomMethod', () => {
    expect(generatePowershell('Invoke-WebRequest', { url: 'https://example.com', method: 'propfind' })).toBe(
      "$response = Invoke-WebRequest -Uri 'https://example.com' -CustomMethod 'PROPFIND'\n$response",
    )
  })
})
