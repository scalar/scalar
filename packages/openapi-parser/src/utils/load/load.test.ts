import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { stringify } from 'yaml'

import { fetchUrls } from '../../plugins/fetch-urls/fetchUrls.ts'
import { readFiles } from '../../plugins/read-files/readFiles.ts'
import { getEntrypoint } from '../getEntrypoint.ts'
import { load } from './load.ts'

global.fetch = vi.fn()

describe('load', async () => {
  beforeEach(() => {
    // @ts-expect-error
    global.fetch.mockReset()
  })

  it('loads JS object', async () => {
    const { filesystem } = await load(
      {
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      },
      {
        plugins: [readFiles(), fetchUrls()],
      },
    )

    expect(getEntrypoint(filesystem).content).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })
  })

  it('loads JSON string', async () => {
    const { filesystem } = await load(
      JSON.stringify({
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      }),
      {
        plugins: [readFiles(), fetchUrls()],
      },
    )

    expect(getEntrypoint(filesystem).content).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })
  })

  it('loads YAML string', async () => {
    const { filesystem } = await load(
      stringify({
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      }),
      {
        plugins: [readFiles(), fetchUrls()],
      },
    )

    expect(getEntrypoint(filesystem).content).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })
  })

  it('loads file', async () => {
    const EXAMPLE_FILE = path.join(new URL(import.meta.url).pathname, '../../examples/openapi.yaml')

    const { filesystem } = await load(EXAMPLE_FILE, {
      plugins: [fetchUrls(), readFiles()],
    })

    expect(filesystem).toMatchObject([
      {
        isEntrypoint: true,
        uri: EXAMPLE_FILE,
        content: {
          openapi: '3.1.0',
          info: {
            title: 'Hello World',
            version: '1.0.0',
          },
          paths: {},
        },
      },
    ])
  })

  it('loads referenced files in files', async () => {
    const EXAMPLE_FILE = path.join(new URL(import.meta.url).pathname, '../../../../tests/filesystem/api/openapi.yaml')

    const { filesystem } = await load(EXAMPLE_FILE, {
      plugins: [readFiles()],
    })

    expect(filesystem).toMatchObject([
      {
        uri: expect.stringContaining('/tests/filesystem/api/openapi.yaml'),
        references: expect.objectContaining({
          'schemas/problem.yaml': expect.any(String),
          'schemas/upload.yaml': expect.any(String),
        }),
      },
      {
        references: {},
      },
      {
        references: {
          './components/coordinates.yaml':
            '/Users/hanspagel/Documents/Projects/scalar/packages/openapi-parser/tests/filesystem/api/schemas/components/coordinates.yaml',
        },
      },
      {
        references: {},
      },
    ])

    // content
    expect(filesystem[0].content).toBeTypeOf('object')

    // only one entrypoint
    expect(filesystem.filter((entry) => entry.isEntrypoint).length).toBe(1)
  })

  it('loads url', async () => {
    // @ts-expect-error
    fetch.mockResolvedValue({
      text: async () =>
        stringify({
          openapi: '3.1.0',
          info: {
            title: 'Hello World',
            version: '1.0.0',
          },
          paths: {},
        }),
    })

    const { filesystem } = await load('https://example.com/openapi.yaml', {
      plugins: [readFiles(), fetchUrls()],
    })

    expect(getEntrypoint(filesystem).content).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })
  })

  it('resolves relative URLs to absolute ones', async () => {
    // @ts-expect-error
    fetch.mockImplementation(async (url: string) => {
      // empty document for all other URLs
      if (url !== 'https://example.com/docs/openapi.yaml') {
        return {
          text: async () => '{}',
        }
      }

      // base document
      return {
        text: async () =>
          stringify({
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {
              '/users': {
                $ref: './components/pathItem-1.yaml',
              },
              '/users/{id}': {
                $ref: 'components/pathItem-2.yaml',
              },
              '/users/{id}/posts': {
                $ref: '../docs/components/pathItem-3.yaml',
              },
              '/users/{id}/posts/{postId}': {
                $ref: 'https://example.com/docs/components/pathItem-4.yaml',
              },
            },
          }),
      }
    })

    const { filesystem } = await load('https://example.com/docs/openapi.yaml', {
      plugins: [
        fetchUrls({
          // fetch: (url) => {
          //   console.log('fetch:', url)
          //
          //   return fetch(url)
          // },
        }),
      ],
    })

    expect(filesystem).toMatchObject([
      {
        isEntrypoint: true,
        uri: 'https://example.com/docs/openapi.yaml',
        references: {
          './components/pathItem-1.yaml': 'https://example.com/docs/components/pathItem-1.yaml',
          'components/pathItem-2.yaml': 'https://example.com/docs/components/pathItem-2.yaml',
          '../docs/components/pathItem-3.yaml': 'https://example.com/docs/components/pathItem-3.yaml',
          'https://example.com/docs/components/pathItem-4.yaml': 'https://example.com/docs/components/pathItem-4.yaml',
        },
      },
      {
        isEntrypoint: false,
        uri: 'https://example.com/docs/components/pathItem-1.yaml',
        references: {},
      },
      {
        isEntrypoint: false,
        uri: 'https://example.com/docs/components/pathItem-2.yaml',
        references: {},
      },
      {
        isEntrypoint: false,
        uri: 'https://example.com/docs/components/pathItem-3.yaml',
        references: {},
      },
      {
        isEntrypoint: false,
        uri: 'https://example.com/docs/components/pathItem-4.yaml',
        references: {},
      },
    ])

    expect(fetch).toHaveBeenCalledWith('https://example.com/docs/openapi.yaml')
    expect(fetch).toHaveBeenCalledWith('https://example.com/docs/components/pathItem-1.yaml')
    expect(fetch).toHaveBeenCalledWith('https://example.com/docs/components/pathItem-2.yaml')
    expect(fetch).toHaveBeenCalledWith('https://example.com/docs/components/pathItem-3.yaml')
    expect(fetch).toHaveBeenCalledWith('https://example.com/docs/components/pathItem-4.yaml')
  })

  it('resolves relative URLs when we directly pass a document (not a URL)', async () => {
    // @ts-expect-error
    fetch.mockImplementation(async () => {
      // empty document for all URLs
      return {
        text: async () => '{}',
      }
    })

    const { filesystem } = await load(
      {
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            $ref: './components/pathItem-1.yaml',
          },
          '/users/{id}': {
            $ref: 'components/pathItem-2.yaml',
          },
          '/users/{id}/posts': {
            $ref: '../docs/components/pathItem-3.yaml',
          },
          '/users/{id}/posts/{postId}': {
            $ref: 'https://example.com/docs/components/pathItem-4.yaml',
          },
        },
      },
      {
        source: 'https://example.com/docs/openapi.yaml',
        plugins: [
          fetchUrls({
            // fetch: (url) => {
            //   console.log('fetch:', url)
            //
            //   return fetch(url)
            // },
          }),
        ],
      },
    )

    expect(filesystem).toMatchObject([
      {
        isEntrypoint: true,
        uri: 'https://example.com/docs/openapi.yaml',
        references: {
          './components/pathItem-1.yaml': 'https://example.com/docs/components/pathItem-1.yaml',
          'components/pathItem-2.yaml': 'https://example.com/docs/components/pathItem-2.yaml',
          '../docs/components/pathItem-3.yaml': 'https://example.com/docs/components/pathItem-3.yaml',
          'https://example.com/docs/components/pathItem-4.yaml': 'https://example.com/docs/components/pathItem-4.yaml',
        },
      },
      {
        isEntrypoint: false,
        uri: 'https://example.com/docs/components/pathItem-1.yaml',
        references: {},
      },
      {
        isEntrypoint: false,
        uri: 'https://example.com/docs/components/pathItem-2.yaml',
        references: {},
      },
      {
        isEntrypoint: false,
        uri: 'https://example.com/docs/components/pathItem-3.yaml',
        references: {},
      },
      {
        isEntrypoint: false,
        uri: 'https://example.com/docs/components/pathItem-4.yaml',
        references: {},
      },
    ])

    // Not called, because we directly pass a document (not a URL)
    // expect(fetch).toHaveBeenCalledWith('https://example.com/docs/openapi.yaml')
    expect(fetch).toHaveBeenCalledWith('https://example.com/docs/components/pathItem-1.yaml')
    expect(fetch).toHaveBeenCalledWith('https://example.com/docs/components/pathItem-2.yaml')
    expect(fetch).toHaveBeenCalledWith('https://example.com/docs/components/pathItem-3.yaml')
    expect(fetch).toHaveBeenCalledWith('https://example.com/docs/components/pathItem-4.yaml')
  })

  it('combines relative URLs and relative references', async () => {
    // @ts-expect-error
    fetch.mockImplementation(async () => {
      // empty document for all URLs
      return {
        text: async () => '{}',
      }
    })

    await load(
      {
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            $ref: './components/pathItem-1.yaml',
          },
          '/users/{id}': {
            $ref: 'components/pathItem-2.yaml',
          },
          '/users/{id}/posts': {
            $ref: '../docs/components/pathItem-3.yaml',
          },
          '/users/{id}/posts/{postId}': {
            $ref: 'https://example.com/docs/components/pathItem-4.yaml',
          },
        },
      },
      {
        source: '/docs/openapi.yaml',
        plugins: [
          fetchUrls({
            // fetch: (url) => {
            //   console.log('fetch:', url)
            //
            //   return fetch(url)
            // },
          }),
        ],
      },
    )

    // Not called, because we directly pass a document (not a URL)
    // expect(fetch).toHaveBeenCalledWith('/docs/openapi.yaml')
    expect(fetch).toHaveBeenCalledWith('/docs/components/pathItem-1.yaml')
    expect(fetch).toHaveBeenCalledWith('/docs/components/pathItem-2.yaml')
    expect(fetch).toHaveBeenCalledWith('/docs/components/pathItem-3.yaml')
    expect(fetch).toHaveBeenCalledWith('https://example.com/docs/components/pathItem-4.yaml')
  })

  it('handles nested relative references', async () => {
    // @ts-expect-error
    fetch.mockImplementation(async (url: string) => {
      if (url === 'http://example.com/components/pathItem-1.yaml') {
        return {
          text: async () => `
            get:
              $ref: operation-1.yaml
          `,
        }
      }

      if (url === 'http://example.com/components/operation-1.yaml') {
        return {
          text: async () => `
            summary: Get users
            responses:
              200:
                description: Success
          `,
        }
      }

      return {
        text: async () => '{}',
      }
    })

    const { filesystem } = await load(
      {
        openapi: '3.1.0',
        paths: {
          '/users': {
            $ref: '/components/pathItem-1.yaml',
          },
        },
      },
      {
        source: 'http://example.com/docs/openapi.yaml',
        plugins: [fetchUrls()],
      },
    )

    expect(filesystem).toMatchObject([
      {
        isEntrypoint: true,
        uri: 'http://example.com/docs/openapi.yaml',
        references: {
          '/components/pathItem-1.yaml': 'http://example.com/components/pathItem-1.yaml',
        },
      },
      {
        isEntrypoint: false,
        uri: 'http://example.com/components/pathItem-1.yaml',
        references: {
          'operation-1.yaml': 'http://example.com/components/operation-1.yaml',
        },
      },
      {
        isEntrypoint: false,
        uri: 'http://example.com/components/operation-1.yaml',
        references: {},
      },
    ])

    expect(fetch).toHaveBeenCalledWith('http://example.com/components/pathItem-1.yaml')
    expect(fetch).toHaveBeenCalledWith('http://example.com/components/operation-1.yaml')
  })

  it('handles failed requests', async () => {
    // Failed request
    // @ts-expect-error
    fetch.mockImplementation(() => {
      throw new TypeError('[load.test.ts] fetch failed')
    })

    const { filesystem } = await load(
      {
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/foobar': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: 'https://DOES_NOT_EXIST',
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        plugins: [readFiles(), fetchUrls()],
      },
    )

    expect(getEntrypoint(filesystem).content).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })
  })

  it('limits the number of requests', async () => {
    // @ts-expect-error
    fetch.mockResolvedValue({
      text: async () => 'FOOBAR',
    })

    const { filesystem } = await load(
      {
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/foobar': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: 'https://DOES_NOT_EXIST',
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        plugins: [
          fetchUrls({
            limit: 0,
          }),
        ],
      },
    )

    expect(filesystem.length).toBe(1)
  })

  it('loads referenced urls', async () => {
    // @ts-expect-error
    fetch.mockImplementation((url: string) => {
      if (url === 'https://example.com/openapi.yaml') {
        return Promise.resolve({
          text: () =>
            Promise.resolve(
              stringify({
                openapi: '3.1.0',
                info: {
                  title: 'Hello World',
                  version: '1.0.0',
                },
                paths: {
                  '/foobar': {
                    post: {
                      requestBody: {
                        $ref: 'https://example.com/foobar.json',
                      },
                    },
                  },
                },
              }),
            ),
        } as Response)
      }

      if (url === 'https://example.com/foobar.json') {
        return {
          text: async () =>
            JSON.stringify({
              content: {
                'application/json': {
                  schema: {
                    type: 'string',
                    example: 'foobar',
                  },
                },
              },
            }),
        } as Response
      }
    })

    const { filesystem } = await load('https://example.com/openapi.yaml', {
      plugins: [readFiles(), fetchUrls()],
    })

    expect(filesystem[0].content).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar': {
          post: {
            requestBody: {
              $ref: 'https://example.com/foobar.json',
            },
          },
        },
      },
    })

    expect(filesystem[1].content).toMatchObject({
      content: {
        'application/json': {
          schema: {
            type: 'string',
            example: 'foobar',
          },
        },
      },
    })
  })

  it('loads string with url reference', async () => {
    // @ts-expect-error
    fetch.mockResolvedValue({
      text: async () =>
        JSON.stringify({
          content: {
            'application/json': {
              schema: {
                type: 'string',
                example: 'foobar',
              },
            },
          },
        }),
    })

    const { filesystem } = await load(
      stringify({
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/foobar': {
            post: {
              requestBody: {
                $ref: 'https://example.com/foobar.json',
              },
            },
          },
        },
      }),
      {
        plugins: [readFiles(), fetchUrls()],
      },
    )

    expect(filesystem.map((entry) => entry.uri)).toStrictEqual([undefined, 'https://example.com/foobar.json'])

    expect(filesystem[0].content).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/foobar': {
          post: {
            requestBody: {
              $ref: 'https://example.com/foobar.json',
            },
          },
        },
      },
    })

    expect(filesystem[1].content).toMatchObject({
      content: {
        'application/json': {
          schema: {
            type: 'string',
            example: 'foobar',
          },
        },
      },
    })
  })

  it('returns an error', async () => {
    const { errors } = await load('INVALID', {
      plugins: [readFiles(), fetchUrls()],
    })

    expect(errors).toMatchObject([
      {
        code: 'EXTERNAL_REFERENCE_NOT_FOUND',
        message: 'Can’t resolve external reference: INVALID',
      },
    ])
  })

  it('maintains original source URL when resolving nested references', async () => {
    // @ts-expect-error
    fetch.mockImplementation(async (url: string) => {
      if (url === 'https://example.com/docs/components/schema.json') {
        return {
          text: async () => JSON.stringify({ type: 'string' }),
        }
      }
      throw new Error(`Unexpected URL: ${url}`)
    })

    const doc = {
      openapi: '3.1.0',
      components: {
        schemas: {
          Test: {
            $ref: './components/schema.json',
          },
        },
      },
    }

    const { filesystem } = await load(doc, {
      source: 'https://example.com/docs/openapi.json',
      plugins: [fetchUrls()],
    })

    expect(fetch).toHaveBeenCalledWith('https://example.com/docs/components/schema.json')
    expect(filesystem).toHaveLength(2)
  })

  it('throws an error', async () => {
    expect(async () => {
      await load('INVALID', {
        plugins: [readFiles(), fetchUrls()],
        throwOnError: true,
      })
    }).rejects.toThrowError('Can’t resolve external reference: INVALID')
  })
})
