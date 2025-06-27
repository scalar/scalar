import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { stringify } from 'yaml'

import { fetchUrls } from '@/plugins/fetch-urls/fetch-urls'
import { readFiles } from '@/plugins/read-files/read-files'
import { getEntrypoint } from '@/utils/get-entrypoint'
import { load } from './load'

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

    expect(getEntrypoint(filesystem).specification).toMatchObject({
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

    expect(getEntrypoint(filesystem).specification).toMatchObject({
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

    expect(getEntrypoint(filesystem).specification).toMatchObject({
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
      plugins: [readFiles(), fetchUrls()],
    })

    expect(getEntrypoint(filesystem).specification).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })
  })

  it('loads referenced files in files', async () => {
    const EXAMPLE_FILE = path.join(new URL(import.meta.url).pathname, '../../../../tests/filesystem/api/openapi.yaml')

    const { filesystem } = await load(EXAMPLE_FILE, {
      plugins: [readFiles()],
    })

    // filenames
    expect(filesystem.map((entry) => entry.filename)).toStrictEqual([
      null,
      'schemas/problem.yaml',
      'schemas/upload.yaml',
      './components/coordinates.yaml',
    ])

    // specification
    expect(filesystem[0].specification).toBeTypeOf('object')

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

    expect(getEntrypoint(filesystem).specification).toMatchObject({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })
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

    expect(getEntrypoint(filesystem).specification).toMatchObject({
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

    expect(filesystem[0].specification).toMatchObject({
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

    expect(filesystem[1].specification).toMatchObject({
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

    expect(filesystem.map((entry) => entry.filename)).toStrictEqual([null, 'https://example.com/foobar.json'])

    expect(filesystem[0].specification).toMatchObject({
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

    expect(filesystem[1].specification).toMatchObject({
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
        message: "Can't resolve external reference: INVALID",
      },
    ])
  })

  it('throws an error', async () => {
    expect(async () => {
      await load('INVALID', {
        plugins: [readFiles(), fetchUrls()],
        throwOnError: true,
      })
    }).rejects.toThrowError("Can't resolve external reference: INVALID")
  })
})
