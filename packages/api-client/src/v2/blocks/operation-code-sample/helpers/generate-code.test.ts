import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import type {
  OperationObject,
  SecuritySchemeObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it, vi } from 'vitest'

import { generateCode } from './generate-code'
import * as generateCodeSnippetModule from './generate-code-snippet'

/**
 * Mock the generateCodeSnippet module to avoid external dependencies.
 * We need to test the generateCode function in isolation.
 */
vi.mock('./generate-code-snippet', () => ({
  generateCodeSnippet: vi.fn(),
}))

describe('generateCode', () => {
  const mockOperation: OperationObject = {
    summary: 'Test operation',
    responses: {},
  }

  const mockServer: ServerObject = {
    url: 'https://api.example.com',
  }

  const mockSecuritySchemes: SecuritySchemeObject[] = []

  const baseParams = {
    method: 'GET' as HttpMethod,
    operation: mockOperation,
    path: '/users',
    securitySchemes: mockSecuritySchemes,
    server: mockServer,
    exampleKey: 'default',
    contentType: 'application/json',
    customCodeSamples: [],
  }

  it('should return empty string when clientId is undefined', () => {
    const result = generateCode({
      ...baseParams,
      clientId: undefined,
    })

    expect(result).toBe('')
  })

  it('should return custom code sample source when clientId starts with "custom"', () => {
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

    const result = generateCode({
      ...baseParams,
      clientId: 'custom/python',
      customCodeSamples,
    })

    expect(result).toBe('import requests\nresponse = requests.get("https://api.example.com")')
  })

  it('should return "Custom example not found" when custom clientId does not match any custom code sample', () => {
    const customCodeSamples: XCodeSample[] = [
      {
        lang: 'python',
        label: 'Python Example',
        source: 'import requests',
      },
    ]

    const result = generateCode({
      ...baseParams,
      clientId: 'custom/ruby',
      customCodeSamples,
    })

    expect(result).toBe('Custom example not found')
  })

  it('should call generateCodeSnippet with correct parameters for standard client', () => {
    const mockGenerateCodeSnippet = vi.mocked(generateCodeSnippetModule.generateCodeSnippet)
    mockGenerateCodeSnippet.mockReturnValue('const response = fetch("https://api.example.com/users")')

    const result = generateCode({
      ...baseParams,
      clientId: 'javascript/fetch',
    })

    expect(mockGenerateCodeSnippet).toHaveBeenCalledWith({
      clientId: 'javascript/fetch',
      operation: mockOperation,
      method: 'GET',
      server: mockServer,
      securitySchemes: mockSecuritySchemes,
      contentType: 'application/json',
      path: '/users',
      example: 'default',
    })

    expect(result).toBe('const response = fetch("https://api.example.com/users")')
  })

  it('should return empty string and log error when generateCodeSnippet throws an exception', () => {
    const mockGenerateCodeSnippet = vi.mocked(generateCodeSnippetModule.generateCodeSnippet)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const testError = new Error('Network error generating snippet')
    mockGenerateCodeSnippet.mockImplementation(() => {
      throw testError
    })

    const result = generateCode({
      ...baseParams,
      clientId: 'python/requests',
    })

    expect(result).toBe('')
    expect(consoleErrorSpy).toHaveBeenCalledWith('[generateSnippet]', testError)

    consoleErrorSpy.mockRestore()
  })
})
