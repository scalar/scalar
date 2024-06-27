import { describe, expect, it } from 'vitest'

import { createEmptySpecification, parse } from '../../../helpers'
import { getServers } from './getServers'

describe('getServers', () => {
  it('returns a single server', async () => {
    const specification = await parse(
      createEmptySpecification({
        servers: [
          {
            url: 'http://example.com',
          },
        ],
      }),
    )

    expect(getServers(specification)).toStrictEqual([
      {
        url: 'http://example.com',
      },
    ])
  })

  it('returns two servers', async () => {
    const specification = await parse(
      createEmptySpecification({
        servers: [
          {
            url: 'http://the-first-server.com',
          },
          {
            url: 'https://the-second-server.com',
          },
        ],
      }),
    )

    expect(getServers(specification)).toStrictEqual([
      {
        url: 'http://the-first-server.com',
      },
      {
        url: 'https://the-second-server.com',
      },
    ])
  })

  it('works with Swagger 2.0 files', async () => {
    const specification = await parse(
      createEmptySpecification({
        host: 'example.com',
        schemes: ['https'],
      }),
    )

    expect(getServers(specification)).toStrictEqual([
      {
        url: 'https://example.com',
      },
    ])
  })

  it('falls back to http', async () => {
    const specification = await parse(
      createEmptySpecification({
        host: 'example.com',
      }),
    )

    expect(getServers(specification)).toStrictEqual([
      {
        url: 'http://example.com',
      },
    ])
  })

  it('uses a given base server URL instead of an empty list', async () => {
    const specification = await parse(
      createEmptySpecification({
        servers: [],
      }),
    )

    expect(
      getServers(specification, {
        defaultServerUrl: 'http://example.com',
      }),
    ).toStrictEqual([
      {
        url: 'http://example.com',
      },
    ])
  })

  it('prefixes relative paths with the given server url', async () => {
    const specification = await parse(
      createEmptySpecification({
        servers: [
          {
            url: '/api',
          },
          {
            url: 'api',
          },
          {
            url: 'https://example.com/api',
          },
        ],
      }),
    )

    expect(
      getServers(specification, {
        defaultServerUrl: 'https://example.com/',
      }),
    ).toStrictEqual([
      {
        url: 'https://example.com/api',
      },
      {
        url: 'https://example.com/api',
      },
      {
        url: 'https://example.com/api',
      },
    ])
  })

  it('uses the window.location as a fallback', async () => {
    // Mock window.location
    window.location = {
      origin: 'http://localhost',
    } as unknown as Location

    const specification = await parse(
      createEmptySpecification({
        servers: [],
      }),
    )

    expect(getServers(specification)).toStrictEqual([
      {
        url: 'http://localhost',
      },
    ])
  })

  it('returns variables', async () => {
    const specification = await parse(
      createEmptySpecification({
        servers: [
          {
            url: 'https://{username}.gigantic-server.com:{port}/{basePath}',
            description: 'The production API server',
            variables: {
              username: {
                default: 'demo',
                description:
                  'this value is assigned by the service provider, in this example `gigantic-server.com`',
              },
              port: {
                enum: ['8443', '443'],
                default: '8443',
              },
              basePath: {
                default: 'v2',
              },
            },
          },
        ],
      }),
    )

    expect(getServers(specification)).toStrictEqual([
      {
        url: 'https://{username}.gigantic-server.com:{port}/{basePath}',
        description: 'The production API server',
        variables: {
          username: {
            default: 'demo',
            description:
              'this value is assigned by the service provider, in this example `gigantic-server.com`',
          },
          port: {
            enum: ['8443', '443'],
            default: '8443',
          },
          basePath: {
            default: 'v2',
          },
        },
      },
    ])
  })

  it('adds variables from URLs', async () => {
    const specification = await parse(
      createEmptySpecification({
        servers: [
          {
            url: 'https://example.com/{basePath}',
          },
        ],
      }),
    )

    expect(getServers(specification)).toStrictEqual([
      {
        url: 'https://example.com/{basePath}',
        variables: {
          basePath: {},
        },
      },
    ])
  })
})
