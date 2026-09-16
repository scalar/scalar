import { describe, expect, it } from 'vitest'

import { createHtmlFromOpenApi, createMarkdownFromOpenApi } from './create-markdown-from-openapi'
import type { OpenApiRenderOptions } from './select-document'

const invalidSelectorDocument = {
  openapi: '3.1.1',
  info: { title: 'API', version: '1' },
  paths: { '/pets': { get: { responses: { '200': { description: 'OK' } } } } },
}

type SelectionCase = {
  name: string
  document: Record<string, unknown>
  options?: OpenApiRenderOptions
  error?: RegExp
  checks: { name: string; pattern: RegExp; absent?: boolean; section?: string }[]
}

const response = {
  description: 'Selected response',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
}
const document = {
  info: { title: 'Selection API', version: '1', description: 'Introduction prose' },
  servers: [{ url: 'https://root.example' }],
  security: [{ Token: ['read'] }],
  tags: [
    { name: 'pets', description: 'Pet tag metadata' },
    { name: 'empty', description: 'Empty tag metadata' },
    { name: 'unrelated', description: 'Unrelated tag metadata' },
  ],
  paths: {
    '/pets': {
      servers: [{ url: 'https://path.example' }],
      parameters: [{ name: 'limit', in: 'query', description: 'Inherited parameter', schema: { type: 'integer' } }],
      get: {
        operationId: 'listPets',
        summary: 'Selected operation',
        tags: ['pets', 'implicit'],
        responses: { '200': response },
      },
      post: {
        summary: 'Override operation',
        tags: ['pets'],
        servers: [{ url: 'https://override.example' }],
        security: [],
        responses: { '201': { description: 'Override response' } },
      },
    },
    '/other': {
      get: {
        summary: 'Unrelated operation',
        tags: ['unrelated'],
        responses: { '200': { description: 'Unrelated response' } },
      },
    },
  },
  components: {
    securitySchemes: { Token: { type: 'http', scheme: 'bearer' }, OtherAuth: { type: 'http', scheme: 'basic' } },
    schemas: {
      Pet: {
        type: 'object',
        properties: { petName: { type: 'string' }, status: { $ref: '#/components/schemas/Status' } },
      },
      Status: { type: 'string', enum: ['pending', 'complete'], default: 'pending' },
      Names: { type: 'array', items: { type: 'string', format: 'email' } },
      Choice: { oneOf: [{ $ref: '#/components/schemas/Status' }, { type: 'integer' }] },
      Alias: { $ref: '#/components/schemas/Pet' },
      Node: {
        type: 'object',
        properties: { nodeName: { type: 'string' }, next: { $ref: '#/components/schemas/Node' } },
      },
      Unrelated: { type: 'object', properties: { unrelatedField: { type: 'string' } } },
    },
  },
  webhooks: {
    petEvent: {
      parameters: [{ name: 'delivery', in: 'header', schema: { type: 'string' } }],
      post: {
        summary: 'Selected webhook',
        requestBody: {
          required: true,
          description: 'Event payload description',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
        },
        responses: { '202': { description: 'Event accepted' }, '400': response },
      },
      put: { summary: 'Other webhook method', responses: { '204': { description: 'Other webhook response' } } },
    },
    unrelatedEvent: { post: { summary: 'Unrelated webhook', responses: { '200': { description: 'OK' } } } },
  },
}

