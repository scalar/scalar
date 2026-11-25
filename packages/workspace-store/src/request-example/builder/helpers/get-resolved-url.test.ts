import { assert, describe, expect, it } from 'vitest'

import { getServers } from '@/request-example/context/servers'
import type { ServerObject } from '@/schemas/v3.2/strict/server'

import { getResolvedUrl } from './get-resolved-url'

describe('get-resolved-url', () => {
  it.each<{ name: string; server: ServerObject; expected: string }>([
    {
      name: 'an empty string default at the end of the host',
      server: { url: 'https://api.example.com{basePath}', variables: { basePath: { default: '' } } },
      expected: 'https://api.example.com/p',
    },
    {
      name: 'an empty string default in the path',
      server: { url: 'https://api.example.com/{path}', variables: { path: { default: '' } } },
      expected: 'https://api.example.com/p',
    },
    {
      name: 'an empty string default for a Unicode variable name',
      server: { url: 'https://api.example.com{préfixe}', variables: { préfixe: { default: '' } } },
      expected: 'https://api.example.com/p',
    },
    {
      name: 'an empty string default next to a filled default',
      server: {
        url: '{protocol}://void.scalar.com/{path}',
        variables: { protocol: { default: 'https' }, path: { default: '' } },
      },
      expected: 'https://void.scalar.com/p',
    },
    {
      name: 'an empty string default that is part of the enum',
      server: {
        url: 'https://api.example.com{basePath}',
        variables: { basePath: { default: '', enum: ['', '/v2'] } },
      },
      expected: 'https://api.example.com/p',
    },
    {
      name: 'a filled default',
      server: { url: 'https://api.example.com{basePath}', variables: { basePath: { default: '/v1' } } },
      expected: 'https://api.example.com/v1/p',
    },
  ])('resolves $name', ({ server, expected }) => {
    expect(getResolvedUrl({ server, path: '/p' })).toBe(expected)
  })

  it.each([
    {
      name: 'the API description URL without its query or fragment',
      options: { documentUrl: 'https://api.example.com/openapi?format=json#servers' },
      expected: 'https://api.example.com/openapi/p',
    },
    {
      name: 'the configured base URL ahead of the API description URL',
      options: { baseServerUrl: 'https://api.example.com/gateway', documentUrl: 'https://docs.example.com/' },
      expected: 'https://api.example.com/gateway/p',
    },
  ])('uses $name when the template expands to an empty URL', ({ options, expected }) => {
    const [server] = getServers([{ url: '{basePath}', variables: { basePath: { default: '' } } }], options)
    assert(server)

    expect(server.url).toBe('{basePath}')
    expect(getResolvedUrl({ server, path: '/p' })).toBe(expected)
  })

  it.each<{ name: string; server: ServerObject }>([
    {
      name: 'a variable that is missing from the variables map',
      server: { url: 'https://api.example.com{basePath}', variables: { other: { default: '' } } },
    },
    {
      name: 'a variable without a default',
      server: { url: 'https://api.example.com{basePath}', variables: { basePath: { enum: ['/v1'] } } },
    },
  ])('keeps the placeholder for $name', ({ server }) => {
    expect(getResolvedUrl({ server, path: '/p' })).toBe('https://api.example.com{basePath}/p')
  })
})
