import { describe, expect, it } from 'vitest'

import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

import { generatePowershellConvert } from './common'

describe('common', () => {
  it('generates a body without a content-type header', () => {
    const result = convertWithHttpSnippetLite(
      { convert: generatePowershellConvert('Invoke-RestMethod') },
      {
        method: 'POST',
        url: 'https://example.com/hello',
        postData: { mimeType: '', text: 'hello' },
      },
    )

    expect(result).toBe("$response = Invoke-RestMethod -Uri 'https://example.com/hello' -Method POST -Body 'hello'")
  })
})
