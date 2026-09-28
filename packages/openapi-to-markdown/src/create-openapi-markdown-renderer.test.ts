import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi as browserRender } from './browser'
import { type OpenApiRenderOptions, createMarkdownFromOpenApi, createOpenApiMarkdownRenderer } from './index'
import { loadDocument } from './load-document'

const reference = (name: string): { $ref: string } => ({ $ref: `#/components/schemas/${name}` })
const fixture = (depth = 2): Record<string, unknown> => {
  const operation = {
    description: 'Read the account',
    responses: {
      '200': { description: 'Success', content: { 'application/json': { schema: reference('Account') } } },
      '400': { $ref: '#/components/responses/Error' },
    },
  }
  return {
    openapi: '3.1.0',
    info: { title: 'Linked API', version: '1' },
    servers: [{ url: 'https://example.com' }],
    security: [{ token: [] }],
    paths: {
      '/account': {
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' } }],
        get: operation,
      },
      '/other': { get: operation },
    },
    webhooks: { changed: { post: operation } },
    components: {
      securitySchemes: { token: { type: 'apiKey', in: 'header', name: 'X-Token' } },
      responses: { Error: { description: 'Failure', content: { 'application/json': { schema: reference('Error') } } } },
      schemas: {
        Account: {
          type: 'object',
          required: ['customer'],
          properties: {
            customer: { ...reference('Customer~1Name~0'), description: 'The owner' },
            inline: { type: ['string', 'null'], minLength: 2 },
            allowed: true,
            denied: false,
            union: { oneOf: [reference('Node0'), { type: 'null' }] },
          },
        },
        'Customer/Name~': { type: 'object', properties: { cycle: reference('Account'), hidden: reference('Node0') } },
        Error: { type: 'object', properties: { cause: reference('Node0') } },
        ...Object.fromEntries(
          Array.from({ length: depth }, (_, index) => [
            `Node${index}`,
            {
              type: 'object',
              properties: {
                deepSecret: { type: 'string' },
                next: reference(index + 1 < depth ? `Node${index + 1}` : 'Account'),
              },
            },
          ]),
        ),
      },
    },
  }
}
const linked: OpenApiRenderOptions = {
  operation: { path: '/account', method: 'get' },
  schemaReferences: { mode: 'linked', resolveUrl: ({ name }) => `/models/${encodeURIComponent(name)}` },
}

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

  /** Every level references the next one from each property, without any cycle. */
  const fanOut = (branching: number, levels: number): Record<string, unknown> => {
    const schemas: Record<string, unknown> = {}
    for (let level = 0; level <= levels; level++) {
      const properties: Record<string, unknown> = {}
      for (let branch = 0; branch < branching; branch++) {
        properties[`p${branch}`] =
          level < levels ? { $ref: `#/components/schemas/L${level + 1}` } : { type: 'string', description: 'LEAF' }
      }
      schemas[`L${level}`] = { type: 'object', properties }
    }
    return {
      openapi: '3.1.0',
      info: { title: 'Fan-out', version: '1' },
      paths: {
        '/a': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/L0' } } },
              },
            },
          },
        },
      },
      components: { schemas },
    }
  }

  it('renders a densely shared schema graph in linear time and size', async () => {
    const renderer = await createOpenApiMarkdownRenderer(fanOut(5, 10))
    const start = performance.now()
    const markdown = await renderer.render({ operation: { path: '/a', method: 'get' } })
    expect(performance.now() - start).toBeLessThan(1000)
    // Inline in the response; the model sections refer back to it.
    expect(markdown.match(/LEAF/g)?.length).toBe(5)
    expect(markdown.match(/Schema `L10` is shown above\./g)?.length).toBe(5)
    expect(markdown.length).toBeLessThan(250_000)
    for (let level = 0; level <= 10; level++) {
      expect(markdown).toContain(`### L${level}`)
    }
  })

  it('renders a densely shared schema graph once in the whole document', async () => {
    const start = performance.now()
    const markdown = await createMarkdownFromOpenApi(fanOut(5, 10))
    expect(performance.now() - start).toBeLessThan(1000)
    expect(markdown.match(/LEAF/g)?.length).toBe(5)
    expect(markdown.length).toBeLessThan(250_000)
  })

  it('expands a model in its own section when the page has not shown it yet', async () => {
    const markdown = await createMarkdownFromOpenApi(fanOut(2, 2), { model: 'L1' })
    expect(markdown).toContain('### L1')
    expect(markdown.match(/LEAF/g)?.length).toBe(2)
    expect(markdown).not.toContain('Schema `L1` is shown')
  })

  it('renders each shared schema once per page, independently of other pages', async () => {
    const input = fanOut(2, 2)
    const renderer = await createOpenApiMarkdownRenderer(input)
    const page = { operation: { path: '/a', method: 'get' } } as const
    const [first, second] = await Promise.all([renderer.render(page), renderer.render(page)])
    expect(first).toBe(second)
    expect(first).toContain('Schema `L2` is shown above.')
    expect(await renderer.render(page)).toBe(first)
  })

  it('retains immediate fields and operation context while linking the graph', async () => {
    const input = fixture()
    const before = JSON.stringify(input)
    const renderer = await createOpenApiMarkdownRenderer(input)
    const output = await renderer.render(linked)
    for (const value of [
      'GET',
      '/account',
      'Read the account',
      'https://example.com',
      'X-Token',
      '`id`',
      '(required)',
      'The owner',
      'string | null',
      'minLength',
      'true schema',
      'false schema',
      'One of:',
      '[Customer/Name\\~](/models/Customer%2FName~)',
      '[Node0](/models/Node0)',
      'Status: 400',
      'Generated example omitted',
    ])
      expect(output).toContain(value)
    expect(output).not.toContain('deepSecret')
    expect(output).not.toContain('## Schemas')
    expect(JSON.stringify(input)).toBe(before)
    expect(await renderer.render(linked)).toBe(output)
    const normal = await renderer.render({ operation: { path: '/account', method: 'get' } })
    expect(normal).toContain('deepSecret')
    expect(normal).toContain('## Schemas')
    expect(await renderer.render(linked)).toBe(output)
  })

  it('does not grow with graph depth and isolates concurrent URL callbacks', async () => {
    const small = await createOpenApiMarkdownRenderer(fixture(2))
    const large = await createOpenApiMarkdownRenderer(fixture(100))
    expect(await large.render(linked)).toBe(await small.render(linked))
    const [withUrls, withoutUrls] = await Promise.all([
      large.render(linked),
      large.render({ ...linked, schemaReferences: { mode: 'linked' } }),
    ])
    expect(withUrls).toContain('/models/Node0')
    expect(withoutUrls).toContain('Schema: `Node0`')
    expect(withoutUrls).not.toContain('/models/')
  })

  it('supports model and webhook pages and the browser entry point', async () => {
    const input = fixture()
    const renderer = await createOpenApiMarkdownRenderer(input)
    for (const selection of [{ model: 'Account' }, { webhook: { name: 'changed', method: 'post' } }] as const) {
      const options = { ...selection, schemaReferences: linked.schemaReferences }
      const output = await renderer.render(options)
      expect(output).toContain('/models/Node0')
      expect(output).not.toContain('deepSecret')
      expect(await browserRender(await loadDocument(input), options)).toBe(output)
    }
  })

  it('preserves reference siblings as independent constraints', async () => {
    const renderer = await createOpenApiMarkdownRenderer({
      openapi: '3.1.0',
      info: { title: 'Siblings', version: '1' },
      components: {
        schemas: {
          Base: { type: 'object', required: ['base'], properties: { base: { type: 'string' } } },
          Model: {
            ...reference('Base'),
            required: ['extra'],
            properties: { extra: { allOf: [{ anyOf: [false, { type: 'number', minimum: 3 }] }] } },
          },
        },
      },
    })
    const output = await renderer.render({ model: 'Model', schemaReferences: { mode: 'linked' } })
    for (const value of [
      'All of:',
      'Any of:',
      '`base` (required)',
      '`extra` (required)',
      'minimum: `3`',
      'false schema',
    ])
      expect(output).toContain(value)
  })
  it('keeps supplied examples and uses text for unsafe or missing URLs', async () => {
    const renderer = await createOpenApiMarkdownRenderer({
      openapi: '3.1.0',
      info: { title: 'Examples', version: '1' },
      components: {
        schemas: {
          Base: { type: 'object', properties: { next: reference('Base') } },
          Model: { ...reference('Base'), required: ['next'], example: { next: 'authored value' } },
        },
      },
    })
    const output = await renderer.render({
      model: 'Model',
      schemaReferences: { mode: 'linked', resolveUrl: () => 'javascript:alert(1)' },
    })
    expect(output).toContain('authored value')
    expect(output).toContain('**Required fields:** `next`')
    expect(output).toContain('Schema: `Base`')
    expect(output).not.toContain('javascript:')
    expect(output).not.toContain('Generated example omitted')
  })
})
