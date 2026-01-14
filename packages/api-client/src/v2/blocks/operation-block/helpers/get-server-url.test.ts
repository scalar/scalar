import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import { describe, expect, it } from 'vitest'

import { getServerUrl } from './get-server-url'

/**
 * Helper to create a server object with optional URL and variables.
 * Makes tests more readable by allowing partial server definitions.
 */
const createServer = (url: string = '', variables?: ServerObject['variables']): ServerObject =>
  ({
    url,
    ...(variables && { variables }),
  }) satisfies ServerObject

describe('getServerUrl', () => {
  describe('basic functionality', () => {
    it('returns the server URL when no variables exist', () => {
      const server = createServer('https://api.example.com')

      const result = getServerUrl(server, {})

      expect(result).toBe('https://api.example.com')
    })

    it('returns empty string when server is null', () => {
      const result = getServerUrl(null, {})

      expect(result).toBe('')
    })

    it('returns empty string when server URL is empty', () => {
      const server = createServer('')

      const result = getServerUrl(server, {})

      expect(result).toBe('')
    })

    it('handles server without variables property', () => {
      const server = createServer('https://api.example.com')

      const result = getServerUrl(server, {})

      expect(result).toBe('https://api.example.com')
    })
  })

  describe('environment variable replacement', () => {
    it('replaces environment variable with string value', () => {
      const server = createServer('https://{{host}}/v1')

      const result = getServerUrl(server, { host: 'api.example.com' })

      expect(result).toBe('https://api.example.com/v1')
    })

    it('replaces multiple environment variables', () => {
      const server = createServer('https://{{host}}/{{version}}')

      const result = getServerUrl(server, { host: 'api.example.com', version: 'v2' })

      expect(result).toBe('https://api.example.com/v2')
    })

    it('replaces environment variables with single curly braces', () => {
      const server = createServer('https://{host}/{version}')

      const result = getServerUrl(server, { host: 'api.example.com', version: 'v1' })

      expect(result).toBe('https://api.example.com/v1')
    })

    it('handles mixed single and double curly braces', () => {
      const server = createServer('https://{{host}}/{version}')

      const result = getServerUrl(server, { host: 'api.example.com', version: 'v1' })

      expect(result).toBe('https://api.example.com/v1')
    })

    it('handles empty environment variables array', () => {
      const server = createServer('https://{{host}}/v1')

      const result = getServerUrl(server, {})

      // Variable not found, should remain as {host}
      expect(result).toBe('https://{host}/v1')
    })

    it('preserves unreplaced variables when not found in environment', () => {
      const server = createServer('https://{{host}}/{{version}}')

      const result = getServerUrl(server, { host: 'api.example.com' })

      // host is replaced, version remains
      expect(result).toBe('https://api.example.com/{version}')
    })
  })

  describe('server variable replacement', () => {
    it('replaces multiple server variables', () => {
      const server = createServer('https://{host}/{version}', {
        host: {
          default: 'api.example.com',
        },
        version: {
          default: 'v2',
        },
      })

      const result = getServerUrl(server, {})

      expect(result).toBe('https://api.example.com/v2')
    })

    it('ignores server variable without default value', () => {
      const server = createServer('https://{host}/v1', {
        host: {
          enum: ['api.example.com', 'api.staging.example.com'],
        },
      })

      const result = getServerUrl(server, {})

      // No default, so variable remains unreplaced
      expect(result).toBe('https://{host}/v1')
    })

    it('handles server with enum and default', () => {
      const server = createServer('https://{host}/v1', {
        host: {
          default: 'api.example.com',
          enum: ['api.example.com', 'api.staging.example.com'],
        },
      })

      const result = getServerUrl(server, {})

      expect(result).toBe('https://api.example.com/v1')
    })
  })

  describe('variable precedence', () => {
    it('uses server variable when both environment and server variables exist', () => {
      const server = createServer('https://{host}/v1', {
        host: {
          default: 'api.server.com',
        },
      })

      const result = getServerUrl(server, { host: 'api.environment.com' })

      // Server variable should take precedence
      expect(result).toBe('https://api.server.com/v1')
    })

    it('uses environment variable when server variable has no default', () => {
      const server = createServer('https://{host}/v1', {
        host: {
          enum: ['option1.com', 'option2.com'],
        },
      })

      const result = getServerUrl(server, { host: 'api.environment.com' })

      // Server variable has no default, so environment variable is used
      expect(result).toBe('https://api.environment.com/v1')
    })

    it('handles mixed sources with complex URL', () => {
      const server = createServer('https://{subdomain}.{domain}/{version}/{endpoint}', {
        domain: {
          default: 'example.com',
        },
        endpoint: {
          default: 'api',
        },
      })

      const result = getServerUrl(server, { subdomain: 'api', version: 'v2', domain: 'override.com' })

      // subdomain and version come from environment
      // domain and endpoint come from server (server overrides environment for domain)
      expect(result).toBe('https://api.example.com/v2/api')
    })
  })

  describe('edge cases', () => {
    it('handles URL with query parameters containing variables', () => {
      const server = createServer('https://api.example.com?key={{apiKey}}&version={version}', {
        version: {
          default: 'v1',
        },
      })

      const result = getServerUrl(server, { apiKey: 'secret123' })

      expect(result).toBe('https://api.example.com?key=secret123&version=v1')
    })

    it('handles URL with port number and variables', () => {
      const server = createServer('https://{host}:{port}/v1', {
        port: {
          default: '8080',
        },
      })

      const result = getServerUrl(server, { host: 'localhost' })

      expect(result).toBe('https://localhost:8080/v1')
    })

    it('handles URL with path segments containing variables', () => {
      const server = createServer('https://api.example.com/{tenant}/{version}/users')

      const result = getServerUrl(server, { tenant: 'acme', version: 'v2' })

      expect(result).toBe('https://api.example.com/acme/v2/users')
    })

    it('handles variables with special characters', () => {
      const server = createServer('https://{api-host}/{version_2}')

      const result = getServerUrl(server, { 'api-host': 'api.example.com', 'version_2': 'v2' })

      expect(result).toBe('https://api.example.com/v2')
    })

    it('handles variables with dots in names', () => {
      const server = createServer('https://{api.host}/{api.version}')

      const result = getServerUrl(server, { 'api.host': 'api.example.com', 'api.version': 'v1' })

      expect(result).toBe('https://api.example.com/v1')
    })

    it('handles numeric values in variables', () => {
      const server = createServer('https://api.example.com:{port}/v{version}')

      const result = getServerUrl(server, { port: '3000', version: '1' })

      expect(result).toBe('https://api.example.com:3000/v1')
    })

    it('handles empty string variable values', () => {
      const server = createServer('https://{prefix}api.example.com/{suffix}')

      const result = getServerUrl(server, { prefix: '', suffix: 'v1' })

      // Empty string values are treated as falsy and do not replace variables
      expect(result).toBe('https://{prefix}api.example.com/v1')
    })

    it('handles URL with no protocol', () => {
      const server = createServer('{host}/api/v1')

      const result = getServerUrl(server, { host: 'api.example.com' })

      expect(result).toBe('api.example.com/api/v1')
    })

    it('handles relative URLs', () => {
      const server = createServer('/api/{version}')

      const result = getServerUrl(server, { version: 'v2' })

      expect(result).toBe('/api/v2')
    })
  })
})
