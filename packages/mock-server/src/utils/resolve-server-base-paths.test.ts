import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { resolveServerBasePaths } from './resolve-server-base-paths'

describe('resolve-server-base-paths', () => {
  it('counts hostname variants against the budget before deduplicating paths', () => {
    const server = {
      url: 'https://{region}.{environment}.example.com/v1',
      variables: {
        region: { default: 'east', enum: ['east', 'west'] },
        environment: { default: 'dev', enum: ['dev', 'prod'] },
      },
    } satisfies OpenAPIV3_1.ServerObject
    const budget = { remaining: 4 }

    expect(resolveServerBasePaths([server], '', { remaining: 3 })).toBeUndefined()
    expect(resolveServerBasePaths([server], '', budget)).toStrictEqual(['/v1'])
    expect(budget.remaining).toBe(0)
    expect(resolveServerBasePaths([{ url: '/v2' }], '', budget)).toBeUndefined()
  })

  it.each([
    ['https://api.example.com/v1', ['/v1']],
    ['https://api.example.com/v1/', ['/v1']],
    ['https://api.example.com/api/v2', ['/api/v2']],
    ['https://api.stripe.com/', []],
    ['https://galaxy.scalar.com', []],
    ['http://localhost:8080/v1', ['/v1']],
    ['//api.example.com/v1//beta', ['/v1/beta']],
    ['/v1', ['/v1']],
    ['v1', ['/v1']],
    ['./v1', ['/v1']],
    ['../api', ['/api']],
    ['/', []],
    ['', []],
    ['https://api.example.com/v1?debug=true#top', ['/v1']],
    ['https://api.example.com/my%20api', ['/my api']],
    ['https://api.example.com/%E0%A4%A', ['/%E0%A4%A']],
    ['https://api.example.com/a%25b', ['/a%25b']],
    ['https://api.example.com//v1//beta', ['/v1/beta']],
    ['https://api.example.com/v1//../v2', ['/v2']],
    ['//api.example.com/v1//../v2', ['/v2']],
    ['api.example.com/v1', ['/v1']],
    ['api.example.com:8443/v1', ['/v1']],
    ['https://api.example.com/a%7Bb%7D', []],
    ['https://[invalid/v1', []],
  ])('resolves %s', (url, basePaths) => {
    expect(resolveServerBasePaths([{ url }])).toStrictEqual(basePaths)
  })

  it.each([
    ['a variable glued to the host', 'https://api.example.com{basePath}', { basePath: { default: '/v1' } }, ['/v1']],
    [
      'host and path variables',
      'https://{host}{basePath}',
      { host: { default: 'api.example.com' }, basePath: { default: '/v1' } },
      ['/v1'],
    ],
    [
      'a port variable',
      'https://api.example.com:{port}{basePath}',
      { port: { default: '8443' }, basePath: { default: '/v1' } },
      ['/v1'],
    ],
    ['a value that is a slash', 'https://api.example.com/{basePath}', { basePath: { default: '/' } }, []],
    ['a value that starts with a slash', '/{basePath}', { basePath: { default: '/v1' } }, ['/v1']],
    ['a host in a protocol-relative URL', '//{host}/v1', { host: { default: 'api.example.com' } }, ['/v1']],
    ['a value with braces', '/{basePath}', { basePath: { default: '{other}' } }, []],
    [
      'a value naming another variable',
      '/{first}/{second}',
      { first: { default: '{second}' }, second: { default: 'v1' } },
      [],
    ],
  ] satisfies [string, string, OpenAPIV3_1.ServerObject['variables'], string[]][])(
    'resolves %s',
    (_, url, variables, basePaths) => {
      expect(resolveServerBasePaths([{ url, variables }])).toStrictEqual(basePaths)
    },
  )

  it('serves every enum value of a path variable', () => {
    expect(
      resolveServerBasePaths([
        { url: 'https://api.example.com/{version}', variables: { version: { default: 'v1', enum: ['v1', 'v2'] } } },
      ]),
    ).toStrictEqual(['/v1', '/v2'])
  })

  it('expands the combinations of multiple path variables', () => {
    expect(
      resolveServerBasePaths([
        {
          url: '/{region}/{version}',
          variables: { region: { default: 'eu', enum: ['eu', 'us'] }, version: { default: 'v1', enum: ['v1', 'v2'] } },
        },
      ]),
    ).toStrictEqual(['/eu/v1', '/eu/v2', '/us/v1', '/us/v2'])
  })

  it('uses the same value at each occurrence of a repeated variable', () => {
    expect(
      resolveServerBasePaths([{ url: '/{region}/{region}', variables: { region: { enum: ['eu', 'us'] } } }]),
    ).toStrictEqual(['/eu/eu', '/us/us'])
  })

  it.each([
    ['a nested path', 'api/v2', ['/api/v2']],
    ['an empty string', '', []],
    ['replacement patterns', '$&', ['/$&']],
  ])('uses a default that is %s', (_, value, basePaths) => {
    expect(resolveServerBasePaths([{ url: '/{basePath}', variables: { basePath: { default: value } } }])).toStrictEqual(
      basePaths,
    )
  })

  it('uses the default when the enum is empty', () => {
    // OpenAPI 3.0 only says the enum should not be empty, so a document can still ship one.
    const variables = JSON.parse('{"version": {"default": "v1", "enum": []}}')

    expect(resolveServerBasePaths([{ url: '/{version}', variables }])).toStrictEqual(['/v1'])
  })

  it('ignores host and scheme variables', () => {
    expect(
      resolveServerBasePaths([
        {
          url: '{protocol}://{region}.example.com/v1',
          variables: {
            protocol: { default: 'https', enum: ['https', 'http'] },
            region: { default: 'eu', enum: ['eu', 'us'] },
          },
        },
      ]),
    ).toStrictEqual(['/v1'])
  })

  it('leaves out a variable path that defaults to the root', () => {
    expect(
      resolveServerBasePaths([
        { url: 'https://galaxy.scalar.com' },
        {
          url: '{protocol}://void.scalar.com/{path}',
          variables: { protocol: { default: 'https', enum: ['https', 'http'] }, path: { default: '' } },
        },
      ]),
    ).toStrictEqual([])
  })

  it.each([
    ['without an enum or default', { url: '/{tenant}/api', variables: { tenant: {} } }],
    ['that is not declared', { url: '/{tenant}/api' }],
    ['named like an inherited property', { url: '/{constructor}/api', variables: {} }],
  ] satisfies [string, OpenAPIV3_1.ServerObject][])('adds no base path for a variable %s', (_, server) => {
    expect(resolveServerBasePaths([server])).toStrictEqual([])
  })

  it('reads a variable named __proto__ as an ordinary name', () => {
    const variables = JSON.parse('{"__proto__": {"default": "v1"}}')

    expect(resolveServerBasePaths([{ url: '/{__proto__}', variables }])).toStrictEqual(['/v1'])
  })

  it('serves each base path once across servers', () => {
    expect(
      resolveServerBasePaths([
        { url: 'https://api.example.com/v1' },
        { url: 'https://staging.example.com/v1' },
        { url: 'http://localhost/v2' },
      ]),
    ).toStrictEqual(['/v1', '/v2'])
  })

  it.each([[undefined], [[]], [[{} as OpenAPIV3_1.ServerObject]]])('returns no base paths for %j', (servers) => {
    expect(resolveServerBasePaths(servers)).toStrictEqual([])
  })
})
