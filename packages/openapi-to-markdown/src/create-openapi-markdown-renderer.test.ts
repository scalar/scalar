import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  type OpenApiRenderOptions,
  createHtmlFromOpenApi,
  createMarkdownFromOpenApi,
  createOpenApiMarkdownRenderer,
} from './index'

const document = {
  openapi: '3.1.0',
  info: { title: 'Pets', version: '1.0', description: 'Pet documentation' },
  servers: [{ url: 'https://pets.example.com' }],
  security: [{ Bearer: [] }],
  tags: [{ name: 'Pets', description: 'Manage pets' }],
  components: {
    securitySchemes: { Bearer: { type: 'http', scheme: 'bearer' } },
    schemas: {
      Pet: {
        type: 'object',
        properties: { name: { type: 'string' }, parent: { $ref: '#/components/schemas/Pet' } },
      },
    },
  },
  paths: {
    '/pets': {
      parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
      get: {
        operationId: 'listPets',
        summary: 'List pets',
        tags: ['Pets'],
        responses: {
          '200': {
            description: 'Pets returned',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
          },
        },
      },
      post: { summary: 'Create pet', responses: { '201': { description: 'Created' } } },
    },
  },
  webhooks: {
    petCreated: {
      post: {
        summary: 'Pet created event',
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } } },
        responses: { '200': { description: 'Accepted' } },
      },
    },
  },
}

const selections: (OpenApiRenderOptions | undefined)[] = [
  undefined,
  { introduction: true },
  { operation: { path: '/pets', method: 'get' } },
  { operation: { operationId: 'listPets' } },
  { operation: { pointer: '#/paths/~1pets/get' } },
  { tag: 'Pets' },
  { model: 'Pet' },
  { webhook: { name: 'petCreated', method: 'post' } },
]

