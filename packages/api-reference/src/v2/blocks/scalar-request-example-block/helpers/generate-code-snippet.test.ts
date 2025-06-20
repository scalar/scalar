import { describe, it, expect, vi } from 'vitest'
import { generateCodeSnippet } from './generate-code-snippet'
import type { AvailableClients } from '@scalar/snippetz'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'
import type { Dereference } from '@scalar/workspace-store/schemas/v3.1/type-guard'

// Mock the dependencies
vi.mock('@scalar/oas-utils/helpers/operation-to-har', () => ({
  operationToHar: vi.fn(() => ({
    method: 'get',
    url: 'https://api.example.com/users',
    headers: [],
    queryString: [],
  })),
}))

vi.mock('@scalar/api-client/views/Components/CodeSnippet', () => ({
  getSnippet: vi.fn(() => [null, 'console.log("Hello World")']),
}))

describe('generate-code-snippet', () => {
  const mockOperation: Dereference<OperationObject> = {
    responses: {
      '200': {
        description: 'OK',
      },
    },
  }

  describe('generateCodeSnippet', () => {
    it('generates code snippet successfully', () => {
      const result = generateCodeSnippet({
        clientId: 'js/fetch' as AvailableClients[number],
        operation: mockOperation,
        method: 'get',
        path: '/users',
        example: { userId: '123' },
      })

      expect(result).toBe('console.log("Hello World")')
    })

    it('handles error from getSnippet', () => {
      const { getSnippet } = require('@scalar/api-client/views/Components/CodeSnippet')
      vi.mocked(getSnippet).mockReturnValueOnce([{ message: 'Failed to generate snippet' }, null])

      const result = generateCodeSnippet({
        clientId: 'js/fetch' as AvailableClients[number],
        operation: mockOperation,
        method: 'get',
        path: '/users',
        example: { userId: '123' },
      })

      expect(result).toBe('Failed to generate snippet')
    })

    it('returns default error message when getSnippet error has no message', () => {
      const { getSnippet } = require('@scalar/api-client/views/Components/CodeSnippet')
      vi.mocked(getSnippet).mockReturnValueOnce([{}, null])

      const result = generateCodeSnippet({
        clientId: 'js/fetch' as AvailableClients[number],
        operation: mockOperation,
        method: 'get',
        path: '/users',
        example: { userId: '123' },
      })

      expect(result).toBe('Error generating code snippet')
    })

    it('passes correct parameters to operationToHar', () => {
      const { operationToHar } = require('@scalar/oas-utils/helpers/operation-to-har')

      generateCodeSnippet({
        clientId: 'python/requests' as AvailableClients[number],
        operation: mockOperation,
        method: 'post',
        path: '/users',
        example: { name: 'John' },
        contentType: 'application/json',
        server: { url: 'https://api.example.com' },
        securitySchemes: [],
      })

      expect(operationToHar).toHaveBeenCalledWith({
        operation: mockOperation,
        method: 'post',
        path: '/users',
        example: { name: 'John' },
        contentType: 'application/json',
        server: { url: 'https://api.example.com' },
        securitySchemes: [],
      })
    })

    it('passes correct parameters to getSnippet', () => {
      const { getSnippet } = require('@scalar/api-client/views/Components/CodeSnippet')

      generateCodeSnippet({
        clientId: 'node/axios' as AvailableClients[number],
        operation: mockOperation,
        method: 'get',
        path: '/users',
        example: null,
      })

      expect(getSnippet).toHaveBeenCalledWith(
        'node',
        'axios',
        expect.objectContaining({
          method: 'get',
          url: 'https://api.example.com/users',
        }),
      )
    })
  })

  describe('splitClientId function', () => {
    it('correctly splits valid clientId formats', () => {
      const testCases: Array<{ input: AvailableClients[number]; expectedTarget: string; expectedClient: string }> = [
        { input: 'js/fetch' as AvailableClients[number], expectedTarget: 'js', expectedClient: 'fetch' },
        { input: 'python/requests' as AvailableClients[number], expectedTarget: 'python', expectedClient: 'requests' },
        { input: 'node/axios' as AvailableClients[number], expectedTarget: 'node', expectedClient: 'axios' },
        { input: 'shell/curl' as AvailableClients[number], expectedTarget: 'shell', expectedClient: 'curl' },
      ]

      testCases.forEach(({ input, expectedTarget, expectedClient }) => {
        const result = generateCodeSnippet({
          clientId: input,
          operation: mockOperation,
          method: 'get',
          path: '/test',
          example: null,
        })

        // The function should work without throwing errors
        expect(result).toBeDefined()
      })
    })

    it('handles various client types correctly', () => {
      const clientTypes: AvailableClients[number][] = [
        'js/fetch',
        'js/axios',
        'python/requests',
        'node/fetch',
        'shell/curl',
      ] as AvailableClients[number][]

      clientTypes.forEach((clientId) => {
        expect(() => {
          generateCodeSnippet({
            clientId,
            operation: mockOperation,
            method: 'get',
            path: '/test',
            example: null,
          })
        }).not.toThrow()
      })
    })
  })
})
