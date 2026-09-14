import { resolve } from 'node:path'

import type { Check, Fixture } from './harness'

const document = (content: Record<string, unknown>): Record<string, unknown> => ({
  openapi: '3.1.1',
  info: { title: 'Evaluation API', version: '1', description: 'Introduction sentinel' },
  ...content,
})
const response = { '200': { description: 'Success sentinel' } }
const check = (name: string, pattern: RegExp, section?: string[], baseline = false): Check => ({
  name,
  pattern,
  section,
  baseline,
})
const schema = { type: 'object', properties: { value: { type: 'string', example: 'generated sentinel' } } }
const payload = { content: { 'application/json': { schema, example: { value: 'supplied sentinel' } } } }
const event = {
  summary: 'Pet event',
  parameters: [{ name: 'event-signature', in: 'header', schema: { type: 'string' } }],
  requestBody: payload,
  responses: { '202': { description: 'Event accepted', ...payload } },
}
const deepSchema: Record<string, unknown> = Array.from({ length: 24 }).reduce<Record<string, unknown>>(
  (child, _, index) => ({ type: 'object', properties: { [`level${index}`]: child } }),
  { type: 'object', properties: { deepLeafSentinel: { type: 'string' } } },
)

/** New requirements stay diagnostic until verified and promoted to the baseline. */
export const extendedFixtures: Fixture[] = [
  {
    name: 'authentication',
    group: 'authentication',
    document: document({
      security: [{ ApiKey: [] }],
      components: {
        securitySchemes: {
          ApiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' },
          Basic: { type: 'http', scheme: 'basic' },
          Bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          OAuth: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://auth.example/authorize',
                tokenUrl: 'https://auth.example/token',
                scopes: { 'pets:read': 'Read pets', 'pets:write': 'Write pets' },
              },
              clientCredentials: {
                tokenUrl: 'https://auth.example/client-token',
                scopes: { 'pets:read': 'Read pets' },
              },
              implicit: { authorizationUrl: 'https://auth.example/implicit', scopes: { 'pets:read': 'Read pets' } },
              password: { tokenUrl: 'https://auth.example/password-token', scopes: { 'pets:read': 'Read pets' } },
            },
          },
        },
      },
      paths: Object.fromEntries(
        [
          ['Inherited', undefined],
          ['Basic', [{ Basic: [] }]],
          ['Bearer', [{ Bearer: [] }]],
          ['Scoped', [{ OAuth: ['pets:read'] }]],
          ['Public', []],
        ].map(([name, security]) => [
          `/${String(name).toLowerCase()}`,
          { get: { summary: name, ...(security === undefined ? {} : { security }), responses: response } },
        ]),
      ),
    }),
    checks: [
      check('inherited API key', /X-API-Key/, ['Operations', 'Inherited']),
      check('basic authentication', /Authorization[^\n]*Basic/i, ['Operations', 'Basic']),
      check('bearer authentication', /Authorization[^\n]*Bearer/i, ['Operations', 'Bearer']),
      check('required OAuth scope', /pets:read/, ['Operations', 'Scoped']),
      check('authorization URL', /https:\/\/auth.example\/authorize/),
      ...['token', 'client-token', 'implicit', 'password-token'].map((flow) =>
        check(`OAuth endpoint ${flow}`, new RegExp(`https://auth.example/${flow}`)),
      ),
      { ...check('override excludes inherited API key', /X-API-Key/, ['Operations', 'Basic']), absent: true },
      check('explicit public access', /(?:no authentication|unauthenticated|security:.*none)/i, [
        'Operations',
        'Public',
      ]),
      { ...check('public excludes credentials', /X-API-Key|pets:read|Bearer/, ['Operations', 'Public']), absent: true },
    ],
  },
  {
    name: 'servers',
    group: 'servers',
    document: document({
      servers: [{ url: 'https://{region}.example/v1', variables: { region: { default: 'eu', enum: ['eu', 'us'] } } }],
      paths: {
        '/root': { get: { summary: 'Root server', responses: response } },
        '/path': {
          servers: [{ url: 'https://path.example' }],
          get: { summary: 'Path server', responses: response },
          post: { summary: 'Operation server', servers: [{ url: 'https://operation.example' }], responses: response },
        },
      },
    }),
    checks: [
      check('variable default', /default:[\s\S]*`eu`/, ['Servers'], true),
      check('allowed variable values', /us/, ['Servers']),
      check('effective root server', /https:\/\/(?:eu|\{region\}).example\/v1/, ['Operations', 'Root server']),
      check('effective path server', /https:\/\/path.example/, ['Operations', 'Path server']),
      check('effective operation server', /https:\/\/operation.example/, ['Operations', 'Operation server']),
    ],
  },
  {
    name: 'webhooks-callbacks',
    group: 'webhooks',
    document: document({
      webhooks: { petEvent: { post: event } },
      paths: {
        '/subscribe': {
          post: {
            summary: 'Subscribe',
            callbacks: {
              onEvent: { '{$request.body#/callbackUrl}': { post: { ...event, summary: 'Callback event' } } },
            },
            responses: response,
          },
        },
      },
    }),
    checks: [
      check('webhook heading', /### Pet event/, ['Webhooks'], true),
      check('webhook parameter', /event-signature/, ['Webhooks', 'Pet event']),
      check('webhook payload schema', /`value`/, ['Webhooks', 'Pet event', 'Request Body']),
      {
        name: 'webhook supplied example',
        section: ['Webhooks', 'Pet event', 'Request Body'],
        json: { value: 'supplied sentinel' },
        baseline: false,
      },
      check('webhook response', /202.*Event accepted/, ['Webhooks', 'Pet event']),
      { ...check('no invented webhook URL', /\/webhooks\/petEvent/, ['Webhooks', 'Pet event']), absent: true },
      check('callback expression', /\$request.body#\/callbackUrl/, ['Operations', 'Subscribe']),
      check('callback parameter', /event-signature/, ['Operations', 'Subscribe']),
      check('callback response', /202.*Event accepted/, ['Operations', 'Subscribe']),
      {
        name: 'callback supplied example',
        section: ['Operations', 'Subscribe', 'Callback event', 'Request Body'],
        json: { value: 'supplied sentinel' },
        baseline: false,
      },
    ],
  },
  {
    name: 'schema-fidelity',
    group: 'schemas',
    document: document({
      components: {
        schemas: {
          Fidelity: {
            type: 'object',
            additionalProperties: { type: 'integer' },
            properties: {
              id: { type: 'string', readOnly: true },
              secret: { type: 'string', writeOnly: true },
              nullableValue: { type: ['string', 'null'] },
              anything: true,
              impossible: false,
              choice: {
                type: 'object',
                properties: { siblingSentinel: { type: 'boolean' } },
                oneOf: [{ properties: { cat: { type: 'string' } } }, { properties: { dog: { type: 'string' } } }],
                discriminator: { propertyName: 'kind', mapping: { cat: '#/components/schemas/Cat' } },
              },
            },
          },
          Cat: { type: 'object', properties: { kind: { const: 'cat' } } },
        },
      },
    }),
    checks: [
      check('additional property type', /additional.*properties[\s\S]*integer/i, ['Schemas', 'Fidelity']),
      check('read only', /`id`[^\n]*read.?only/i, ['Schemas', 'Fidelity']),
      check('write only', /`secret`[^\n]*write.?only/i, ['Schemas', 'Fidelity']),
      {
        ...check('nullable type', /nullableValue[\s\S]*`string \| null`/, ['Schemas', 'Fidelity'], true),
        excludeExamples: true,
      },
      check('true schema', /anything[^\n]*(?:any|true)/i, ['Schemas', 'Fidelity']),
      check('false schema', /impossible[^\n]*(?:never|false|not allowed)/i, ['Schemas', 'Fidelity']),
      { ...check('composition sibling', /siblingSentinel/, ['Schemas', 'Fidelity']), excludeExamples: true },
      check('discriminator mapping', /discriminator[\s\S]*kind[\s\S]*cat[\s\S]*Cat/i, ['Schemas', 'Fidelity']),
    ],
  },
  ...(['application/json', 'application/xml', 'application/x-www-form-urlencoded', 'multipart/form-data'] as const).map(
    (mediaType): Fixture => ({
      name: `details-${mediaType.replaceAll(/[^a-z]/g, '-')}`,
      group: 'request-response',
      document: document({
        paths: {
          '/details': {
            post: {
              summary: 'Details',
              requestBody: {
                content: {
                  [mediaType]: {
                    schema: { ...schema, xml: { name: 'Payload' } },
                    example:
                      mediaType === 'application/xml'
                        ? '<Payload><value>supplied sentinel</value></Payload>'
                        : { value: 'supplied sentinel' },
                    encoding: { value: { contentType: 'text/plain', style: 'form', explode: true } },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'Details response',
                  headers: { 'X-Rate-Limit': { schema: { type: 'integer' }, description: 'Remaining calls' } },
                  links: { next: { operationId: 'nextPage', parameters: { cursor: '$response.body#/cursor' } } },
                  content: {
                    'application/json': {
                      schema,
                      examples: { first: { summary: 'First named example', value: { value: 'named sentinel' } } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      checks: [
        check('response headers', /X-Rate-Limit[\s\S]*Remaining calls/, ['Operations', 'Details', 'Responses']),
        check('response link', /nextPage[\s\S]*\$response.body#\/cursor/, ['Operations', 'Details', 'Responses']),
        {
          name: 'named response example',
          section: ['Operations', 'Details', 'Responses'],
          json: { value: 'named sentinel' },
          baseline: false,
        },
        ...(mediaType === 'application/json'
          ? [
              {
                name: 'explicit request example wins',
                section: ['Operations', 'Details', 'Request Body'],
                json: { value: 'supplied sentinel' },
                baseline: false,
              },
            ]
          : [check('supplied body example', /supplied sentinel/, ['Operations', 'Details', 'Request Body'])]),
        ...(mediaType === 'application/xml'
          ? [
              check('XML root and value', /<Payload>[\s\S]*<value>supplied sentinel<\/value>[\s\S]*<\/Payload>/, [
                'Operations',
                'Details',
                'Request Body',
              ]),
            ]
          : []),
        ...(mediaType.includes('form')
          ? [check('encoding content type', /text\/plain/, ['Operations', 'Details', 'Request Body'])]
          : []),
      ],
    }),
  ),
  {
    name: 'tags-grouping',
    group: 'tags',
    document: document({
      tags: [{ name: 'Pets', description: 'Pet tag description' }],
      'x-tagGroups': [{ name: 'Animals', tags: ['Pets'] }],
      paths: {
        '/pets': { get: { summary: 'List pets', tags: ['Pets'], responses: response } },
      },
    }),
    checks: [check('tag description', /Pet tag description/), check('tag group', /Animals/)],
  },
  {
    name: 'references-recursion',
    group: 'references',
    document: document({
      components: {
        schemas: {
          Chain: { $ref: '#/components/schemas/Alias' },
          Alias: { $ref: '#/components/schemas/Node' },
          Node: {
            type: 'object',
            properties: { nodeSentinel: { type: 'string' }, child: { $ref: '#/components/schemas/Node' } },
          },
          Deep: deepSchema,
        },
      },
    }),
    checks: [
      check('reference chain', /`nodeSentinel`/, ['Schemas', 'Chain'], true),
      check('recursive model is bounded', /circular/i, ['Schemas', 'Node'], true),
      check('deep leaf retained', /deepLeafSentinel/, ['Schemas', 'Deep']),
      { ...check('deep schema is not circular', /circular/i, ['Schemas', 'Deep']), absent: true },
    ],
  },
  {
    name: 'external-reference',
    group: 'references',
    document: resolve(import.meta.dirname, 'documents/external.json'),
    checks: [
      check(
        'external chain resolved in response',
        /externalLeafSentinel/,
        ['Operations', 'External', 'Responses'],
        true,
      ),
    ],
  },
  ...['2.0', '3.0.3', '3.1.1'].map(
    (version): Fixture => ({
      name: `version-${version}`,
      group: 'versions-samples',
      document:
        version === '2.0'
          ? {
              swagger: version,
              info: { title: 'Version API', version: '1' },
              host: 'versions.example',
              basePath: '/v1',
              schemes: ['https'],
              securityDefinitions: { Key: { type: 'apiKey', in: 'header', name: 'X-Version-Key' } },
              security: [{ Key: [] }],
              paths: {
                '/pets/{id}': {
                  post: {
                    summary: 'Version operation',
                    consumes: ['application/json'],
                    parameters: [
                      { name: 'id', in: 'path', required: true, type: 'string', default: 'pet-42' },
                      { name: 'body', in: 'body', schema },
                    ],
                    responses: { '200': { description: 'Version response', schema } },
                  },
                },
              },
            }
          : document({
              openapi: version,
              servers: [{ url: 'https://versions.example/v1' }],
              security: [{ Key: [] }],
              components: { securitySchemes: { Key: { type: 'apiKey', in: 'header', name: 'X-Version-Key' } } },
              paths: {
                '/pets/{id}': {
                  post: {
                    summary: 'Version operation',
                    parameters: [
                      { name: 'id', in: 'path', required: true, schema: { type: 'string', default: 'pet-42' } },
                    ],
                    requestBody: { content: { 'application/json': { schema } } },
                    responses: {
                      '200': { description: 'Version response', content: { 'application/json': { schema } } },
                    },
                  },
                },
              },
            }),
      checks: [
        check('version operation', /`POST`[\s\S]*`\/pets\/\{id\}`/, ['Operations', 'Version operation'], true),
        {
          name: 'generated body value',
          section: ['Operations', 'Version operation', 'Request Body'],
          json: { value: 'generated sentinel' },
          baseline: true,
        },
        check('sample effective URL', /https:\/\/versions.example\/v1\/pets\/pet-42/, [
          'Operations',
          'Version operation',
          'Request Example',
        ]),
        check('sample authentication', /X-Version-Key/, ['Operations', 'Version operation', 'Request Example']),
        check('sample body', /generated sentinel/, ['Operations', 'Version operation', 'Request Example']),
      ],
    }),
  ),
  {
    name: 'large-document',
    group: 'performance',
    document: document({
      paths: Object.fromEntries(
        Array.from({ length: 150 }, (_, index) => [
          `/item-${index}`,
          { get: { summary: `Item ${index}`, responses: { '200': { description: `Result ${index}`, ...payload } } } },
        ]),
      ),
    }),
    checks: [
      { ...check('all operation headings', /^### Item \d+$/m, undefined, true), count: 150 },
      check('last response retained', /Result 149/, ['Operations', 'Item 149', 'Responses'], true),
    ],
  },
]