describe('create-openapi-markdown-renderer', () => {
  it('preserves Markdown output for every selector', async () => {
    const renderer = await createOpenApiMarkdownRenderer(document)
    for (const selection of selections) {
      expect(await renderer.render(selection)).toBe(await createMarkdownFromOpenApi(document, selection))
    }
  })

  it('keeps repeated, reversed and concurrent selections independent without mutating input', async () => {
    const input = structuredClone(document)
    const renderer = await createOpenApiMarkdownRenderer(input)
    const expected = await Promise.all(selections.map((selection) => renderer.render(selection)))
    for (const index of selections.keys()) {
      const reverseIndex = selections.length - 1 - index
      expect(await renderer.render(selections[reverseIndex])).toBe(expected[reverseIndex])
    }
    expect(await Promise.all(selections.map((selection) => renderer.render(selection)))).toEqual(expected)
    expect(input).toEqual(document)
    const operation = await renderer.render({ operation: { path: '/pets', method: 'get' } })
    expect(operation).toContain('https://pets.example.com')
    expect(operation).toContain('Bearer')
    expect(operation).toContain('limit')
    expect(operation).not.toContain('Create pet')
    expect(operation).not.toContain('Pet created event')
  })

  it('keeps the HTML API available on demand', async () => {
    const renderer = await createOpenApiMarkdownRenderer(document)
    expect(await renderer.renderHtml({ introduction: true })).toContain('<h1>Pets</h1>')
    expect(await createHtmlFromOpenApi(document, { introduction: true })).toContain('<h1>Pets</h1>')
  })

  it('renders GFM tables and strikethrough in both HTML entry points', async () => {
    const input = {
      openapi: '3.1.1',
      info: {
        title: 'GFM',
        version: '1',
        description: '| Field | Value |\n| --- | --- |\n| name | pet |\n\n~~deprecated~~',
      },
    }
    const renderer = await createOpenApiMarkdownRenderer(input)
    const html = await renderer.renderHtml({ introduction: true })

    expect(html).toContain('<table>')
    expect(html).toContain('<th>Field</th>')
    expect(html).toContain('<td>pet</td>')
    expect(html).toContain('<del>deprecated</del>')
    expect(await createHtmlFromOpenApi(input, { introduction: true })).toBe(html)
  })

  it('renders chained path-item references with sibling overrides', async () => {
    const renderer = await createOpenApiMarkdownRenderer({
      openapi: '3.1.1',
      info: { title: 'Chained paths', version: '1' },
      paths: {
        '/pets': {
          $ref: '#/components/pathItems/Alias',
          parameters: [{ name: 'outer', in: 'header', schema: { type: 'string' } }],
        },
      },
      components: {
        pathItems: {
          Alias: {
            $ref: '#/components/pathItems/Target',
            get: { summary: 'Alias get' },
          },
          Target: {
            get: { summary: 'Original get' },
            post: { summary: 'Create pet' },
          },
        },
      },
    })

    const markdown = await renderer.render()
    expect(markdown).toContain('### Alias get')
    expect(markdown).toContain('### Create pet')
    expect(markdown).not.toContain('Original get')
    const selected = await renderer.render({ operation: { path: '/pets', method: 'post' } })
    expect(selected).toContain('### Create pet')
    expect(selected).toContain('outer')
    expect(selected).not.toContain('Alias get')
  })

  it('renders path-item chains bundled from external files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'chained-markdown-'))
    try {
      await writeFile(join(dir, 'alias.json'), JSON.stringify({ $ref: './target.json' }))
      await writeFile(join(dir, 'target.json'), JSON.stringify({ get: { summary: 'External pets' } }))
      const input = join(dir, 'api.json')
      await writeFile(
        input,
        JSON.stringify({
          openapi: '3.1.1',
          info: { title: 'External chain', version: '1' },
          paths: { '/pets': { $ref: './alias.json' } },
        }),
      )
      const renderer = await createOpenApiMarkdownRenderer(input)
      expect(await renderer.render()).toContain('### External pets')
      expect(await renderer.render({ operation: { path: '/pets', method: 'get' } })).toContain('### External pets')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('loads file references only during creation and retains the prepared document', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reusable-markdown-'))
    try {
      await writeFile(
        join(dir, 'pet.json'),
        JSON.stringify({ type: 'object', properties: { externalField: { type: 'string' } } }),
      )
      await writeFile(
        join(dir, 'api.json'),
        JSON.stringify({
          ...document,
          components: { ...document.components, schemas: { Pet: { $ref: './pet.json' } } },
        }),
      )
      const renderer = await createOpenApiMarkdownRenderer(join(dir, 'api.json'))
      await rm(dir, { recursive: true, force: true })
      expect(await renderer.render({ model: 'Pet' })).toContain('externalField')
      expect(await renderer.render({ operation: { operationId: 'listPets' } })).toContain('externalField')
      expect(await renderer.render({ model: 'Pet' })).toContain('externalField')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('retains a snapshot when the caller changes the input after preparation', async () => {
    const input = structuredClone(document)
    const renderer = await createOpenApiMarkdownRenderer(input)
    input.info.title = 'Updated title'
    expect(await renderer.render({ introduction: true })).toContain('# Pets')
    expect(await renderer.render({ introduction: true })).not.toContain('Updated title')
    expect(await (await createOpenApiMarkdownRenderer(input)).render({ introduction: true })).toContain(
      '# Updated title',
    )
  })

  it('recovers after invalid selections and isolates separate renderer instances', async () => {
    const first = await createOpenApiMarkdownRenderer(document)
    const second = await createOpenApiMarkdownRenderer({ ...document, info: { title: 'Other API', version: '2' } })
    await expect(first.render({ tag: 'Missing' })).rejects.toThrow('Tag "Missing" was not found')
    await expect(first.render({ operation: { path: '/missing', method: 'get' } })).rejects.toThrow()
    expect(await first.render({ introduction: true })).toContain('# Pets')
    expect(await first.render({ introduction: true })).not.toContain('Other API')
    expect(await second.render({ introduction: true })).toContain('# Other API')
  })

  it('reuses upgraded OpenAPI 2.0 documents', async () => {
    const legacy = {
      swagger: '2.0',
      info: { title: 'Legacy', version: '1' },
      host: 'legacy.example.com',
      schemes: ['https'],
      definitions: { Pet: { type: 'object', properties: { name: { type: 'string' } } } },
      paths: {
        '/pets': { get: { responses: { '200': { description: 'Pets', schema: { $ref: '#/definitions/Pet' } } } } },
      },
    }
    const renderer = await createOpenApiMarkdownRenderer(legacy)
    for (const selection of [
      { introduction: true },
      { operation: { path: '/pets', method: 'get' } },
      { model: 'Pet' },
    ] as const) {
      expect(await renderer.render(selection)).toBe(await createMarkdownFromOpenApi(legacy, selection))
    }
  })
  it('keeps description references stable across repeated, reversed, and concurrent pages', async () => {
    const input = {
      openapi: '3.1.1',
      info: { title: 'References', version: '1' },
      paths: Object.fromEntries(
        ['a', 'b'].map((name) => [
          `/${name}`,
          {
            get: {
              description: `[read][docs]\n\n[docs]: https://${name}.example`,
              responses: { '200': { description: 'OK' } },
            },
          },
        ]),
      ),
    }
    const renderer = await createOpenApiMarkdownRenderer(input)
    const a = { operation: { path: '/a', method: 'get' } } as const
    const b = { operation: { path: '/b', method: 'get' } } as const
    await renderer.render(b)
    const expected = await createMarkdownFromOpenApi(input, a)
    expect(await renderer.render(a)).toBe(expected)
    const concurrent = await Promise.all([renderer.render(a), renderer.render(b), renderer.render(a)])
    expect(concurrent).toStrictEqual([expected, await createMarkdownFromOpenApi(input, b), expected])
  })
})
