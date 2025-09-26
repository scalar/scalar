import type { AvailableClients } from '@scalar/snippetz'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { generateCodeSnippet } from './generate-code-snippet'

describe('generate-code-snippet', () => {
  const mockOperation: OperationObject = {
    responses: {
      '200': {
        description: 'OK',
      },
    },
  }

  const mockServer = { url: 'https://api.example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateCodeSnippet', () => {
    it('returns generated code snippet when successful', () => {
      const result = generateCodeSnippet({
        clientId: 'js/fetch',
        operation: mockOperation,
        method: 'get',
        path: '/users/{userId}',
        server: mockServer,
      })

      expect(result).toBe("fetch('https://api.example.com/users/{userId}')")
    })

    it('returns error message when getSnippet fails', () => {
      const result = generateCodeSnippet({
        clientId: 'js/fetch',
        // @ts-expect-error - testing undefined
        operation: undefined,
        method: 'get',
        path: '/users',
        server: mockServer,
      })

      expect(result).toBe('Error generating code snippet')
    })

    it('calls operationToHar with all provided parameters', () => {
      const code = generateCodeSnippet({
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
        path: '/users',
        contentType: 'application/json',
        server: mockServer,
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

    it('calls getSnippet with split clientId and harRequest', () => {
      const code = generateCodeSnippet({
        clientId: 'node/axios',
        operation: mockOperation,
        method: 'get',
        path: '/users',
        server: mockServer,
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
  })

  describe('clientId parsing', () => {
    it('processes different clientId formats without errors', () => {
      const testCases: Array<{ input: AvailableClients[number]; expectedTarget: string; expectedClient: string }> = [
        { input: 'js/fetch', expectedTarget: 'js', expectedClient: 'fetch' },
        { input: 'python/requests', expectedTarget: 'python', expectedClient: 'requests' },
        { input: 'node/axios', expectedTarget: 'node', expectedClient: 'axios' },
        { input: 'shell/curl', expectedTarget: 'shell', expectedClient: 'curl' },
      ]

      testCases.forEach(({ input, expectedClient }) => {
        const result = generateCodeSnippet({
          clientId: input,
          operation: mockOperation,
          method: 'get',
          path: '/test',
          server: mockServer,
        })

        // The function should work without throwing errors
        expect(result).toContain(expectedClient)
      })
    })
  })
})
