import path from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { stringify } from 'yaml'

import { fetchUrls } from '@/plugins/fetch-urls/fetch-urls'
import { readFiles } from '@/plugins/read-files/read-files'
import { getEntrypoint } from '@/utils/get-entrypoint'
import { resolveReferences } from '@/utils/resolve-references'

import { load } from './load'

const globalFetchSpy = vi.spyOn(global, 'fetch').mockImplementation(vi.fn())

describe('load', () => {
  it('loads new dependencies when a previously loaded file is later used as a schema', async () => {
    const files: Record<string, unknown> = {
      'via.json': { $ref: 'shared.json#/Example' },
      'shared.json': { Example: { value: { $ref: 'literal.json' } }, Schema: { $ref: 'schema.json' } },
      'schema.json': { type: 'string' },
    }
    const main = {
      openapi: '3.1.0',
      components: {
        examples: { Via: { $ref: 'via.json' } },
        schemas: { Direct: { $ref: 'shared.json#/Schema' } },
      },
    }
    const loaded: string[] = []
    const result = await load(main, {
      plugins: [
        {
          check: (value: unknown): boolean => typeof value === 'string' && value.endsWith('.json'),
          get: (filename: string): unknown => {
            loaded.push(filename)
            if (!(filename in files)) {
              throw new Error(`Unexpected dependency: ${filename}`)
            }
            return files[filename]
          },
        },
      ],
      throwOnError: true,
    })
    expect(result.errors).toStrictEqual([])
    expect(loaded).toStrictEqual(['via.json', 'shared.json', 'schema.json'])
    expect(result.filesystem.map(({ filename, references }) => ({ filename, references }))).toStrictEqual([
      { filename: null, references: ['via.json', 'shared.json'] },
      { filename: 'via.json', references: ['shared.json'] },
      { filename: 'shared.json', references: ['schema.json'] },
      { filename: 'schema.json', references: [] },
    ])
    expect(resolveReferences(result.filesystem, { throwOnError: true }).schema).toStrictEqual({
      ...main,
      components: {
        examples: { Via: { value: { $ref: 'literal.json' } } },
        schemas: { Direct: { type: 'string' } },
      },
    })
  })

  it.each([
    { kind: 'example', fragment: '' },
    { kind: 'example', fragment: '#/Demo' },
    { kind: 'response', fragment: '' },
    { kind: 'response', fragment: '#/Demo' },
  ])('preserves literal data in an external $kind with fragment "$fragment"', async ({ kind, fragment }) => {
    const literal = { $ref: 'literal.json' }
    const target =
      kind === 'example'
        ? { value: literal }
        : {
            description: 'OK',
            examples: { 'application/json': literal },
          }
    const reference = { $ref: `data.json${fragment}` }
    const main =
      kind === 'example'
        ? {
            openapi: '3.1.0',
            info: { title: 'Example', version: '1' },
            paths: {},
            components: { examples: { Demo: reference } },
          }
        : {
            swagger: '2.0',
            info: { title: 'Response', version: '1' },
            paths: {},
            responses: { Demo: reference },
          }
    const loaded: string[] = []
    const { filesystem, errors } = await load(main, {
      plugins: [
        {
          check: (value: unknown): boolean => typeof value === 'string' && value.endsWith('.json'),
          get: (filename: string): unknown => {
            loaded.push(filename)
            if (filename !== 'data.json') {
              throw new Error(`Unexpected dependency: ${filename}`)
            }
            return fragment ? { Demo: target } : target
          },
        },
      ],
      throwOnError: true,
    })
    expect(errors).toStrictEqual([])
    expect(loaded).toStrictEqual(['data.json'])
    expect(filesystem.map(({ references }) => references)).toStrictEqual([['data.json'], []])
    const result = resolveReferences(filesystem, { throwOnError: true })
    expect(result.errors).toStrictEqual([])
    expect(result.schema).toStrictEqual(
      kind === 'example'
        ? {
            ...main,
            components: { examples: { Demo: target } },
          }
        : { ...main, responses: { Demo: target } },
    )
  })

  it('loads all referenced fragments of a shared file using each caller context', async () => {
    const main = {
      openapi: '3.1.0',
      info: { title: 'Shared fragments', version: '1' },
      paths: {},
      components: {
        examples: { Demo: { $ref: 'data.json#/Example' } },
        schemas: { Demo: { $ref: 'data.json#/Schema' } },
      },
    }
    const files: Record<string, unknown> = {
      'data.json': {
        Example: { $ref: '#/ActualExample' },
        ActualExample: { value: { $ref: 'literal.json' } },
        Schema: { $ref: 'schema.json' },
      },
      'schema.json': { type: 'string' },
    }
    const loaded: string[] = []
    const result = await load(main, {
      plugins: [
        {
          check: (value: unknown): boolean => typeof value === 'string' && value.endsWith('.json'),
          get: (filename: string): unknown => {
            loaded.push(filename)
            if (!(filename in files)) {
              throw new Error(`Unexpected dependency: ${filename}`)
            }
            return files[filename]
          },
        },
      ],
      throwOnError: true,
    })
    expect(result.errors).toStrictEqual([])
    expect(loaded).toStrictEqual(['data.json', 'schema.json'])
    expect(resolveReferences(result.filesystem, { throwOnError: true }).schema).toStrictEqual({
      ...main,
      components: {
        examples: { Demo: { value: { $ref: 'literal.json' } } },
        schemas: { Demo: { type: 'string' } },
      },
    })
  })
  beforeEach(() => {
    globalFetchSpy.mockReset()
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
    globalFetchSpy.mockImplementation(() => {
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
    globalFetchSpy.mockResolvedValue({
      text: async () => 'FOOBAR',
    } as Response)

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
    globalFetchSpy.mockImplementation((url: string) => {
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
    globalFetchSpy.mockResolvedValue({
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
    } as Response)

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
    await expect(async () => {
      await load('INVALID', {
        plugins: [readFiles(), fetchUrls()],
        throwOnError: true,
      })
    }).rejects.toThrowError("Can't resolve external reference: INVALID")
  })
})
