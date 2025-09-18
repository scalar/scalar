import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getFirstServer } from './get-first-server'

describe('get-first-server', () => {
  describe('getFirstServer', () => {
    it('returns the first server with a URL from a single server object', () => {
      const server: ServerObject = {
        url: 'https://api.example.com',
        description: 'Production server',
      }

      const result = getFirstServer(server)

      expect(result).toEqual(server)
    })

    it('returns the first server with a URL from an array of servers', () => {
      const servers: ServerObject[] = [
        { url: 'https://api.example.com', description: 'Production' },
        { url: 'https://staging.example.com', description: 'Staging' },
        { url: 'https://dev.example.com', description: 'Development' },
      ]

      const result = getFirstServer(servers)

      expect(result).toEqual(servers[0])
    })

    it('skips servers without URLs and returns the first valid one', () => {
      const servers: ServerObject[] = [
        // @ts-expect-error - Testing an invalid server object
        { description: 'No URL server' },
        { url: 'https://api.example.com', description: 'Valid server' },
        { url: 'https://staging.example.com', description: 'Another valid server' },
      ]

      const result = getFirstServer(servers)

      expect(result).toEqual(servers[1])
    })

    it('returns the first server from the first non-empty source', () => {
      const operationServers: ServerObject[] = [
        { url: 'https://operation.example.com', description: 'Operation server' },
      ]
      const pathItemServers: ServerObject[] = [{ url: 'https://path.example.com', description: 'Path server' }]
      const documentServer: ServerObject = {
        url: 'https://document.example.com',
        description: 'Document server',
      }

      const result = getFirstServer(operationServers, pathItemServers, documentServer)

      expect(result).toEqual(operationServers[0])
    })

    it('falls back to the next source when the first source has no valid servers', () => {
      // @ts-expect-error - Testing an invalid server object
      const operationServers: ServerObject[] = [{ description: 'No URL' }]
      const pathItemServers: ServerObject[] = [{ url: 'https://path.example.com', description: 'Path server' }]
      const documentServer: ServerObject = {
        url: 'https://document.example.com',
        description: 'Document server',
      }

      const result = getFirstServer(operationServers, pathItemServers, documentServer)

      expect(result).toEqual(pathItemServers[0])
    })

    it('handles undefined sources gracefully', () => {
      const validServer: ServerObject = {
        url: 'https://api.example.com',
        description: 'Valid server',
      }

      const result = getFirstServer(undefined, null, validServer)

      expect(result).toEqual(validServer)
    })

    it('returns undefined when no servers have URLs', () => {
      // @ts-expect-error - Testing an invalid server object
      const servers: ServerObject[] = [{ description: 'No URL 1' }, { description: 'No URL 2' }]

      const result = getFirstServer(servers)

      expect(result).toBeUndefined()
    })

    it('returns undefined when all sources are empty or undefined', () => {
      // @ts-expect-error - Testing an invalid server object
      const result = getFirstServer(undefined, [], null)

      expect(result).toBeUndefined()
    })

    it('handles empty arrays', () => {
      const result = getFirstServer([])

      expect(result).toBeUndefined()
    })

    it('prioritizes operation servers over path item servers over document servers', () => {
      const operationServer: ServerObject = {
        url: 'https://operation.example.com',
        description: 'Operation server',
      }
      const pathItemServer: ServerObject = {
        url: 'https://path.example.com',
        description: 'Path server',
      }
      const documentServer: ServerObject = {
        url: 'https://document.example.com',
        description: 'Document server',
      }

      // Test operation server priority
      let result = getFirstServer(operationServer, pathItemServer, documentServer)
      expect(result).toEqual(operationServer)

      // Test path item server priority when operation server is undefined
      result = getFirstServer(undefined, pathItemServer, documentServer)
      expect(result).toEqual(pathItemServer)

      // Test document server as fallback
      result = getFirstServer(undefined, undefined, documentServer)
      expect(result).toEqual(documentServer)
    })

    it('handles mixed server types in the same call', () => {
      const singleServer: ServerObject = {
        url: 'https://single.example.com',
        description: 'Single server',
      }
      const serverArray: ServerObject[] = [{ url: 'https://array.example.com', description: 'Array server' }]

      const result = getFirstServer(singleServer, serverArray)

      expect(result).toEqual(singleServer)
    })

    it('works with the exact usage pattern from Operation.vue', () => {
      // Simulate the exact usage from Operation.vue lines 82-90
      const operationServers: ServerObject[] = [
        { url: 'https://operation.example.com', description: 'Operation server' },
      ]
      const pathItemServers: ServerObject[] = [{ url: 'https://path.example.com', description: 'Path server' }]
      const documentServer: ServerObject = {
        url: 'https://document.example.com',
        description: 'Document server',
      }

      const result = getFirstServer(operationServers, pathItemServers, documentServer)

      expect(result).toEqual(operationServers[0])
    })
  })
})
