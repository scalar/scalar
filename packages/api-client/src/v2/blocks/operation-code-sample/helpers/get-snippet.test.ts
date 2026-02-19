import type { ClientId, TargetId } from '@scalar/snippetz'
import { consoleErrorSpy } from '@test/vitest.setup'
import type { Request as HarRequest } from 'har-format'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSnippet } from './get-snippet'

describe('get-snippet', () => {
  const mockHarRequest: HarRequest = {
    method: 'GET',
    url: 'https://api.example.com/users',
    httpVersion: 'HTTP/1.1',
    headers: [],
    queryString: [],
    cookies: [],
    headersSize: -1,
    bodySize: -1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('generates a code snippet for a valid request', () => {
      const [error, payload] = getSnippet('js', 'fetch', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toBe("fetch('https://api.example.com/users')")
    })

    it('generates code snippet for different target and client combinations', () => {
      const testCases: Array<{ target: TargetId; client: ClientId<TargetId>; expectedContent: string }> = [
        { target: 'js', client: 'fetch', expectedContent: 'fetch' },
        { target: 'node', client: 'axios', expectedContent: 'axios' },
        { target: 'python', client: 'requests', expectedContent: 'requests' },
        { target: 'shell', client: 'curl', expectedContent: 'curl' },
      ]

      testCases.forEach(({ target, client, expectedContent }) => {
        const [error, payload] = getSnippet(target, client, mockHarRequest)

        expect(error).toBeNull()
        expect(payload).toContain(expectedContent)
      })
    })

    it('handles javascript target by converting it to js', () => {
      const [error, payload] = getSnippet('javascript', 'fetch', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toBe("fetch('https://api.example.com/users')")
    })
  })

  describe('URL validation', () => {
    it('returns error when URL is missing', () => {
      const requestWithoutUrl: HarRequest = {
        ...mockHarRequest,
        url: '',
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithoutUrl)

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Please enter a URL to see a code snippet')
      expect(payload).toBeNull()
    })

    it('returns error when URL is undefined', () => {
      const requestWithUndefinedUrl: HarRequest = {
        ...mockHarRequest,
        url: undefined as unknown as string,
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithUndefinedUrl)

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Please enter a URL to see a code snippet')
      expect(payload).toBeNull()
    })

    it('handles valid absolute URLs', () => {
      const validUrls = [
        'https://api.example.com/users',
        'http://localhost:3000/api',
        'https://sub.domain.example.com:8080/path',
      ]

      validUrls.forEach((url) => {
        const [error, payload] = getSnippet('js', 'fetch', {
          ...mockHarRequest,
          url,
        })

        expect(error).toBeNull()
        expect(payload).toContain(url)
      })
    })

    it('handles relative URLs by prefixing with placeholder', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: '/api/users',
      })

      expect(error).toBeNull()
      expect(payload).toBe("fetch('/api/users')")
      expect(consoleErrorSpy).toHaveBeenCalledWith('[getSnippet] Invalid URL', expect.any(Error))
    })

    it('handles URLs without protocol by prefixing with placeholder', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: 'api.example.com/users',
      })

      expect(error).toBeNull()
      expect(payload).toBe("fetch('api.example.com/users')")
      expect(consoleErrorSpy).toHaveBeenCalledWith('[getSnippet] Invalid URL', expect.any(Error))
    })

    it('handles relative URLs starting with slash correctly', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: '/api/users',
      })

      expect(error).toBeNull()
      expect(payload).toBe("fetch('/api/users')")
    })

    it('handles relative URLs not starting with slash correctly', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: 'api/users',
      })

      expect(error).toBeNull()
      expect(payload).toBe("fetch('api/users')")
    })
  })

  describe('JSON body validation', () => {
    it('returns error when JSON body is invalid', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      const requestWithInvalidJson: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/json',
          text: '{ invalid json }',
        },
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithInvalidJson)

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Invalid JSON body')
      expect(payload).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('[getSnippet] Invalid JSON body', expect.any(Error))
    })

    it('accepts valid JSON body', () => {
      const requestWithValidJson: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/json',
          text: '{"name":"John","age":30}',
        },
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithValidJson)

      expect(error).toBeNull()
      expect(payload).toContain('John')
    })

    it('accepts empty JSON object', () => {
      const requestWithEmptyJson: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/json',
          text: '{}',
        },
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithEmptyJson)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('accepts JSON body with nested objects and arrays', () => {
      const complexJson = JSON.stringify({
        user: {
          name: 'John',
          roles: ['admin', 'user'],
          metadata: {
            created: '2024-01-01',
            tags: ['tag1', 'tag2'],
          },
        },
      })

      const requestWithComplexJson: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/json',
          text: complexJson,
        },
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithComplexJson)

      expect(error).toBeNull()
      expect(payload).toContain('John')
    })

    it('handles empty text in JSON postData', () => {
      const requestWithEmptyText: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/json',
          text: '',
        },
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithEmptyText)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('handles missing text in JSON postData', () => {
      const requestWithMissingText: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/json',
          text: '',
        },
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithMissingText)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('does not validate non-JSON content types', () => {
      const requestWithXml: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/xml',
          text: '<invalid>xml',
        },
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithXml)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('does not validate text/plain content', () => {
      const requestWithText: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'text/plain',
          text: 'any text content',
        },
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithText)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })
  })

  describe('plugin availability', () => {
    it('returns error when plugin does not exist', () => {
      const [error, payload] = getSnippet('nonexistent' as TargetId, 'fake' as ClientId<TargetId>, mockHarRequest)

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('No snippet found')
      expect(payload).toBeNull()
    })

    it('returns error when target exists but client does not', () => {
      const [error, payload] = getSnippet('js', 'nonexistent' as ClientId<'js'>, mockHarRequest)

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('No snippet found')
      expect(payload).toBeNull()
    })

    it('handles malformed method gracefully', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      /**
       * Testing with a malformed method value.
       * Snippetz attempts to generate but may fail internally.
       */
      const invalidRequest: HarRequest = {
        ...mockHarRequest,
        method: null as unknown as string,
        url: 'https://api.example.com',
      }

      const [error, payload] = getSnippet('js', 'fetch', invalidRequest)

      /**
       * When snippetz.print fails or returns null, we return an error.
       */
      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Error generating snippet')
      expect(payload).toBeNull()
    })
  })

  describe('request with headers', () => {
    it('generates snippet with custom headers', () => {
      const requestWithHeaders: HarRequest = {
        ...mockHarRequest,
        headers: [
          { name: 'Authorization', value: 'Bearer token123' },
          { name: 'Content-Type', value: 'application/json' },
        ],
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithHeaders)

      expect(error).toBeNull()
      expect(payload).toContain('Authorization')
      expect(payload).toContain('Bearer token123')
    })

    it('generates snippet with multiple headers', () => {
      const requestWithMultipleHeaders: HarRequest = {
        ...mockHarRequest,
        headers: [
          { name: 'X-API-Key', value: 'key123' },
          { name: 'X-Custom-Header', value: 'custom-value' },
          { name: 'Accept', value: 'application/json' },
        ],
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithMultipleHeaders)

      expect(error).toBeNull()
      expect(payload).toContain('X-API-Key')
      expect(payload).toContain('X-Custom-Header')
    })
  })

  describe('request with query parameters', () => {
    it('generates snippet with query parameters', () => {
      const requestWithQuery: HarRequest = {
        ...mockHarRequest,
        url: 'https://api.example.com/users',
        queryString: [
          { name: 'page', value: '1' },
          { name: 'limit', value: '10' },
        ],
      }

      const [error, payload] = getSnippet('shell', 'curl', requestWithQuery)

      expect(error).toBeNull()
      expect(payload).toContain('page=1')
      expect(payload).toContain('limit=10')
    })

    it('generates snippet with special characters in query parameters', () => {
      const requestWithSpecialChars: HarRequest = {
        ...mockHarRequest,
        url: 'https://api.example.com/search',
        queryString: [{ name: 'q', value: 'hello world & stuff' }],
      }

      const [error, payload] = getSnippet('shell', 'curl', requestWithSpecialChars)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })
  })

  describe('request with body', () => {
    it('generates snippet with JSON body', () => {
      const requestWithBody: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/json',
          text: '{"name":"John","email":"john@example.com"}',
        },
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithBody)

      expect(error).toBeNull()
      expect(payload).toContain('John')
      expect(payload).toContain('john@example.com')
    })

    it('generates snippet with form data', () => {
      const requestWithFormData: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/x-www-form-urlencoded',
          params: [
            { name: 'username', value: 'john' },
            { name: 'password', value: 'secret' },
          ],
        },
      }

      const [error, payload] = getSnippet('shell', 'curl', requestWithFormData)

      expect(error).toBeNull()
      expect(payload).toContain('username')
      expect(payload).toContain('john')
    })

    it('generates snippet with multipart form data', () => {
      const requestWithMultipart: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'multipart/form-data',
          params: [
            { name: 'file', value: '@filename' },
            { name: 'description', value: 'A test file' },
          ],
        },
      }

      const [error, payload] = getSnippet('shell', 'curl', requestWithMultipart)

      expect(error).toBeNull()
      expect(payload).toContain('file')
      expect(payload).toContain('description')
    })

    it('generates snippet with text/plain body', () => {
      const requestWithText: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'text/plain',
          text: 'Plain text content',
        },
      }

      const [error, payload] = getSnippet('shell', 'curl', requestWithText)

      expect(error).toBeNull()
      expect(payload).toContain('Plain text content')
    })
  })

  describe('request with cookies', () => {
    it('generates snippet with cookies', () => {
      const requestWithCookies: HarRequest = {
        ...mockHarRequest,
        cookies: [
          { name: 'session_id', value: 'abc123' },
          { name: 'user_token', value: 'xyz789' },
        ],
      }

      const [error, payload] = getSnippet('shell', 'curl', requestWithCookies)

      expect(error).toBeNull()
      expect(payload).toContain('session_id')
      expect(payload).toContain('abc123')
    })
  })

  describe('different HTTP methods', () => {
    it('generates snippet for GET request', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        method: 'GET',
      })

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('generates snippet for POST request', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/json',
          text: '{"data":"test"}',
        },
      })

      expect(error).toBeNull()
      expect(payload).toContain('POST')
    })

    it('generates snippet for PUT request', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        method: 'PUT',
        postData: {
          mimeType: 'application/json',
          text: '{"data":"test"}',
        },
      })

      expect(error).toBeNull()
      expect(payload).toContain('PUT')
    })

    it('generates snippet for DELETE request', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        method: 'DELETE',
      })

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('generates snippet for PATCH request', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        method: 'PATCH',
        postData: {
          mimeType: 'application/json',
          text: '{"data":"test"}',
        },
      })

      expect(error).toBeNull()
      expect(payload).toContain('PATCH')
    })
  })

  describe('different target languages', () => {
    it('generates Python requests snippet', () => {
      const [error, payload] = getSnippet('python', 'requests', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toContain('requests')
      expect(payload).toContain('https://api.example.com/users')
    })

    it('generates Node.js axios snippet', () => {
      const [error, payload] = getSnippet('node', 'axios', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toContain('axios')
      expect(payload).toContain('https://api.example.com/users')
    })

    it('generates shell curl snippet', () => {
      const [error, payload] = getSnippet('shell', 'curl', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toContain('curl')
      expect(payload).toContain('https://api.example.com/users')
    })

    it('generates Go native snippet', () => {
      const [error, payload] = getSnippet('go', 'native', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toContain('http')
      expect(payload).toContain('https://api.example.com/users')
    })

    it('generates PHP curl snippet', () => {
      const [error, payload] = getSnippet('php', 'curl', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toContain('curl')
      expect(payload).toContain('https://api.example.com/users')
    })
  })

  describe('complex request scenarios', () => {
    it('generates snippet with headers, query params, and body', () => {
      const complexRequest: HarRequest = {
        method: 'POST',
        url: 'https://api.example.com/users',
        httpVersion: 'HTTP/1.1',
        headers: [
          { name: 'Authorization', value: 'Bearer token123' },
          { name: 'Content-Type', value: 'application/json' },
        ],
        queryString: [
          { name: 'notify', value: 'true' },
          { name: 'source', value: 'api' },
        ],
        cookies: [{ name: 'session', value: 'xyz' }],
        postData: {
          mimeType: 'application/json',
          text: '{"name":"Jane","role":"admin"}',
        },
        headersSize: -1,
        bodySize: -1,
      }

      const [error, payload] = getSnippet('python', 'requests', complexRequest)

      expect(error).toBeNull()
      expect(payload).toContain('Authorization')
      expect(payload).toContain('Bearer token123')
      expect(payload).toContain('notify')
      expect(payload).toContain('Jane')
    })

    it('generates snippet with path parameters in URL', () => {
      const requestWithPathParams: HarRequest = {
        ...mockHarRequest,
        url: 'https://api.example.com/users/123/posts/456',
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithPathParams)

      expect(error).toBeNull()
      expect(payload).toContain('users/123/posts/456')
    })

    it('generates snippet with authentication in headers', () => {
      const requestWithAuth: HarRequest = {
        ...mockHarRequest,
        headers: [
          { name: 'Authorization', value: 'Basic dXNlcjpwYXNz' },
          { name: 'X-API-Version', value: 'v2' },
        ],
      }

      const [error, payload] = getSnippet('shell', 'curl', requestWithAuth)

      expect(error).toBeNull()
      expect(payload).toContain('Authorization')
      expect(payload).toContain('Basic dXNlcjpwYXNz')
    })
  })

  describe('error handling', () => {
    it('handles malformed request gracefully', () => {
      /**
       * Snippetz is robust and handles malformed requests gracefully.
       * Even with null headers, it generates a valid snippet.
       */
      const malformedRequest = {
        ...mockHarRequest,
        headers: null as unknown as Array<{ name: string; value: string }>,
      }

      const [error, payload] = getSnippet('js', 'fetch', malformedRequest)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('logs error to console when URL is invalid', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: '/relative/path',
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith('[getSnippet] Invalid URL', expect.any(Error))
    })

    it('logs error to console when JSON is invalid', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      getSnippet('js', 'fetch', {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/json',
          text: '{ broken json',
        },
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith('[getSnippet] Invalid JSON body', expect.any(Error))
    })

    it('logs error to console when snippet generation fails', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      const malformedRequest = {
        ...mockHarRequest,
        method: undefined as unknown as string,
      }

      getSnippet('js', 'fetch', malformedRequest)

      expect(consoleErrorSpy).toHaveBeenCalledWith('[getSnippet] Error generating snippet', expect.any(Error))
    })
  })

  describe('URL prefix replacement', () => {
    it('removes invalid URL prefix from generated snippet', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: '/api/users',
      })

      expect(error).toBeNull()
      expect(payload).not.toContain('ws://replace.me')
      expect(payload).toBe("fetch('/api/users')")
    })

    it('removes invalid URL prefix with separator from generated snippet', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: 'api/users',
      })

      expect(error).toBeNull()
      expect(payload).not.toContain('ws://replace.me')
      expect(payload).toBe("fetch('api/users')")
    })

    it('does not modify valid URLs', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: 'https://api.example.com/users',
      })

      expect(error).toBeNull()
      expect(payload).toBe("fetch('https://api.example.com/users')")
      expect(payload).not.toContain('ws://replace.me')
    })
  })

  describe('edge cases', () => {
    it('handles empty headers array', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        headers: [],
      })

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('handles empty query string array', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        queryString: [],
      })

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('handles empty cookies array', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        cookies: [],
      })

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('handles request with no postData', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        postData: undefined,
      })

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('handles URL with port number', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: 'https://api.example.com:8443/users',
      })

      expect(error).toBeNull()
      expect(payload).toContain('8443')
    })

    it('handles URL with authentication in URL', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: 'https://user:pass@api.example.com/users',
      })

      expect(error).toBeNull()
      expect(payload).toContain('user:pass')
    })

    it('handles URL with fragment', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: 'https://api.example.com/users#section',
      })

      expect(error).toBeNull()
      expect(payload).toContain('#section')
    })

    it('handles very long URLs', () => {
      const longPath = '/api/' + 'segment/'.repeat(50) + 'users'
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: `https://api.example.com${longPath}`,
      })

      expect(error).toBeNull()
      expect(payload).toContain('segment')
    })

    it('handles URLs with encoded characters', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: 'https://api.example.com/search?q=hello%20world',
      })

      expect(error).toBeNull()
      expect(payload).toContain('hello%20world')
    })

    it('handles empty string values in headers', () => {
      const requestWithEmptyHeader: HarRequest = {
        ...mockHarRequest,
        headers: [{ name: 'X-Custom-Header', value: '' }],
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithEmptyHeader)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('handles empty string values in query parameters', () => {
      const requestWithEmptyQuery: HarRequest = {
        ...mockHarRequest,
        queryString: [{ name: 'filter', value: '' }],
      }

      const [error, payload] = getSnippet('shell', 'curl', requestWithEmptyQuery)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })
  })

  describe('different client variations', () => {
    it('generates snippet with node/fetch client', () => {
      const [error, payload] = getSnippet('node', 'fetch', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toContain('fetch')
    })

    it('generates snippet with node/axios client', () => {
      const [error, payload] = getSnippet('node', 'axios', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toContain('axios')
    })

    it('generates snippet with python/python3', () => {
      const [error, payload] = getSnippet('python', 'python3', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toContain('http.client')
    })

    it('generates snippet with shell/httpie client', () => {
      const [error, payload] = getSnippet('shell', 'httpie', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toContain('http')
    })

    it('generates snippet with shell/wget client', () => {
      const [error, payload] = getSnippet('shell', 'wget', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toContain('wget')
    })
  })

  describe('return value structure', () => {
    it('returns tuple with null error and string payload on success', () => {
      const result = getSnippet('js', 'fetch', mockHarRequest)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0]).toBeNull()
      expect(typeof result[1]).toBe('string')
    })

    it('returns tuple with Error and null payload on failure', () => {
      const result = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: '',
      })

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Error)
      expect(result[1]).toBeNull()
    })

    it('returns non-empty string payload for valid requests', () => {
      const [error, payload] = getSnippet('js', 'fetch', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
      if (payload) {
        expect(payload.length).toBeGreaterThan(0)
      }
    })
  })

  describe('real-world scenarios', () => {
    it('generates snippet for authenticated API request with JSON body', () => {
      const realWorldRequest: HarRequest = {
        method: 'POST',
        url: 'https://api.github.com/repos/owner/repo/issues',
        httpVersion: 'HTTP/1.1',
        headers: [
          { name: 'Authorization', value: 'token ghp_xxxxxxxxxxxx' },
          { name: 'Accept', value: 'application/vnd.github.v3+json' },
          { name: 'Content-Type', value: 'application/json' },
        ],
        queryString: [],
        cookies: [],
        postData: {
          mimeType: 'application/json',
          text: '{"title":"Bug report","body":"Something is broken","labels":["bug"]}',
        },
        headersSize: -1,
        bodySize: -1,
      }

      const [error, payload] = getSnippet('python', 'requests', realWorldRequest)

      expect(error).toBeNull()
      expect(payload).toContain('Authorization')
      expect(payload).toContain('Bug report')
      expect(payload).toContain('github.com')
    })

    it('generates snippet for GraphQL request', () => {
      const graphqlRequest: HarRequest = {
        method: 'POST',
        url: 'https://api.example.com/graphql',
        httpVersion: 'HTTP/1.1',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        queryString: [],
        cookies: [],
        postData: {
          mimeType: 'application/json',
          text: '{"query":"{ user(id: \\"123\\") { name email } }"}',
        },
        headersSize: -1,
        bodySize: -1,
      }

      const [error, payload] = getSnippet('js', 'fetch', graphqlRequest)

      expect(error).toBeNull()
      expect(payload).toContain('graphql')
      expect(payload).toContain('query')
    })

    it('generates snippet for file upload request', () => {
      const uploadRequest: HarRequest = {
        method: 'POST',
        url: 'https://api.example.com/upload',
        httpVersion: 'HTTP/1.1',
        headers: [{ name: 'Authorization', value: 'Bearer token' }],
        queryString: [],
        cookies: [],
        postData: {
          mimeType: 'multipart/form-data',
          params: [
            { name: 'file', value: '@/path/to/file.pdf' },
            { name: 'description', value: 'Important document' },
            { name: 'category', value: 'reports' },
          ],
        },
        headersSize: -1,
        bodySize: -1,
      }

      const [error, payload] = getSnippet('shell', 'curl', uploadRequest)

      expect(error).toBeNull()
      expect(payload).toContain('file')
      expect(payload).toContain('description')
    })

    it('generates snippet for paginated API request', () => {
      const paginatedRequest: HarRequest = {
        ...mockHarRequest,
        url: 'https://api.example.com/users?page=2&per_page=50&sort=created_at&order=desc',
        queryString: [
          { name: 'page', value: '2' },
          { name: 'per_page', value: '50' },
          { name: 'sort', value: 'created_at' },
          { name: 'order', value: 'desc' },
        ],
      }

      const [error, payload] = getSnippet('shell', 'curl', paginatedRequest)

      expect(error).toBeNull()
      expect(payload).toContain('page')
      expect(payload).toContain('per_page')
      expect(payload).toContain('sort')
    })

    it('generates snippet for webhook callback request', () => {
      const webhookRequest: HarRequest = {
        method: 'POST',
        url: 'https://webhook.site/unique-id',
        httpVersion: 'HTTP/1.1',
        headers: [
          { name: 'X-Webhook-Signature', value: 'sha256=abc123' },
          { name: 'Content-Type', value: 'application/json' },
        ],
        queryString: [],
        cookies: [],
        postData: {
          mimeType: 'application/json',
          text: '{"event":"user.created","data":{"id":"123","name":"John"}}',
        },
        headersSize: -1,
        bodySize: -1,
      }

      const [error, payload] = getSnippet('python', 'requests', webhookRequest)

      expect(error).toBeNull()
      expect(payload).toContain('X-Webhook-Signature')
      expect(payload).toContain('user.created')
    })
  })

  describe('javascript to js conversion', () => {
    it('converts javascript target to js before checking plugin', () => {
      const [error, payload] = getSnippet('javascript', 'fetch', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('handles javascript target with different clients', () => {
      const [error, payload] = getSnippet('javascript', 'xhr', mockHarRequest)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })
  })

  describe('special characters handling', () => {
    it('handles URLs with unicode characters', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: 'https://api.example.com/users/名前',
      })

      expect(error).toBeNull()
      expect(payload).toContain('名前')
    })

    it('handles JSON body with unicode characters', () => {
      const requestWithUnicode: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/json',
          text: '{"name":"José","city":"São Paulo"}',
        },
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithUnicode)

      expect(error).toBeNull()
      expect(payload).toContain('José')
    })

    it('handles headers with special characters', () => {
      const requestWithSpecialHeaders: HarRequest = {
        ...mockHarRequest,
        headers: [{ name: 'X-Custom-Header', value: 'value with spaces & symbols!' }],
      }

      const [error, payload] = getSnippet('shell', 'curl', requestWithSpecialHeaders)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })
  })

  describe('content type variations', () => {
    it('handles application/json with charset', () => {
      const requestWithCharset: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/json; charset=utf-8',
          text: '{"data":"test"}',
        },
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithCharset)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('handles application/json with additional parameters', () => {
      const requestWithParams: HarRequest = {
        ...mockHarRequest,
        method: 'POST',
        postData: {
          mimeType: 'application/json; charset=utf-8; boundary=something',
          text: '{"data":"test"}',
        },
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithParams)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })
  })

  describe('HTTP version handling', () => {
    it('handles HTTP/1.1 version', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        httpVersion: 'HTTP/1.1',
      })

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('handles HTTP/2 version', () => {
      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        httpVersion: 'HTTP/2',
      })

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })
  })

  describe('size metadata', () => {
    it('handles requests with size metadata', () => {
      const requestWithSizes: HarRequest = {
        ...mockHarRequest,
        headersSize: 256,
        bodySize: 1024,
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithSizes)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })

    it('handles requests with negative size values', () => {
      const requestWithNegativeSizes: HarRequest = {
        ...mockHarRequest,
        headersSize: -1,
        bodySize: -1,
      }

      const [error, payload] = getSnippet('js', 'fetch', requestWithNegativeSizes)

      expect(error).toBeNull()
      expect(payload).toBeTruthy()
    })
  })

  describe('integration with generate-code-snippet', () => {
    it('returns ErrorResponse tuple format expected by generate-code-snippet', () => {
      const result = getSnippet('js', 'fetch', mockHarRequest)

      /**
       * The result should be a tuple [Error | null, string | null]
       * which matches the ErrorResponse type used in generate-code-snippet.ts
       */
      expect(result).toHaveLength(2)
      expect(result[0] === null || result[0] instanceof Error).toBe(true)
      expect(result[1] === null || typeof result[1] === 'string').toBe(true)
    })

    it('provides error message that can be displayed to users', () => {
      const [error] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: '',
      })

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Please enter a URL to see a code snippet')
    })

    it('provides clean payload without internal prefixes', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      const [error, payload] = getSnippet('js', 'fetch', {
        ...mockHarRequest,
        url: '/api/users',
      })

      expect(error).toBeNull()
      expect(payload).not.toContain('ws://replace.me')
    })
  })

  describe('mutation of harRequest', () => {
    it('modifies harRequest.url when URL is invalid', () => {
      consoleErrorSpy.mockImplementation(() => {
        // Suppress expected error output
      })

      const harRequest: HarRequest = {
        ...mockHarRequest,
        url: '/api/users',
      }

      getSnippet('js', 'fetch', harRequest)

      /**
       * The function mutates the harRequest object by adding the invalid URL prefix.
       * This is a side effect that callers should be aware of.
       */
      expect(harRequest.url).toContain('ws://replace.me')
    })

    it('does not modify harRequest.url when URL is valid', () => {
      const originalUrl = 'https://api.example.com/users'
      const harRequest: HarRequest = {
        ...mockHarRequest,
        url: originalUrl,
      }

      getSnippet('js', 'fetch', harRequest)

      expect(harRequest.url).toBe(originalUrl)
    })
  })
})
