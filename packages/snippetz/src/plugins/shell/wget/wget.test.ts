import { describe, expect, it } from 'vitest'

import { shellWget } from './wget'

describe('shellWget', () => {
  it('returns a basic request', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
    })

    console.log(result)

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - https://example.com`)
  })

  it('returns a POST request', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --output-document \\
  - https://example.com`)
  })

  it('has headers', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })
    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --header 'Content-Type: application/json' \\
  --output-document \\
  - https://example.com`)
  })
})