const check = (name: string, pattern: RegExp, section?: string, absent = false): SelectionCase['checks'][number] => ({
  name,
  pattern,
  section,
  absent,
})
const scoped = [
  check('unrelated operation excluded', /Unrelated operation/, undefined, true),
  check('unrelated schemas excluded', /### Unrelated|unrelatedField/, undefined, true),
  check('unrelated webhook excluded', /Unrelated webhook/, undefined, true),
  check('unrelated tag excluded', /Unrelated tag metadata/, undefined, true),
  check('unrelated authentication excluded', /OtherAuth/, undefined, true),
]
const operationChecks = [
  ...scoped,
  check('operation selected', /Selected operation/, '## Operations'),
  check('sibling excluded', /Override operation/, undefined, true),
  check('webhooks excluded', /## Webhooks/, undefined, true),
  check('inherited parameter', /Inherited parameter/, '### Selected operation'),
  check('effective server', /https:\/\/path.example/, '### Selected operation'),
  check('root server overridden', /https:\/\/root.example/, undefined, true),
  check('inherited security and scopes', /Token[\s\S]*read[\s\S]*bearer/, '### Selected operation'),
  check('response schema resolved', /petName/, '#### Responses'),
  check('schema dependency included', /### Status/, '## Schemas'),
  check('unused model excluded', /### Names|### Choice|### Node/, undefined, true),
]

/** Every selection assertion is required, including exclusions. */
const selectionFixtures: SelectionCase[] = [
  ...(
    [
      { path: '/pets', method: 'GET' },
      { operationId: 'listPets' },
      { pointer: '#/paths/~1pets/get' },
      { pointer: '/paths/~1pets/get' },
    ] satisfies NonNullable<OpenApiRenderOptions['operation']>[]
  ).map((operation, index) => ({
    name: `selected-operation-${index}`,
    document,
    options: { operation },
    checks: operationChecks,
  })),
  {
    name: 'selected-override',
    document,
    options: { operation: { path: '/pets', method: 'post' } },
    checks: [
      ...scoped,
      check('override server', /https:\/\/override.example/, '### Override operation'),
      check('anonymous override', /No authentication required/, '### Override operation'),
      check('inherited auth excluded', /Token|bearer/, undefined, true),
      check('inherited servers excluded', /https:\/\/(root|path).example/, undefined, true),
      check('models excluded', /## Schemas/, undefined, true),
    ],
  },
  ...['pets', 'implicit', 'empty'].map(
    (tag): SelectionCase => ({
      name: `selected-tag-${tag}`,
      document,
      options: { tag },
      checks: [
        ...scoped,
        check('tag heading', new RegExp(`### ${tag}`), '## Tags'),
        check('webhooks excluded', /## Webhooks/, undefined, true),
        ...(tag === 'empty'
          ? [
              check('empty metadata', /Empty tag metadata/, '## Tags'),
              check('operations excluded', /## Operations/, undefined, true),
              check('models excluded', /## Schemas/, undefined, true),
            ]
          : [
              check('member operation', /Selected operation/, '## Operations'),
              check('dependency', /### Status/, '## Schemas'),
            ]),
        ...(tag === 'pets'
          ? [
              check('declared metadata', /Pet tag metadata/, '## Tags'),
              check('second member', /Override operation/, '## Operations'),
              check('other tag excluded', /implicit/, undefined, true),
            ]
          : []),
        ...(tag === 'implicit'
          ? [
              check('nonmember excluded', /Override operation/, undefined, true),
              check('declared tag excluded', /Pet tag metadata/, undefined, true),
            ]
          : []),
      ],
    }),
  ),
  ...Object.entries({
    Status: /possible values:.*pending.*complete[\s\S]*default:.*pending/,
    Names: /Array of:[\s\S]*email/,
    Choice: /One of:[\s\S]*pending[\s\S]*integer/,
    Alias: /petName/,
    Node: /nodeName/,
  }).map(
    ([model, pattern]): SelectionCase => ({
      name: `selected-model-${model}`,
      document,
      options: { model },
      checks: [
        ...scoped,
        check('model content', pattern, `### ${model}`),
        check('operations excluded', /## Operations/, undefined, true),
        check('webhooks excluded', /## Webhooks/, undefined, true),
        check('tags excluded', /## Tags/, undefined, true),
        ...(model === 'Alias' || model === 'Choice'
          ? [check('referenced schema included', /### Status/, '## Schemas')]
          : []),
      ],
    }),
  ),
  {
    name: 'selected-webhook',
    document,
    options: { webhook: { name: 'petEvent', method: 'POST' } },
    checks: [
      ...scoped,
      check('name and method', /Method:.*`POST`[\s\S]*Webhook:.*`petEvent`/, '## Webhooks'),
      check('no invented URL', /\/webhooks\/petEvent/, undefined, true),
      check('operations excluded', /## Operations/, undefined, true),
      check('other method excluded', /Other webhook method/, undefined, true),
      check('parameters', /`delivery`/, '#### Parameters'),
      check('payload', /petName/, '#### Request Body'),
      check('payload description', /Event payload description/, '#### Request Body'),
      check('payload required', /Required:.*true/, '#### Request Body'),
      check('responses', /202 Event accepted[\s\S]*400 Selected response[\s\S]*petName/, '#### Responses'),
      check('inheritance', /https:\/\/root.example[\s\S]*Token/, '### Selected webhook'),
      check('dependencies', /### Pet[\s\S]*### Status/, '## Schemas'),
    ],
  },
  {
    name: 'selected-introduction',
    document,
    options: { introduction: true },
    checks: [
      ...scoped,
      check('metadata', /# Selection API[\s\S]*Introduction prose/),
      check('servers', /https:\/\/root.example/, '## Servers'),
      check('authentication', /Token[\s\S]*bearer/, '#### Authentication'),
      check('no reference sections', /## (Operations|Schemas|Webhooks|Tags)/, undefined, true),
    ],
  },
  ...(
    [
      [{ operation: { operationId: 'missing' } }, /was not found/],
      [{ operation: { path: '/pets', method: 'delete' } }, /Operation not found/],
      [{ operation: { pointer: '#/components/schemas/Pet' } }, /must target an operation/],
      [{ model: 'missing' }, /Model.*was not found/],
      [{ tag: 'missing' }, /Tag.*was not found/],
      [{ webhook: { name: 'petEvent', method: 'get' } }, /Webhook.*was not found/],
    ] satisfies [OpenApiRenderOptions, RegExp][]
  ).map(([options, error], index) => ({ name: `missing-selector-${index}`, document, options, error, checks: [] })),
  {
    name: 'duplicate-operation-id',
    document: {
      paths: {
        '/a': { get: { operationId: 'duplicate', responses: {} } },
        '/b': { post: { operationId: 'duplicate', responses: {} } },
      },
    },
    options: { operation: { operationId: 'duplicate' } },
    error: /Multiple operations.*GET \/a.*POST \/b/,
    checks: [],
  },
]

const swagger = {
  swagger: '2.0',
  info: { title: 'Legacy API', version: '1', description: 'Legacy introduction' },
  host: 'legacy.example',
  basePath: '/v1',
  schemes: ['https'],
  securityDefinitions: { Key: { type: 'apiKey', name: 'X-Key', in: 'header' } },
  security: [{ Key: [] }],
  tags: [{ name: 'legacy', description: 'Legacy tag' }],
  paths: {
    '/pets': {
      get: {
        operationId: 'legacyPets',
        tags: ['legacy'],
        responses: { '200': { description: 'Legacy response', schema: { $ref: '#/definitions/Pet' } } },
      },
    },
    '/other': { get: { responses: { '200': { description: 'Legacy unrelated' } } } },
  },
  definitions: {
    Pet: { type: 'object', properties: { legacyName: { type: 'string' } } },
    Unused: { type: 'string', description: 'Legacy unused' },
  },
}
selectionFixtures.push(
  ...(
    [
      [{ operation: { operationId: 'legacyPets' } }, /legacyName/, '#### Responses'],
      [{ tag: 'legacy' }, /Legacy tag/, '## Tags'],
      [{ model: 'Pet' }, /legacyName/, '### Pet'],
      [{ introduction: true }, /Legacy introduction/, undefined],
    ] satisfies [OpenApiRenderOptions, RegExp, string | undefined][]
  ).map(([options, pattern, section], index) => ({
    name: `legacy-selection-${index}`,
    document: swagger,
    options,
    checks: [
      check('selected legacy content', pattern, section),
      check('unrelated legacy operation excluded', /Legacy unrelated/, undefined, true),
      check('unrelated legacy schema excluded', /Legacy unused/, undefined, true),
      ...('operation' in options
        ? [
            check('legacy server', /https:\/\/legacy.example\/v1/, '### GET /pets'),
            check('legacy authentication', /Key[\s\S]*X-Key/, '### GET /pets'),
          ]
        : []),
    ],
  })),
)

selectionFixtures.push(
  {
    name: 'security-override',
    document: {
      ...document,
      paths: { '/override': { get: { summary: 'Secure override', security: [{ OtherAuth: [] }], responses: {} } } },
    },
    options: { operation: { path: '/override', method: 'get' } },
    checks: [
      check('override scheme', /OtherAuth[\s\S]*basic/, '### Secure override'),
      check('inherited scheme excluded', /Token|bearer/, undefined, true),
      check('root server inherited', /https:\/\/root.example/, '### Secure override'),
      check('models excluded', /## Schemas/, undefined, true),
    ],
  },
  {
    name: 'openapi-3-0',
    document: { ...document, openapi: '3.0.3', webhooks: undefined },
    options: { operation: { operationId: 'listPets' } },
    checks: operationChecks,
  },
  {
    name: 'duplicate-tag',
    document: { tags: [{ name: 'duplicate' }, { name: 'duplicate' }] },
    options: { tag: 'duplicate' },
    error: /Multiple tags/,
    checks: [],
  },
  {
    name: 'model-all-of',
    document: {
      components: {
        schemas: {
          Combined: {
            allOf: [
              { $ref: '#/components/schemas/Base' },
              { type: 'object', properties: { extra: { type: 'integer' } } },
            ],
          },
          Base: { type: 'object', properties: { baseName: { type: 'string' } } },
          Unused: { type: 'string' },
        },
      },
    },
    options: { model: 'Combined' },
    checks: [
      check('composition rendered', /All of:[\s\S]*baseName[\s\S]*extra/, '### Combined'),
      check('dependency included', /### Base/, '## Schemas'),
      check('unrelated excluded', /### Unused/, undefined, true),
    ],
  },
)

selectionFixtures.push({
  name: 'selected-referenced-path-and-overrides',
  document: {
    components: {
      pathItems: {
        Shared: {
          servers: [{ url: 'https://shared.example' }],
          parameters: [{ $ref: '#/components/parameters/Limit' }],
          get: {
            operationId: 'shared',
            parameters: [{ name: 'limit', in: 'query', description: 'Effective limit', schema: { type: 'integer' } }],
            responses: { '200': { $ref: '#/components/responses/Result' } },
          },
          post: {
            summary: 'Excluded shared method',
            requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Unused' } } } },
            responses: {},
          },
        },
      },
      parameters: {
        Limit: {
          name: 'limit',
          in: 'query',
          description: 'Superseded limit',
          schema: { $ref: '#/components/schemas/Unused' },
        },
      },
      responses: {
        Result: {
          description: 'Referenced response',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Used' } } },
        },
      },
      schemas: {
        Used: { type: 'object', properties: { usedField: { type: 'string' } } },
        Unused: { type: 'integer', description: 'Superseded model' },
      },
    },
    paths: { '/shared': { $ref: '#/components/pathItems/Shared' } },
  },
  options: { operation: { operationId: 'shared' } },
  checks: [
    check('resolved path server', /https:\/\/shared.example/, '### GET /shared'),
    check('parameter override', /Effective limit/, '#### Parameters'),
    check('response dependency resolved', /usedField/, '#### Responses'),
    check('dependency section', /### Used/, '## Schemas'),
    check('overridden content excluded', /Superseded|### Unused|Excluded shared method/, undefined, true),
  ],
})

const section = (markdown: string, heading: string): string => {
  const lines = markdown.split('\n')
  const start = lines.indexOf(heading)
  if (start === -1) {
    return ''
  }
  const level = heading.match(/^#+/)![0].length
  const end = lines.findIndex((line, index) => index > start && new RegExp(`^#{1,${level}} `).test(line))
  return lines.slice(start, end === -1 ? undefined : end).join('\n')
}

describe('selection', () => {
  it.each([createMarkdownFromOpenApi, createHtmlFromOpenApi])(
    'excludes literal data references while retaining schemas under arbitrary property names',
    async (render) => {
      const output = await render(
        {
          openapi: '3.1.1',
          info: { title: 'API', version: '1' },
          paths: {
            '/test': {
              get: {
                responses: {
                  '200': {
                    description: 'OK',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          example: { $ref: '#/components/schemas/Unrelated' },
                          properties: {
                            example: { $ref: '#/components/schemas/Needed' },
                            default: { $ref: '#/components/schemas/DefaultField' },
                            'x-field': { $ref: '#/components/schemas/ExtensionField' },
                            properties: { type: 'string', default: { $ref: '#/components/schemas/Unrelated' } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          components: {
            schemas: {
              Needed: { type: 'string' },
              DefaultField: { type: 'string' },
              ExtensionField: { type: 'string' },
              Unrelated: { type: 'string' },
            },
          },
        },
        { operation: { path: '/test', method: 'get' } },
      )
      expect(output).toMatch(/### Needed|<h3>Needed<\/h3>/)
      expect(output).toMatch(/### DefaultField|<h3>DefaultField<\/h3>/)
      expect(output).toMatch(/### ExtensionField|<h3>ExtensionField<\/h3>/)
      expect(output).not.toMatch(/### Unrelated|<h3>Unrelated<\/h3>/)
    },
  )

  it.each(selectionFixtures)('renders scoped Markdown: $name', async (fixture) => {
    const input = {
      ...('swagger' in fixture.document ? {} : { openapi: '3.1.1' }),
      info: { title: 'API', version: '1' },
      ...fixture.document,
    }
    if (fixture.error) {
      await expect(createMarkdownFromOpenApi(input, fixture.options)).rejects.toThrow(fixture.error)
      return
    }
    const markdown = await createMarkdownFromOpenApi(input, fixture.options)
    for (const check of fixture.checks) {
      const output = check.section ? section(markdown, check.section) : markdown
      expect(check.pattern.test(output), check.name).toBe(!check.absent)
    }
    expect(markdown).not.toMatch(/<\/?(?:section|div|span|h[1-6])\b|\bundefined\b|\[object Object\]/)
    expect(await createMarkdownFromOpenApi(input, fixture.options)).toBe(markdown)
  })

  it.each([
    { operation: { path: '/pets', method: 'INVALID' } },
    { operation: { operationId: 'id', pointer: '#/paths/~1pets/get' } },
    { operation: {} },
    { operation: null },
    { operation: { pointer: '#/paths/~2pets/get' } },
    { tag: '' },
    { tag: 'pets', model: 'Pet' },
    { model: 1 },
    { introduction: false },
    { webhook: { name: 'event' } },
    { webhook: { name: 'event', method: 'INVALID' } },
    { unknown: true },
  ])('rejects invalid selectors in both exports: %j', async (options) => {
    for (const render of [createHtmlFromOpenApi, createMarkdownFromOpenApi]) {
      await expect(render(invalidSelectorDocument, options as unknown as OpenApiRenderOptions)).rejects.toThrow(
        /selector|method|pointer|Specify|Introduction/i,
      )
    }
  })

  it.each(selectionFixtures.filter((fixture) => !fixture.error))('scopes HTML consistently: $name', async (fixture) => {
    const input = {
      ...('swagger' in fixture.document ? {} : { openapi: '3.1.1' }),
      info: { title: 'API', version: '1' },
      ...fixture.document,
    }
    const html = await createHtmlFromOpenApi(input, fixture.options)
    expect(html).not.toContain('Unrelated operation')
    expect(html).not.toContain('Unrelated webhook')
    expect(html).not.toContain('unrelatedField')
    expect(html).not.toContain('Legacy unused')
    if (fixture.options?.model) {
      expect(html).toContain(`<h3>${fixture.options.model}</h3>`)
      expect(html).not.toContain('<h2>Operations</h2>')
    }
    if (fixture.options?.webhook) {
      expect(html).toContain('<h2>Webhooks</h2>')
      expect(html).toContain('Event accepted')
      expect(html).toContain('delivery')
      expect(html).not.toContain('/webhooks/petEvent')
    }
    if (fixture.options?.introduction) {
      for (const heading of ['Operations', 'Schemas', 'Webhooks', 'Tags']) {
        expect(html).not.toContain(`<h2>${heading}</h2>`)
      }
    }
  })

  it.each(selectionFixtures.filter((fixture) => fixture.error))(
    'reports selector errors in HTML: $name',
    async (fixture) => {
      await expect(
        createHtmlFromOpenApi(
          { openapi: '3.1.1', info: { title: 'API', version: '1' }, ...fixture.document },
          fixture.options,
        ),
      ).rejects.toThrow(fixture.error)
    },
  )

  it('bounds recursive model output', async () => {
    const fixture = selectionFixtures.find((entry) => entry.name === 'selected-model-Node')!
    const markdown = await createMarkdownFromOpenApi({ openapi: '3.1.1', ...fixture.document }, fixture.options)
    expect(markdown).toContain('Circular Reference')
    expect(markdown.length).toBeLessThan(2000)
  })
})
