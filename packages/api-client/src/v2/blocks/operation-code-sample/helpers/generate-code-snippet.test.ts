import type { AvailableClient } from '@scalar/snippetz'
import { snippetz } from '@scalar/snippetz'
import { allPlugins } from '@scalar/snippetz/clients'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { consoleErrorSpy } from '@test/vitest.setup'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { generateCodeSnippet } from './generate-code-snippet'

const s = snippetz(allPlugins)

describe('generateCodeSnippet', () => {
  const mockOperation: OperationObject = {
    responses: {
      '200': {
        description: 'OK',
      },
    },
  }

  const mockServer = { url: 'https://api.example.com' }

  const baseParams = {
    snippetzInstance: s,
    operation: mockOperation,
    method: 'get' as const,
    path: '/users',
    server: mockServer,
    customCodeSamples: [] as XCodeSample[],
    contentType: undefined,
    example: undefined,
    securitySchemes: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty string when clientId is undefined', async () => {
    const result = await generateCodeSnippet({
      ...baseParams,
      clientId: undefined,
    })

    expect(result).toBe('')
  })

  it('returns generated code snippet when successful', async () => {
    const result = await generateCodeSnippet({
      ...baseParams,
      clientId: 'js/fetch',
      path: '/users/{userId}',
    })

    expect(result).toBe("fetch('https://api.example.com/users/{userId}')")
  })

  it('returns custom code sample source when clientId starts with "custom"', async () => {
    const customCodeSamples: XCodeSample[] = [
      {
        lang: 'python',
        label: 'Python Example',
        source: 'import requests\nresponse = requests.get("https://api.example.com")',
      },
      {
        lang: 'javascript',
        label: 'JavaScript Example',
        source: 'fetch("https://api.example.com")',
      },
    ]

    const result = await generateCodeSnippet({
      ...baseParams,
      clientId: 'custom/python',
      customCodeSamples,
    })

    expect(result).toBe('import requests\nresponse = requests.get("https://api.example.com")')
  })

  it('returns "Custom example not found" when custom clientId does not match any custom code sample', async () => {
    const customCodeSamples: XCodeSample[] = [
      {
        lang: 'python',
        label: 'Python Example',
        source: 'import requests',
      },
    ]

    const result = await generateCodeSnippet({
      ...baseParams,
      clientId: 'custom/ruby',
      customCodeSamples,
    })

    expect(result).toBe('Custom example not found')
  })

  it('returns error message when getSnippet fails', async () => {
    // Mock console.error to suppress expected error output
    consoleErrorSpy.mockImplementation(() => {
      // Intentionally empty to suppress console output
    })

    const result = await generateCodeSnippet({
      ...baseParams,
      clientId: 'js/fetch',
      // @ts-expect-error - testing undefined
      operation: undefined,
    })

    expect(result).toBe('Error generating code snippet')
    expect(consoleErrorSpy).toHaveBeenCalledWith('[generateCodeSnippet]', expect.any(Error))
  })

  it('generates code snippet with request body and content type', async () => {
    const code = await generateCodeSnippet({
      ...baseParams,
      clientId: 'python/requests',
      operation: {
        ...mockOperation,
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    default: 'Marc',
                  },
                },
              },
            },
          },
        },
      },
      method: 'post',
      contentType: 'application/json',
      securitySchemes: [],
    })

    expect(code).toBe(`requests.post("https://api.example.com/users",
    headers={
      "Content-Type": "application/json"
    },
    json={
      "name": "Marc"
    }
)`)
  })

  it('generates code snippet with different client formats', async () => {
    const code = await generateCodeSnippet({
      ...baseParams,
      clientId: 'node/axios',
    })

    expect(code).toBe(`const axios = require('axios').default;

const options = {method: 'GET', url: 'https://api.example.com/users'};

try {
  const { data } = await axios.request(options);
  console.log(data);
} catch (error) {
  console.error(error);
}`)
  })

  it('processes different clientId formats without errors', async () => {
    const testCases: Array<{ input: AvailableClient; expectedClient: string }> = [
      { input: 'js/fetch', expectedClient: 'fetch' },
      { input: 'python/requests', expectedClient: 'requests' },
      { input: 'node/axios', expectedClient: 'axios' },
      { input: 'shell/curl', expectedClient: 'curl' },
    ]

    for (const { input, expectedClient } of testCases) {
      const result = await generateCodeSnippet({
        ...baseParams,
        clientId: input,
        path: '/test',
      })

      expect(result).toContain(expectedClient)
    }
  })

  it('returns error message and logs error when exception is thrown', async () => {
    // Mock console.error to suppress expected error output
    consoleErrorSpy.mockImplementation(() => {
      // Intentionally empty to suppress console output
    })

    const result = await generateCodeSnippet({
      ...baseParams,
      clientId: 'js/fetch',
      // @ts-expect-error - testing invalid input
      operation: null,
    })

    expect(result).toBe('Error generating code snippet')
    expect(consoleErrorSpy).toHaveBeenCalledWith('[generateCodeSnippet]', expect.any(Error))
  })
})
