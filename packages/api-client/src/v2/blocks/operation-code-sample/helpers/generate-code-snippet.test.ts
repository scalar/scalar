import type { AvailableClients } from '@scalar/snippetz'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateCodeSnippet } from './generate-code-snippet'

// Import the mocked functions
import { getSnippet as _getSnippet } from '@scalar/api-client/views/Components/CodeSnippet'
import { operationToHar as _operationToHar } from '@scalar/oas-utils/helpers/operation-to-har'

// Mock the dependencies
vi.mock('@scalar/oas-utils/helpers/operation-to-har', () => ({
  operationToHar: vi.fn(),
}))

vi.mock('@scalar/api-client/views/Components/CodeSnippet', () => ({
  getSnippet: vi.fn(),
}))

// Cast to Mocks
const operationToHar = _operationToHar as Mock
const getSnippet = _getSnippet as Mock

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
      operationToHar.mockReturnValue({
        method: 'GET',
        url: 'https://api.example.com/users/123',
        headers: [],
        queryString: [],
      })

      getSnippet.mockReturnValue([null, "fetch('/users/123')"])

      const result = generateCodeSnippet({
        clientId: 'js/fetch',
        operation: mockOperation,
        method: 'get',
        path: '/users/{userId}',
        example: { userId: '123' },
        server: mockServer,
      })

      expect(result).toBe("fetch('/users/123')")
    })

    it('returns error message when getSnippet fails', () => {
      operationToHar.mockReturnValue({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [],
        queryString: [],
      })

      getSnippet.mockReturnValue([{ message: 'Failed to generate snippet' }, null])

      const result = generateCodeSnippet({
        clientId: 'js/fetch',
        operation: mockOperation,
        method: 'get',
        path: '/users',
        example: { userId: '123' },
        server: mockServer,
      })

      expect(result).toBe('Failed to generate snippet')
    })

    it('returns default error message when getSnippet error lacks message property', () => {
      operationToHar.mockReturnValue({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [],
        queryString: [],
      })

      getSnippet.mockReturnValue([{}, null])

      const result = generateCodeSnippet({
        clientId: 'js/fetch',
        operation: mockOperation,
        method: 'get',
        path: '/users',
        example: { userId: '123' },
        server: mockServer,
      })

      expect(result).toBe('Error generating code snippet')
    })

    it('calls operationToHar with all provided parameters', () => {
      operationToHar.mockReturnValue({
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: [],
        queryString: [],
      })

      getSnippet.mockReturnValue([null, 'snippet'])

      generateCodeSnippet({
        clientId: 'python/requests',
        operation: mockOperation,
        method: 'post',
        path: '/users',
        example: { name: 'John' },
        contentType: 'application/json',
        server: mockServer,
        securitySchemes: [],
      })

      expect(operationToHar).toHaveBeenCalledWith({
        operation: mockOperation,
        method: 'post',
        path: '/users',
        example: { name: 'John' },
        contentType: 'application/json',
        server: mockServer,
        securitySchemes: [],
      })
    })

    it('calls getSnippet with split clientId and harRequest', () => {
      const mockHarRequest = {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [],
        queryString: [],
      }

      operationToHar.mockReturnValue(mockHarRequest)
      getSnippet.mockReturnValue([null, 'snippet'])

      generateCodeSnippet({
        clientId: 'node/axios',
        operation: mockOperation,
        method: 'get',
        path: '/users',
        example: null,
        server: mockServer,
      })

      expect(getSnippet).toHaveBeenCalledWith('node', 'axios', mockHarRequest)
    })
  })

  describe('clientId parsing', () => {
    it('processes different clientId formats without errors', () => {
      operationToHar.mockReturnValue({
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [],
        queryString: [],
      })

      getSnippet.mockReturnValue([null, 'snippet'])

      const testCases: Array<{ input: AvailableClients[number]; expectedTarget: string; expectedClient: string }> = [
        { input: 'js/fetch', expectedTarget: 'js', expectedClient: 'fetch' },
        { input: 'python/requests', expectedTarget: 'python', expectedClient: 'requests' },
        { input: 'node/axios', expectedTarget: 'node', expectedClient: 'axios' },
        { input: 'shell/curl', expectedTarget: 'shell', expectedClient: 'curl' },
      ]

      testCases.forEach(({ input }) => {
        const result = generateCodeSnippet({
          clientId: input,
          operation: mockOperation,
          method: 'get',
          path: '/test',
          example: null,
          server: mockServer,
        })

        // The function should work without throwing errors
        expect(result).toBeDefined()
      })
    })

    it('handles all supported client types successfully', () => {
      operationToHar.mockReturnValue({
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [],
        queryString: [],
      })

      getSnippet.mockReturnValue([null, 'snippet'])

      const clientTypes = ['js/fetch', 'js/axios', 'python/requests', 'node/fetch', 'shell/curl'] as const

      clientTypes.forEach((clientId) => {
        expect(() => {
          generateCodeSnippet({
            clientId,
            operation: mockOperation,
            method: 'get',
            path: '/test',
            example: null,
            server: mockServer,
          })
        }).not.toThrow()
      })
    })
  })
})
