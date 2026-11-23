import fs from 'node:fs'
import path from 'node:path'

import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it, test } from 'vitest'

import { type ConvertOptions, convert } from './convert'
import type { Auth, Item, ItemGroup, PostmanCollection } from './types'

const FIXTURES_DIR = path.join(import.meta.dirname, '../fixtures/input')
const FIXTURES = fs
  .readdirSync(FIXTURES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
  .sort((a, b) => a.localeCompare(b))

describe('fixtures', () => {
  test.each(FIXTURES)('%s', (file) => {
    const input = fs.readFileSync(path.join(FIXTURES_DIR, `${file}.json`), 'utf8')
    const postman = JSON.parse(input)
    expect(convert(postman)).toMatchSnapshot()
  })
})

describe('convert', () => {
  it('imports query parameters with structured Postman descriptions', () => {
    const result = convert({
      info: {
        name: 'Catalog',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'List items',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/items?region=west',
              query: [
                {
                  key: 'region',
                  value: 'west',
                  description: { content: '[required] Sales region', type: 'text/markdown' },
                },
              ],
            },
          },
        },
      ],
    })

    expect(result.paths?.['/items']?.get?.parameters).toEqual([
      expect.objectContaining({ name: 'region', in: 'query', description: 'Sales region', required: true }),
    ])
  })

  it.each([
    { header: [], graphqlType: 'application/json', fileType: 'application/octet-stream' },
    { header: [{ key: 'Content-Type', value: 'image/png' }], graphqlType: 'image/png', fileType: 'image/png' },
    {
      header: [{ key: 'content-type', value: 'application/json; charset=utf-8' }],
      graphqlType: 'application/json',
      fileType: 'application/json',
    },
    {
      header: [{ key: 'Content-Type', value: 'text/plain', disabled: true }],
      graphqlType: 'application/json',
      fileType: 'application/octet-stream',
    },
  ])('converts GraphQL and file bodies with headers $header', ({ header, graphqlType, fileType }) => {
    const query = 'query Item($id: ID!) { item(id: $id) { id } }'
    const collection: PostmanCollection = {
      info: {
        name: 'GraphQL and files',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          request: {
            method: 'POST',
            url: 'https://api.example.com/graphql',
            header,
            body: { mode: 'graphql', graphql: { query, variables: '{"id":"1"}' } },
          },
        },
        {
          request: {
            method: 'PUT',
            url: 'https://api.example.com/uploads',
            header,
            body: { mode: 'file', file: { src: 'photo.png' } },
          },
        },
      ],
    }
    const result = convert(collection)
    expect(result.paths?.['/graphql']?.post?.requestBody).toStrictEqual({
      content: {
        [graphqlType]: {
          schema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              variables: { type: 'object' },
            },
            required: ['query'],
          },
          examples: { 'Default example': { value: { query, variables: { id: '1' } } } },
        },
      },
    })
    expect(result.paths?.['/uploads']?.put?.requestBody).toStrictEqual({ content: { [fileType]: {} } })
  })

  it('keeps distinct GraphQL examples when requests are merged', () => {
    const collection: PostmanCollection = {
      info: { name: 'Queries', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
      item: ['First', 'Second'].map((name) => ({
        name,
        request: {
          method: 'POST',
          url: 'https://api.example.com/graphql',
          body: {
            mode: 'graphql',
            graphql: { query: 'query Item($id: ID!) { item(id: $id) { id } }', variables: { id: name } },
          },
        },
      })),
    }
    const result = convert(collection, { mergeOperation: true, requestIndexPaths: [[0], [1]] })
    expect(result.paths?.['/graphql']?.post?.requestBody).toStrictEqual({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              variables: { type: 'object' },
            },
            required: ['query'],
          },
          examples: {
            First: { value: { query: 'query Item($id: ID!) { item(id: $id) { id } }', variables: { id: 'First' } } },
            Second: { value: { query: 'query Item($id: ID!) { item(id: $id) { id } }', variables: { id: 'Second' } } },
          },
        },
      },
    })
  })

  it.each([
    ['formdata', 'multipart/form-data'],
    ['urlencoded', 'application/x-www-form-urlencoded'],
  ] as const)('imports a %s field named __proto__ as an ordinary field', (mode, mediaType) => {
    const rows = [
      { key: '__proto__', value: 'p', type: 'text' as const, description: 'Field [required]' },
      { key: 'name', value: 'n', type: 'text' as const },
    ]
    const collection: PostmanCollection = {
      info: { name: 'Forms', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
      item: [
        {
          name: 'Submit',
          request: {
            method: 'POST',
            url: 'https://api.example.com/submit',
            body: mode === 'formdata' ? { mode, formdata: rows } : { mode, urlencoded: rows },
          },
        },
      ],
    }

    const requestBody = convert(collection).paths?.['/submit']?.post?.requestBody as OpenAPIV3_1.RequestBodyObject
    const media = requestBody.content?.[mediaType]
    const properties = media?.schema?.properties ?? {}

    expect(Object.keys(properties)).toStrictEqual(['__proto__', 'name'])
    expect(Object.getPrototypeOf(properties)).toBe(Object.prototype)
    expect(media?.schema?.required).toStrictEqual(['__proto__'])
    expect(media?.examples?.['Default example']?.value).toStrictEqual([
      { name: '__proto__', value: 'p', isDisabled: false },
      { name: 'name', value: 'n', isDisabled: false },
    ])
  })

  it('merges into an existing OpenAPI document', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Postman API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Echo',
          request: 'https://api.example.com/v2/echo',
        },
      ],
    }

    const base = {
      openapi: '3.1.0',
      info: { title: 'Existing', version: '2.0.0' },
      paths: {
        '/health': {
          get: { responses: { '200': { description: 'ok' } } },
        },
      },
      tags: [{ name: 'Core' }],
    }

    const result = convert(collection, { document: base as OpenAPIV3_1.Document })

    expect(result.info?.title).toBe('Existing')
    expect(result.paths?.['/health']).toBeDefined()
    expect(Object.keys(result.paths ?? {})).toContain('/v2/echo')
    expect(result.tags?.map((t: OpenAPIV3_1.TagObject) => t.name)).toContain('Core')
  })

  it('creates tags from nested folders without mutating the input collection', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Tags',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Parent',
          description: 'Parent folder',
          item: [
            {
              name: 'Child',
              item: [
                {
                  name: 'Leaf request',
                  request: 'https://api.scalar.com/users',
                },
              ],
            },
          ],
        },
        {
          name: 'Standalone request',
          request: 'https://api.scalar.com/status',
        },
      ],
    }

    const snapshot = JSON.parse(JSON.stringify(collection))
    const result = convert(collection)

    expect(result.tags).toEqual([
      { name: 'Parent', description: 'Parent folder' },
      { name: 'Child', description: 'Part of Parent' },
    ])
    expect(collection).toEqual(snapshot)
  })

  it('uses context tag description when folder description is an empty string', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Tags with empty description',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Parent',
          item: [
            {
              name: 'Child',
              description: '',
              item: [
                {
                  name: 'Leaf request',
                  request: 'https://api.scalar.com/users',
                },
              ],
            },
          ],
        },
      ],
    }

    const result = convert(collection)

    expect(result.tags).toEqual([{ name: 'Parent' }, { name: 'Child', description: 'Part of Parent' }])
  })

  it('imports only requests at requestIndexPaths and keeps folder tags for those branches', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Filtered',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Parent',
          description: 'Parent folder',
          item: [
            {
              name: 'Child',
              item: [
                {
                  name: 'Leaf request',
                  request: 'https://api.scalar.com/users',
                },
              ],
            },
          ],
        },
        {
          name: 'Standalone request',
          request: 'https://api.scalar.com/status',
        },
      ],
    }

    const nestedOnly = convert(collection, { requestIndexPaths: [[0, 0, 0]] })
    expect(Object.keys(nestedOnly.paths ?? {})).toEqual(['/users'])
    expect(nestedOnly.tags).toEqual([
      { name: 'Parent', description: 'Parent folder' },
      { name: 'Child', description: 'Part of Parent' },
    ])

    const standaloneOnly = convert(collection, { requestIndexPaths: [[1]] })
    expect(Object.keys(standaloneOnly.paths ?? {})).toEqual(['/status'])
    expect(standaloneOnly.tags).toBeUndefined()

    const emptySelection = convert(collection, { requestIndexPaths: [] })
    expect(Object.keys(emptySelection.paths ?? {})).toEqual([])
  })

  it('fails fast when string input is not valid JSON', () => {
    expect(() => convert('{"info": {"name": "Broken"')).toThrowError(/invalid postman collection json/i)
  })

  it('supports chain tag naming strategy to preserve legacy folder chains', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Tags',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Error Case',
          item: [
            {
              name: 'GET /applications',
              item: [{ name: 'List applications', request: 'https://api.scalar.com/applications' }],
            },
          ],
        },
      ],
    }

    const result = convert(collection, { tagNamingStrategy: 'chain' })

    expect(result.tags).toEqual([{ name: 'Error Case' }, { name: 'Error Case > GET /applications' }])
    expect(result.paths?.['/applications']?.get?.tags).toEqual(['Error Case > GET /applications'])
  })

  it('uses parent plus leaf fallback when duplicate leaf tag names exist', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Duplicate leaf tags',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Error Case',
          item: [{ name: 'GET', item: [{ name: 'Get application', request: 'https://api.scalar.com/applications' }] }],
        },
        {
          name: 'Business Logic',
          item: [{ name: 'GET', item: [{ name: 'Get users', request: 'https://api.scalar.com/users' }] }],
        },
      ],
    }

    const result = convert(collection)

    expect(result.tags).toEqual([
      { name: 'Error Case' },
      { name: 'Error Case / GET', description: 'Part of Error Case' },
      { name: 'Business Logic' },
      { name: 'Business Logic / GET', description: 'Part of Business Logic' },
    ])
    expect(result.paths?.['/applications']?.get?.tags).toEqual(['Error Case / GET'])
    expect(result.paths?.['/users']?.get?.tags).toEqual(['Business Logic / GET'])
  })

  it('normalizes path-like folder names when using leaf tag naming', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Path style tags',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: '/languages/{languageCode}',
          item: [{ name: 'Get language', request: 'https://api.scalar.com/languages/:languageCode' }],
        },
      ],
    }

    const result = convert(collection)

    expect(result.tags).toEqual([{ name: 'languages' }])
    expect(result.paths?.['/languages/{languageCode}']?.get?.tags).toEqual(['languages'])
  })

  it('errors when required collection info is missing', () => {
    expect(() => convert({} as PostmanCollection)).toThrowError(/missing required info/i)
    expect(() =>
      convert({
        // @ts-expect-error testing runtime validation
        info: { schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
        item: [],
      }),
    ).toThrowError(/missing required info.name/i)
  })

  it('merges global and request-level security schemes', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Security',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: {
        type: 'bearer',
      },
      item: [
        {
          name: 'Users',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/users',
            auth: {
              type: 'basic',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.security).toEqual([{ bearerAuth: [] }])
    expect(result.components?.securitySchemes).toEqual({
      bearerAuth: {
        scheme: 'bearer',
        type: 'http',
      },
      basicAuth: {
        scheme: 'basic',
        type: 'http',
      },
    })
  })

  it('overwrites properties other than parameters and requestBody', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Duplicate operations',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'First',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/users',
          },
        },
        {
          name: 'Second',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/users',
          },
        },
      ],
    }

    const result = convert(collection)
    const operation = result.paths?.['/users']?.get

    expect(operation).toBeDefined()
    expect(operation?.summary).toBe('Second')
  })

  it('preserves collapsed request variants when mergeOperation is enabled', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Merged variants',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: '200 - All languages',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/languages',
            description: 'All languages.',
          },
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: ['pm.environment.set("countryCode", "");'],
              },
            },
            {
              listen: 'test',
              script: {
                exec: ['pm.response.to.have.status(200)'],
              },
            },
          ],
        },
        {
          name: '200 - Valid country code languages',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.scalar.com/languages?countryCode=CA',
              query: [
                {
                  key: 'countryCode',
                  value: 'CA',
                },
              ],
            },
            description: 'Languages for one country code.',
          },
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: ['pm.environment.set("countryCode", "CA");'],
              },
            },
            {
              listen: 'test',
              script: {
                exec: ['pm.response.to.have.status(200)'],
              },
            },
          ],
        },
        {
          name: '204 - Invalid country code filter',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.scalar.com/languages?countryCode=zz',
              query: [
                {
                  key: 'countryCode',
                  value: 'zz',
                },
              ],
            },
            description: 'No content for invalid filter.',
          },
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: ['pm.environment.set("countryCode", "zz");'],
              },
            },
            {
              listen: 'test',
              script: {
                exec: ['pm.response.to.have.status(204)'],
              },
            },
          ],
        },
      ],
    }

    const result = convert(collection, { mergeOperation: true })
    const operation = result.paths?.['/languages']?.get

    expect(operation).toBeDefined()
    expect(operation?.summary).toBe('200 - All languages')
    expect(operation?.description).toBe(
      'All languages.\n\nLanguages for one country code.\n\nNo content for invalid filter.',
    )
    expect(operation?.responses).toEqual({
      '200': {
        description: 'Valid country code languages',
        content: {
          'application/json': {},
        },
      },
      '204': {
        description: 'Invalid country code filter',
      },
    })

    const queryParam = operation?.parameters?.find(
      (parameter) => parameter.name === 'countryCode' && parameter.in === 'query',
    )
    expect(queryParam?.examples).toEqual({
      '200 - Valid country code languages': {
        value: 'CA',
        'x-disabled': false,
      },
      '204 - Invalid country code filter': {
        value: 'zz',
        'x-disabled': false,
      },
    })

    expect(operation?.['x-pre-request']).toBe(
      '// --- 200 - All languages ---\npm.environment.set("countryCode", "");\n\n// --- 200 - Valid country code languages ---\npm.environment.set("countryCode", "CA");\n\n// --- 204 - Invalid country code filter ---\npm.environment.set("countryCode", "zz");',
    )
    expect(operation?.['x-post-response']).toBe(
      '// --- 200 - All languages ---\npm.response.to.have.status(200)\n\n// --- 200 - Valid country code languages ---\npm.response.to.have.status(200)\n\n// --- 204 - Invalid country code filter ---\npm.response.to.have.status(204)',
    )
  })

  it('handles collections without items', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Empty',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
    }

    const result = convert(collection)

    expect(result.paths).toEqual({})
    expect(result.components).toBeUndefined()
    expect(result.tags).toBeUndefined()
  })

  it('keeps security undefined when collection has no auth', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Authless',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Ping',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/ping',
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.security).toBeUndefined()
    expect(result.components).toBeUndefined()
  })

  it('defaults requestBody content to text/plain when extractor returns empty content', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Empty body content',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Upload',
          request: {
            method: 'POST',
            url: 'https://api.scalar.com/upload',
            body: {},
          },
        },
      ],
    }

    const result = convert(collection)
    const postOperation = result.paths?.['/upload']?.post

    expect(postOperation?.requestBody).toBeDefined()
    expect(postOperation?.requestBody && 'content' in postOperation.requestBody).toBe(true)
    if (postOperation?.requestBody && 'content' in postOperation.requestBody) {
      expect(postOperation.requestBody.content).toEqual({ 'text/plain': {} })
    }
  })

  it('throws when item is not an array', () => {
    expect(() =>
      convert({
        info: {
          name: 'Bad item',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        // @ts-expect-error invalid runtime shape
        item: {},
      }),
    ).toThrowError(/item must be an array/i)
  })

  it('errors when variables are not an array', () => {
    expect(() =>
      convert({
        info: {
          name: 'Bad variable',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [],
        // @ts-expect-error invalid runtime shape
        variable: {},
      }),
    ).toThrowError(/variable must be an array/i)
  })

  it('places servers at document level when used for all paths (single path)', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.servers).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.paths?.['/users']?.servers).toBeUndefined()
    expect(result.paths?.['/users']?.get?.servers).toBeUndefined()
  })

  it('places servers at document level when used for all paths (single path, multiple operations)', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
        {
          name: 'Create User',
          request: {
            method: 'POST',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.servers).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.paths?.['/users']?.servers).toBeUndefined()
    expect(result.paths?.['/users']?.get?.servers).toBeUndefined()
    expect(result.paths?.['/users']?.post?.servers).toBeUndefined()
  })

  it('places servers at document level when used across multiple paths', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
        {
          name: 'Get Post',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/posts',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.servers).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.paths?.['/users']?.servers).toBeUndefined()
    expect(result.paths?.['/posts']?.servers).toBeUndefined()
  })

  it('handles mixed server placement scenarios', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        // Server A: used in multiple paths → document level
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
        {
          name: 'Get Post',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/posts',
            },
          },
        },
        // Server B: used in multiple operations in one path → path item level
        {
          name: 'Get Comment',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.other.com/comments',
            },
          },
        },
        {
          name: 'Create Comment',
          request: {
            method: 'POST',
            url: {
              raw: 'https://api.other.com/comments',
            },
          },
        },
        // Server C: used in only one operation → operation level
        {
          name: 'Get Special',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.special.com/special',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    // Server A should be at document level
    expect(result.servers).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])

    // Server B should be at path item level
    expect(result.paths?.['/comments']?.servers).toEqual([
      {
        url: 'https://api.other.com',
      },
    ])

    // Server C should be at operation level
    expect(result.paths?.['/special']?.get?.servers).toEqual([
      {
        url: 'https://api.special.com',
      },
    ])
  })

  it('handles paths with colons correctly when placing servers at operation level', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get API v1 Users',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/api:v1/users',
            },
          },
        },
        {
          name: 'Get API v2 Posts',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.other.com/api:v2/posts',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    // With multiple paths, the server for /api:v1/users should be at operation level
    // The path will be normalized, so :v1 becomes {v1}, but the delimiter fix ensures
    // that paths with colons don't break the operation key splitting
    const pathKeys = Object.keys(result.paths || {})
    expect(pathKeys.length).toBeGreaterThan(0)

    // Find the path that contains the v1 users endpoint
    const v1PathKey = pathKeys.find((key) => key.includes('v1') || key.includes('users'))
    expect(v1PathKey).toBeDefined()
    const pathItem = result.paths?.[v1PathKey!]

    // Server should be at operation level (not document level, since there are multiple paths)
    // and not path item level (since there's only one operation per path)
    expect(result.servers).toBeUndefined()
    expect(pathItem?.servers).toBeUndefined()
    expect(pathItem?.get?.servers).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
  })

  it('unifies structurally equal paths using the most common path parameter name', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Path canonicalization',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get application',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/applications/{{applicationId}}',
          },
        },
        {
          name: 'Delete application',
          request: {
            method: 'DELETE',
            url: 'https://api.scalar.com/applications/{{applicationId2}}',
          },
        },
        {
          name: 'Error case with fake id',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/applications/{{fakeAppId}}',
            description: '| object | name | required |\n| --- | --- | --- |\n| path | fakeAppId | true |',
          },
        },
      ],
    }

    const result = convert(collection, { mergeOperation: true })
    const pathKeys = Object.keys(result.paths ?? {})
    expect(pathKeys).toEqual(['/applications/{applicationId}'])

    const mergedPath = result.paths?.['/applications/{applicationId}']
    expect(mergedPath?.get).toBeDefined()
    expect(mergedPath?.delete).toBeDefined()
    expect(mergedPath?.get?.parameters).toEqual([
      {
        name: 'applicationId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ])
  })

  it('prefers folder path-template hints when choosing canonical path parameter names', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Folder hint canonicalization',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: '/applications/{id}',
          item: [
            {
              name: 'Get application by alias',
              request: {
                method: 'GET',
                url: 'https://api.scalar.com/applications/{{applicationId}}',
                description: '| object | name | required |\n| --- | --- | --- |\n| path | applicationId | true |',
              },
            },
            {
              name: 'Delete application by fake id',
              request: {
                method: 'DELETE',
                url: 'https://api.scalar.com/applications/{{fakeAppId}}',
                description: '| object | name | required |\n| --- | --- | --- |\n| path | fakeAppId | true |',
              },
            },
          ],
        },
      ],
    }

    const result = convert(collection)
    const pathKeys = Object.keys(result.paths ?? {})
    expect(pathKeys).toEqual(['/applications/{id}'])

    const mergedPath = result.paths?.['/applications/{id}']
    expect(mergedPath?.get?.parameters).toEqual([
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ])
    expect(mergedPath?.delete?.parameters).toEqual([
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ])
  })

  it('omits responses and retains operation-level servers when merging duplicate requests', () => {
    const postRequest = { method: 'POST', url: 'https://api.example.com/items' }
    const result = convert(
      {
        info: {
          name: 'Merged requests',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          { name: 'Create item', request: postRequest, response: [] },
          { name: 'Create another item', request: postRequest, response: [] },
          { name: 'List users', request: { method: 'GET', url: 'https://api.other.com/users' } },
        ],
      },
      { mergeOperation: true },
    )

    const operation = result.paths?.['/items']?.post
    expect(operation?.servers).toStrictEqual([{ url: 'https://api.example.com' }])
    expect(operation).not.toHaveProperty('responses')
  })

  it('preserves operation-level servers for custom Postman methods', () => {
    const result = convert({
      info: {
        name: 'Extension methods',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        { name: 'Read file properties', request: { method: 'PROPFIND', url: 'https://files.example.com/files' } },
        { name: 'List users', request: { method: 'GET', url: 'https://api.example.com/users' } },
      ],
    })

    expect(result.paths?.['/files']?.propfind?.servers).toStrictEqual([{ url: 'https://files.example.com' }])
    expect(result.paths?.['/users']?.get?.servers).toStrictEqual([{ url: 'https://api.example.com' }])
  })

  it('keeps server placement correct after path unification', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Server placement with unified paths',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get application by first variable',
          request: {
            method: 'GET',
            url: 'https://api.example.com/applications/{{applicationId}}',
          },
        },
        {
          name: 'Get application by second variable',
          request: {
            method: 'GET',
            url: 'https://api.example.com/applications/{{fakeAppId}}',
          },
        },
        {
          name: 'Get users from another server',
          request: {
            method: 'GET',
            url: 'https://api.other.com/users',
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.servers).toBeUndefined()
    expect(result.paths?.['/applications/{applicationId}']?.get?.servers).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.paths?.['/users']?.get?.servers).toEqual([
      {
        url: 'https://api.other.com',
      },
    ])
  })

  it('resolves Postman variables in server URLs from collection variables', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Variable servers',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        { key: 'url-languagesAPI', value: 'localhost:3005' },
        { key: 'url-applicationAPI', value: 'https://application.example.com' },
      ],
      item: [
        {
          name: 'Languages',
          request: {
            method: 'GET',
            url: {
              raw: 'https://{{url-languagesAPI}}/languages',
            },
          },
        },
        {
          name: 'Language by ID',
          request: {
            method: 'GET',
            url: {
              raw: 'https://{{url-languagesAPI}}/languages/{{languageId}}',
            },
          },
        },
        {
          name: 'Application',
          request: {
            method: 'GET',
            url: {
              raw: 'https://{{url-applicationAPI}}/applications',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.servers).toEqual([
      {
        url: 'https://localhost:3005',
      },
    ])
    expect(result.paths?.['/applications']?.get?.servers).toEqual([
      {
        url: 'https://application.example.com',
      },
    ])
  })

  it('emits unresolved Postman server templates as OpenAPI server variables', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Unresolved variable servers',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [{ key: 'url-local', value: 'localhost:3005' }],
      item: [
        {
          name: 'Notifications',
          request: {
            method: 'GET',
            url: {
              raw: 'https://{{url-notificationAPI}}/notifications',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.servers).toEqual([
      {
        url: 'https://{url-notificationAPI}',
        variables: {
          'url-notificationAPI': {
            default: 'example.com',
            description: 'Declared in Postman collection variables.',
          },
        },
      },
    ])
  })

  it('falls back to OpenAPI server variables for recursive Postman values', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Recursive variable servers',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [{ key: 'url-exampleAPI', value: '{{url-local}}' }],
      item: [
        {
          name: 'Recursive',
          request: {
            method: 'GET',
            url: {
              raw: 'https://{{url-exampleAPI}}/status',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.servers).toEqual([
      {
        url: 'https://{url-exampleAPI}',
        variables: {
          'url-exampleAPI': {
            default: 'example.com',
            description: 'Declared in Postman collection variables.',
          },
        },
      },
    ])
  })
  const SCHEMA = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'

  it.each(['awsv4', 'oauth1', 'hawk', 'ntlm', 'edgegrid', 'jwt', 'asap', 'akamai'])(
    'converts a collection with %s authentication without security',
    (type) => {
      const collection: PostmanCollection = {
        info: { name: 'Unsupported auth', schema: SCHEMA },
        auth: { type },
        item: [
          { name: 'Users', request: { method: 'GET', url: 'https://api.scalar.com/users' } },
          { name: 'Orders', request: { method: 'GET', url: 'https://api.scalar.com/orders', auth: { type } } },
        ],
      }
      const original = structuredClone(collection)

      const result = convert(collection)

      expect(Object.keys(result.paths ?? {})).toStrictEqual(['/users', '/orders'])
      expect(result.security).toBeUndefined()
      expect(result.components).toBeUndefined()
      expect(result.paths?.['/users']?.get?.security).toBeUndefined()
      expect(result.paths?.['/orders']?.get?.security).toStrictEqual([])
      expect(collection).toStrictEqual(original)
    },
  )

  it('converts digest authentication to an http digest scheme', () => {
    const collection: PostmanCollection = {
      info: { name: 'Digest', schema: SCHEMA },
      auth: { type: 'digest' },
      item: [{ name: 'Users', request: { method: 'GET', url: 'https://api.scalar.com/users' } }],
    }

    const result = convert(collection)

    expect(result.security).toStrictEqual([{ digestAuth: [] }])
    expect(result.components?.securitySchemes).toStrictEqual({ digestAuth: { type: 'http', scheme: 'digest' } })
  })

  it.each(['awsv4', 'hawk', 'jwt'])(
    'keeps the collection security off an operation that overrides it with %s authentication',
    (type) => {
      const collection: PostmanCollection = {
        info: { name: 'Override', schema: SCHEMA },
        auth: { type: 'bearer' },
        item: [
          { name: 'Users', request: { method: 'GET', url: 'https://api.scalar.com/users' } },
          { name: 'Orders', request: { method: 'GET', url: 'https://api.scalar.com/orders', auth: { type } } },
        ],
      }

      const result = convert(collection)

      expect(result.security).toStrictEqual([{ bearerAuth: [] }])
      expect(result.components?.securitySchemes).toStrictEqual({ bearerAuth: { type: 'http', scheme: 'bearer' } })
      expect(result.paths?.['/users']?.get?.security).toBeUndefined()
      expect(result.paths?.['/orders']?.get?.security).toStrictEqual([])
    },
  )

  it('keeps a supported request authentication under an unsupported collection authentication', () => {
    const collection: PostmanCollection = {
      info: { name: 'Mixed', schema: SCHEMA },
      auth: { type: 'awsv4' },
      item: [
        { name: 'Users', request: { method: 'GET', url: 'https://api.scalar.com/users', auth: { type: 'basic' } } },
      ],
    }

    const result = convert(collection)

    expect(result.security).toBeUndefined()
    expect(result.components?.securitySchemes).toStrictEqual({ basicAuth: { type: 'http', scheme: 'basic' } })
    expect(result.paths?.['/users']?.get?.security).toStrictEqual([{ basicAuth: [] }])
  })

  it('keeps API keys with different names and locations as separate schemes', () => {
    const collection: PostmanCollection = {
      info: { name: 'API keys', schema: SCHEMA },
      auth: {
        type: 'apikey',
        apikey: [
          { key: 'key', value: 'X-API-Key' },
          { key: 'in', value: 'header' },
        ],
      },
      item: [
        { name: 'Users', request: { method: 'GET', url: 'https://api.scalar.com/users' } },
        {
          name: 'Orders',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/orders',
            auth: {
              type: 'apikey',
              apikey: [
                { key: 'key', value: 'api_token' },
                { key: 'in', value: 'query' },
              ],
            },
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.security).toStrictEqual([{ 'apikeyAuth_header_X-API-Key': [] }])
    expect(result.components?.securitySchemes).toStrictEqual({
      'apikeyAuth_header_X-API-Key': { type: 'apiKey', name: 'X-API-Key', in: 'header' },
      apikeyAuth_query_api_token: { type: 'apiKey', name: 'api_token', in: 'query' },
    })
    expect(result.paths?.['/orders']?.get?.security).toStrictEqual([{ apikeyAuth_query_api_token: [] }])
  })

  const apiKey: Auth = {
    type: 'apikey',
    apikey: [
      { key: 'key', value: 'X-API-Key', type: 'string' },
      { key: 'value', value: '{{apiKey}}', type: 'string' },
      { key: 'in', value: 'header', type: 'string' },
    ],
  }
  const apiKeySecurity = [{ 'apikeyAuth_header_X-API-Key': [] }]
  const apiKeyScheme = { type: 'apiKey', name: 'X-API-Key', in: 'header' }
  const request: Item = {
    name: 'Delete item',
    request: {
      method: 'DELETE',
      header: [],
      url: {
        raw: 'https://api.example.com/items/1',
        protocol: 'https',
        host: ['api', 'example', 'com'],
        path: ['items', '1'],
      },
    },
    response: [],
  }

  const collectionWith = (
    item: Item | ItemGroup,
    auth: Auth | undefined = { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
  ): PostmanCollection => ({
    info: { name: 'C2', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
    auth,
    item: [item],
  })

  const authCases = [
    {
      type: 'apikey',
      auth: apiKey,
      key: 'apikeyAuth_header_X-API-Key',
      scheme: apiKeyScheme,
      security: apiKeySecurity,
    },
    {
      type: 'basic',
      auth: { type: 'basic' },
      key: 'basicAuth',
      scheme: { type: 'http', scheme: 'basic' },
      security: [{ basicAuth: [] }],
    },
    {
      type: 'bearer',
      auth: { type: 'bearer' },
      key: 'bearerAuth',
      scheme: { type: 'http', scheme: 'bearer' },
      security: [{ bearerAuth: [] }],
    },
    { type: 'noauth', auth: { type: 'noauth' }, key: 'noauthAuth', scheme: undefined, security: [] },
  ] satisfies { type: string; auth: Auth; key: string; scheme: unknown; security: Record<string, string[]>[] }[]

  it('uses folder API key authentication instead of collection bearer authentication', () => {
    const result = convert(collectionWith({ name: 'Admin', auth: apiKey, item: [request] }))
    expect(result.paths?.['/items/1']?.delete?.security).toStrictEqual(apiKeySecurity)
    expect(result.components?.securitySchemes?.['apikeyAuth_header_X-API-Key']).toStrictEqual(apiKeyScheme)
  })

  for (const authCase of authCases) {
    for (const depth of [1, 2]) {
      for (const hasCollectionAuth of [false, true]) {
        it(`inherits ${authCase.type} at folder depth ${depth}, collection auth ${hasCollectionAuth}`, () => {
          const folder: ItemGroup = { name: 'Admin', auth: authCase.auth, item: [request] }
          const top = depth === 1 ? folder : { name: 'Outer', item: [folder] }
          // A distinct collection type makes incorrect fallback observable for bearer folders too.
          const input = collectionWith(top)
          input.auth = hasCollectionAuth ? { type: 'digest' } : undefined
          const result = convert(input)
          expect({
            security: result.paths?.['/items/1']?.delete?.security,
            scheme: result.components?.securitySchemes?.[authCase.key],
          }).toStrictEqual({ security: authCase.security, scheme: authCase.scheme })
        })
      }
    }
  }

  it.each([
    {
      label: 'null request auth',
      leaf: { ...request, request: { method: 'DELETE', url: 'https://api.example.com/items/1', auth: null } },
    },
    {
      label: 'inherit request auth',
      leaf: {
        ...request,
        request: { method: 'DELETE', url: 'https://api.example.com/items/1', auth: { type: 'inherit' } },
      },
    },
    { label: 'string request', leaf: { name: 'Delete item', request: 'https://api.example.com/items/1' } },
  ] satisfies { label: string; leaf: Item }[])('inherits folder auth for $label', ({ leaf }) => {
    const result = convert(collectionWith({ name: 'Admin', auth: apiKey, item: [leaf] }))
    const operation =
      typeof leaf.request === 'string' ? result.paths?.['/items/1']?.get : result.paths?.['/items/1']?.delete
    expect(operation?.security).toStrictEqual(apiKeySecurity)
  })

  it.each([null, { type: 'inherit' }] satisfies (Auth | null)[])(
    'inherits through a child folder with auth %j',
    (auth) => {
      const result = convert(
        collectionWith({ name: 'Admin', auth: apiKey, item: [{ name: 'Inner', auth, item: [request] }] }),
      )
      expect(result.paths?.['/items/1']?.delete?.security).toStrictEqual(apiKeySecurity)
    },
  )

  it.each([
    { label: 'nearest basic folder', auth: { type: 'basic' }, security: [{ basicAuth: [] }] },
    { label: 'nearest noauth folder', auth: { type: 'noauth' }, security: [] },
  ] satisfies { label: string; auth: Auth; security: Record<string, string[]>[] }[])(
    'uses $label over outer-folder auth',
    ({ auth, security }) => {
      const result = convert(
        collectionWith({ name: 'Admin', auth: apiKey, item: [{ name: 'Inner', auth, item: [request] }] }),
      )
      expect(result.paths?.['/items/1']?.delete?.security).toStrictEqual(security)
    },
  )

  it.each([
    { label: 'selected request', options: { requestIndexPaths: [[0, 0]] } },
    { label: 'selected folder', options: { requestIndexPaths: [[0]] } },
    { label: 'selected nested folder', options: { requestIndexPaths: [[0, 0]] }, nested: true },
    { label: 'mergeOperation enabled', options: { mergeOperation: true } },
  ] satisfies { label: string; options: ConvertOptions; nested?: boolean }[])(
    'inherits folder auth with $label',
    (testCase) => {
      const folder: ItemGroup = { name: 'Admin', auth: apiKey, item: [request] }
      const top =
        'nested' in testCase && testCase.nested
          ? { name: 'Outer', auth: apiKey, item: [{ name: 'Inner', item: [request] }] }
          : folder
      const result = convert(collectionWith(top), testCase.options)
      expect(result.paths?.['/items/1']?.delete?.security).toStrictEqual(apiKeySecurity)
    },
  )

  it('inherits v2.0 object-shaped API key attributes', () => {
    const input = collectionWith({
      name: 'Admin',
      auth: { type: 'apikey', apikey: { key: 'X-API-Key', in: 'header', value: '{{apiKey}}' } },
      item: [request],
    })
    input.info.schema = 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json'
    const result = convert(input)
    expect(result.paths?.['/items/1']?.delete?.security).toStrictEqual(apiKeySecurity)
  })

  it.each([
    { type: 'digest', security: [{ digestAuth: [] }] },
    { type: 'oauth2', security: [{ oauth2Auth: [] }] },
  ])('inherits supported $type folder auth', ({ type, security }) => {
    const result = convert(collectionWith({ name: 'Admin', auth: { type }, item: [request] }))
    expect(result.paths?.['/items/1']?.delete?.security).toStrictEqual(security)
  })

  it.each(authCases)('preserves explicit request $type auth over folder auth', ({ auth, security, key, scheme }) => {
    const leaf: Item = { ...request, request: { method: 'DELETE', url: 'https://api.example.com/items/1', auth } }
    const result = convert(collectionWith({ name: 'Admin', auth: { type: 'digest' }, item: [leaf] }))
    expect(result.paths?.['/items/1']?.delete?.security).toStrictEqual(security)
    expect(result.components?.securitySchemes?.[key]).toStrictEqual(scheme)
  })

  it.each([undefined, null, { type: 'inherit' }] satisfies (Auth | null | undefined)[])(
    'preserves collection inheritance with request auth %j and no folder override',
    (auth) => {
      const leaf: Item = { ...request, request: { method: 'DELETE', url: 'https://api.example.com/items/1', auth } }
      const result = convert(collectionWith({ name: 'Admin', item: [leaf] }))
      expect(result.paths?.['/items/1']?.delete?.security).toBeUndefined()
      expect(result.security).toStrictEqual([{ bearerAuth: [] }])
    },
  )

  it.each([
    { auth: undefined, security: apiKeySecurity },
    { auth: null, security: apiKeySecurity },
    { auth: { type: 'inherit' }, security: apiKeySecurity },
    { auth: { type: 'noauth' }, security: [] },
    { auth: { type: 'basic' }, security: [{ basicAuth: [] }] },
  ] satisfies { auth: Auth | null | undefined; security: Record<string, string[]>[] }[])(
    'preserves ancestor authentication when selecting a nested folder or request with folder auth %j',
    ({ auth, security }) => {
      const collection = collectionWith({
        auth: apiKey,
        item: [{ auth, item: [request] }],
      })
      for (const requestIndexPaths of [[[0, 0]], [[0, 0, 0]]]) {
        const result = convert(collection, { requestIndexPaths })
        expect(result.paths?.['/items/1']?.delete?.security).toStrictEqual(security)
      }
    },
  )

  it('keeps folder authentication isolated from siblings and unselected branches', () => {
    const collection = collectionWith({ name: 'Admin', auth: apiKey, item: [request] })
    collection.item.push({ name: 'Sibling', request: 'https://api.example.com/sibling' })

    const result = convert(collection)
    expect(result.paths?.['/items/1']?.delete?.security).toStrictEqual(apiKeySecurity)
    expect(result.paths?.['/sibling']?.get?.security).toBeUndefined()
    expect(result.security).toStrictEqual([{ bearerAuth: [] }])

    const selected = convert(collection, { requestIndexPaths: [[1]] })
    expect(Object.keys(selected.paths ?? {})).toStrictEqual(['/sibling'])
    expect(selected.components?.securitySchemes).toStrictEqual({ bearerAuth: { type: 'http', scheme: 'bearer' } })
  })

  it.each([
    { label: 'full collection', options: {} },
    { label: 'selected requests', options: { requestIndexPaths: [[0, 0], [0, 1], [1, 0], [2]] } },
    { label: 'selected folders', options: { requestIndexPaths: [[0], [1], [2]] } },
  ] satisfies { label: string; options: ConvertOptions }[])(
    'keeps distinct OAuth2 settings isolated for $label',
    ({ options }) => {
      const oauthAuth = (name: string): Auth => ({
        type: 'oauth2',
        oauth2: [
          { key: 'authUrl', value: `https://${name}.example/authorize` },
          { key: 'accessTokenUrl', value: `https://${name}.example/token` },
          { key: 'scope', value: name },
        ],
      })
      const oauthScheme = (name: string): OpenAPIV3_1.SecuritySchemeObject => ({
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: `https://${name}.example/authorize`,
            tokenUrl: `https://${name}.example/token`,
            scopes: { [name]: name },
          },
        },
      })
      const collection: PostmanCollection = {
        info: { name: 'OAuth folders', schema: SCHEMA },
        auth: oauthAuth('collection'),
        item: [
          {
            name: 'Folder',
            auth: oauthAuth('folder'),
            item: [{ request: 'https://api.example.com/first' }, { request: 'https://api.example.com/second' }],
          },
          {
            name: 'Other folder',
            auth: oauthAuth('other'),
            item: [{ request: 'https://api.example.com/other' }],
          },
          { request: 'https://api.example.com/sibling' },
        ],
      }

      const result = convert(collection, options)
      expect(result.security).toStrictEqual([{ oauth2Auth: ['collection'] }])
      expect(result.paths?.['/sibling']?.get?.security).toBeUndefined()
      expect(result.paths?.['/first']?.get?.security).toStrictEqual([{ oauth2Auth_2: ['folder'] }])
      expect(result.paths?.['/second']?.get?.security).toStrictEqual([{ oauth2Auth_2: ['folder'] }])
      expect(result.paths?.['/other']?.get?.security).toStrictEqual([{ oauth2Auth_3: ['other'] }])
      expect(result.components?.securitySchemes).toStrictEqual({
        oauth2Auth: oauthScheme('collection'),
        oauth2Auth_2: oauthScheme('folder'),
        oauth2Auth_3: oauthScheme('other'),
      })
    },
  )
})
