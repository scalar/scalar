import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { stringify } from 'yaml'

import { downloadFileSystem } from '../../../tests/utils/downloadFileGcp'
import { getEntrypoint } from '../getEntrypoint'
import { load } from './load'
import { fetchUrls } from './plugins/fetchUrls'
import { readFiles } from './plugins/readFiles'

describe('load', async () => {
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
    const EXAMPLE_FILE = path.join(
      new URL(import.meta.url).pathname,
      '../../examples/openapi.yaml',
    )

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
    const filesystemPath = path.join(
      new URL(import.meta.url).pathname,
      '../../../../tests/filesystem/api/openapi.yaml',
    )

    await downloadFileSystem()

    const { filesystem } = await load(filesystemPath, {
      plugins: [readFiles()],
    })

    // filenames
    expect(filesystem.map((entry) => entry.filename)).toStrictEqual([
      null,
      'schemas/problem.yaml',
      'schemas/upload.yaml',
      './components/coordinates.yaml',
    ])

    // dirs
    // expect(filesystem.map((entry) => entry.dir)).toStrictEqual([
    //   '/Users/hanspagel/Documents/Projects/openapi-parser/packages/openapi-parser/tests/filesystem/api',
    //   '/Users/hanspagel/Documents/Projects/openapi-parser/packages/openapi-parser/tests/filesystem/api/schemas',
    //   '/Users/hanspagel/Documents/Projects/openapi-parser/packages/openapi-parser/tests/filesystem/api/schemas',
    //   '/Users/hanspagel/Documents/Projects/openapi-parser/packages/openapi-parser/tests/filesystem/api/schemas/components',
    // ])

    // specification
    expect(filesystem[0].specification).toBeTypeOf('object')

    // only one entrypoint
    expect(filesystem.filter((entry) => entry.isEntrypoint).length).toBe(1)
  })

  it('loads url', async () => {
    global.fetch = async () =>
      ({
        text: async () =>
          stringify({
            openapi: '3.1.0',
            info: {
              title: 'Hello World',
              version: '1.0.0',
            },
            paths: {},
          }),
      }) as Response

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
    global.fetch = async () => {
      throw new TypeError('fetch failed')
    }

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
    global.fetch = async () =>
      ({
        text: async () => 'FOOBAR',
      }) as unknown as Response

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
    global.fetch = async (url: string) => {
      if (url === 'https://example.com/openapi.yaml') {
        return {
          text: async () =>
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
        } as Response
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
    }

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
    global.fetch = async () => {
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

    expect(filesystem.map((entry) => entry.filename)).toStrictEqual([
      null,
      'https://example.com/foobar.json',
    ])

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
})
