import { describe, expect, it } from 'vitest'

import { toCliSnippet } from './to-cli-snippet.js'

describe('to-cli-snippet', () => {
  it('produces verb+path form when no spec', () => {
    const cmd = toCliSnippet({
      method: 'GET',
      path: '/planets',
      specPath: 'openapi.yaml',
    })
    expect(cmd).toContain('openapi-cli')
    expect(cmd).toContain('-s openapi.yaml')
    expect(cmd).toContain('get')
    expect(cmd).toContain('/planets')
  })

  it('produces resource+action form when spec has matching operation', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0' },
      paths: {
        '/planets': {
          get: {
            operationId: 'getAllData',
            parameters: [{ name: 'limit', in: 'query' }],
          },
        },
      },
    }
    const cmd = toCliSnippet({
      method: 'get',
      path: '/planets',
      specPath: 'spec.yaml',
      spec: spec as never,
      query: { limit: '10' },
    })
    expect(cmd).toContain('planets')
    expect(cmd).toContain('getAllData')
    expect(cmd).toContain('--limit=10')
  })

  it('includes body in -d for POST', () => {
    const cmd = toCliSnippet({
      method: 'POST',
      path: '/planets',
      body: { name: 'Earth' },
      specPath: 's.yaml',
    })
    expect(cmd).toContain('-d ')
    expect(cmd).toContain('Earth')
  })

  it('uses custom cliName', () => {
    const cmd = toCliSnippet({
      cliName: 'myapi',
      method: 'GET',
      path: '/users',
    })
    expect(cmd).toMatch(/^myapi /)
  })
})
