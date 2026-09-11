/** A fixed corpus of observable output requirements, independent of renderer internals. */
export const fixtures = [
  {
    name: 'operation-metadata',
    document: {
      paths: {
        '/pets': {
          get: { operationId: 'listPets', summary: 'List pets', responses: { '200': { description: 'Pet list' } } },
        },
      },
    },
    checks: [
      { name: 'operation heading', pattern: /### List pets/, baseline: true },
      { name: 'HTTP method and path', pattern: /`GET`[\s\S]*`\/pets`/, baseline: true },
      { name: 'response status', pattern: /Status: 200 Pet list/, baseline: true },
      { name: 'operation identifier', pattern: /Operation ID:[\s\S]*`listPets`/, baseline: false },
    ],
  },
  {
    name: 'request-body',
    document: {
      paths: {
        '/pets': {
          post: {
            requestBody: {
              required: true,
              description: 'The pet to create.',
              content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
            },
            responses: { '201': { description: 'Created' } },
          },
        },
      },
    },
    checks: [
      { name: 'media type', pattern: /Content-Type: application\/json/, baseline: true },
      { name: 'body description', pattern: /The pet to create\./, baseline: false },
      { name: 'body required flag', pattern: /Request Body[\s\S]*Required:[\s\S]*true/, baseline: false },
    ],
  },
  {
    name: 'component-schemas',
    document: {
      components: {
        schemas: {
          Status: { type: 'string', enum: ['pending', 'complete'], default: 'pending' },
          Names: { type: 'array', items: { type: 'string', format: 'email' } },
        },
      },
    },
    checks: [
      { name: 'component heading', pattern: /### Status/, baseline: true },
      {
        name: 'primitive enum and default',
        pattern: /possible values:.*pending.*complete[\s\S]*default:.*pending/,
        baseline: false,
      },
      { name: 'array item format', pattern: /Array of:[\s\S]*email/, baseline: false },
      { name: 'no empty example label', pattern: /Example:\*\*\s*(?:###|$)/, absent: true, baseline: false },
    ],
  },
  {
    name: 'nested-composition',
    document: {
      paths: {
        '/choice': {
          get: {
            responses: {
              '200': {
                description: 'Choice',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        value: {
                          oneOf: [
                            { type: 'string', enum: ['chosen'] },
                            { type: 'integer', format: 'int64' },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    checks: [
      { name: 'property name', pattern: /`value`/, baseline: true },
      { name: 'nested alternatives', pattern: /One of:[\s\S]*chosen[\s\S]*int64/, baseline: false },
    ],
  },
  {
    name: 'schema-constraints',
    document: {
      paths: {
        '/search': {
          get: {
            parameters: [
              { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 0, maximum: 100 } },
              {
                name: 'query',
                in: 'query',
                schema: { type: 'string', minLength: 0, maxLength: 32, pattern: '^[a-z]+$' },
              },
            ],
            responses: { '200': { description: 'Results' } },
          },
        },
      },
    },
    checks: [
      { name: 'parameter location', pattern: /In:.*`query`/, baseline: true },
      { name: 'numeric bounds including zero', pattern: /minimum:.*`0`[\s\S]*maximum:.*`100`/i, baseline: false },
      { name: 'string bounds including zero', pattern: /minLength:.*`0`[\s\S]*maxLength:.*`32`/i, baseline: false },
      { name: 'string pattern', pattern: /pattern:.*`\^\[a-z\]\+\$`/i, baseline: false },
    ],
  },
  {
    name: 'references-and-overrides',
    document: {
      components: {
        parameters: {
          Limit: { name: 'limit', in: 'query', description: 'Inherited limit', schema: { type: 'integer' } },
        },
      },
      paths: {
        '/pets': {
          parameters: [{ $ref: '#/components/parameters/Limit' }],
          get: {
            parameters: [
              { name: 'limit', in: 'query', description: 'Operation limit', schema: { type: 'integer', default: 10 } },
            ],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    },
    checks: [
      { name: 'operation overrides path parameter', pattern: /Operation limit/, baseline: true },
      { name: 'overridden description omitted', pattern: /Inherited limit/, absent: true, baseline: true },
      { name: 'default preserved', pattern: /default:.*`10`/, baseline: true },
    ],
  },
  {
    name: 'markdown-quality',
    document: {
      info: {
        title: 'Quality API',
        version: '1',
        description: 'A **bold** guide with [help](https://example.com/help).\n\n```json\n{"ok": true}\n```',
      },
    },
    checks: [
      { name: 'emphasis preserved', pattern: /\*\*bold\*\*/, baseline: true },
      { name: 'link preserved', pattern: /\[help\]\(https:\/\/example.com\/help\)/, baseline: true },
      { name: 'code preserved', pattern: /```json\n\{"ok": true\}\n```/, baseline: true },
    ],
  },
] as const
