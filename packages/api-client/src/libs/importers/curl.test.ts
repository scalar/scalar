import { describe, expect, it } from 'vitest'

import { importCurlCommand } from './curl'

describe('importCurlCommand', () => {
  it('should import a simple GET request', () => {
    const curlCommand = 'curl https://galaxy.scalar.com'
    const result = importCurlCommand(curlCommand)
    expect(result.method).toBe('get')
    expect(result.url).toBe('https://galaxy.scalar.com')
    expect(result.path).toBe('/')
    expect(result.headers).toEqual({})
    expect(result.parameters).toEqual([])
  })

  it('should import a POST request with JSON body', () => {
    const curlCommand =
      'curl -X POST -H "Content-Type: application/json" -d \'{"planet":"mars"}\' https://galaxy.scalar.com'
    const result = importCurlCommand(curlCommand)
    expect(result.method).toBe('post')
    expect(result.url).toBe('https://galaxy.scalar.com')
    expect(result.path).toBe('/')
    expect(result.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(result.requestBody).toEqual({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              planet: { type: 'string' },
            },
          },
          example: { planet: 'mars' },
        },
      },
    })
  })

  it('should import a request with query parameters', () => {
    const curlCommand = 'curl https://galaxy.scalar.com?search=earth'
    const result = importCurlCommand(curlCommand)
    expect(result.parameters).toEqual([
      {
        name: 'search',
        in: 'query',
        schema: { type: 'string', examples: ['earth'] },
      },
    ])
  })
})
