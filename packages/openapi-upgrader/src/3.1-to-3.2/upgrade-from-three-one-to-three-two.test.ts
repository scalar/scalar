import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'
import { describe, expect, it } from 'vitest'

import { UpgradeIncompatibilityError } from '../upgrade-incompatibility-error'
import { upgradeFromThreeOneToThreeTwo as upgrade } from './index'

const at = (value: unknown, ...keys: (string | number)[]): UnknownObject => {
  const result = getValueAtPath(value, keys.map(String))
  if (!isObject(result)) {
    throw new Error('Expected an object at ' + keys.join('/'))
  }
  return result
}

const document = (fields: UnknownObject = {}): UnknownObject => ({
  openapi: '3.1.2',
  info: { title: 'API', version: '1.0' },
  paths: {},
  ...fields,
})

const withSchemas = (schemas: UnknownObject): UnknownObject => document({ components: { schemas } })

const attribute = (): UnknownObject => ({ type: 'string', xml: { attribute: true } })

const operation = (parameters: unknown[] = []): UnknownObject => ({
  parameters,
  responses: { '200': { description: 'OK' } },
})

describe('upgrade-from-three-one-to-three-two', () => {
  it('reports all incompatibilities together without changing the input', () => {
    const input = document({
      paths: { '/{id}/{id}': {} },
      servers: [{ url: 'https://{host}/{host}' }],
      components: { schemas: { Pet: { discriminator: { propertyName: 'kind' } } } },
    })
    const original = structuredClone(input)
    const messages = [
      'Cannot upgrade to OpenAPI 3.2 at #/paths/~1{id}~1{id}: Template variables must not be repeated. Rename the repeated variable and define it separately.',
      'Cannot upgrade to OpenAPI 3.2 at #/servers/0/url: Template variables must not be repeated. Rename the repeated variable and define it separately.',
      'Cannot upgrade to OpenAPI 3.2 at #/components/schemas/Pet/discriminator: An optional discriminating property needs an explicit defaultMapping.',
    ]

    expect(() => upgrade(input)).toThrow(new UpgradeIncompatibilityError(messages.map((message) => new Error(message))))
    try {
      upgrade(input)
    } catch (error) {
      expect(error).toBeInstanceOf(UpgradeIncompatibilityError)
      if (error instanceof AggregateError) {
        expect(error.errors.map((issue: Error) => issue.message)).toStrictEqual(messages)
      }
    }
    expect(input).toStrictEqual(original)
  })

  it('reports when discriminator analysis exhausts its work budget', () => {
    const input = withSchemas({
      Pet: {
        discriminator: { propertyName: 'kind' },
        allOf: Array.from({ length: 100_001 }, () => ({ type: 'object' })),
      },
    })

    expect(() => upgrade(input)).toThrow('Discriminator requiredness analysis was truncated after 100,000 evaluations.')
  })

  it.each(['3.1.0', '3.1.1', '3.1.2', '3.1.99'])('upgrades %s without changing the input', (openapi) => {
    const input = document({ openapi })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
    expect(input.openapi).toBe(openapi)
  })

  it.each(['3.0.4', '3.2.0', '3.10.0'])('leaves %s unchanged', (openapi) => {
    const input = document({ openapi })
    expect(upgrade(input)).toBe(input)
  })

  it.each(['3.1', '3.1.invalid', '3.1.0-rc1', '3.1.2-extra'])('rejects malformed 3.1 version %s', (openapi) => {
    const input = document({ openapi })
    expect(() => upgrade(input)).toThrow(`invalid OpenAPI version "${openapi}"`)
    expect(input.openapi).toBe(openapi)
  })

  it('leaves Swagger and null unchanged', () => {
    const input = { swagger: '2.0', paths: {} }
    expect(upgrade(input)).toBe(input)
    expect(upgrade(null as unknown as UnknownObject)).toBe(null)
  })

  it('preserves literal data and extensions even when they contain XML-looking fields', () => {
    const literal = { xml: { wrapped: true, attribute: true } }
    const input = withSchemas({
      Payload: {
        const: literal,
        enum: [literal],
        default: literal,
        example: literal,
        examples: [literal],
        'x-custom': literal,
        properties: { xml: { type: 'object', properties: { attribute: { type: 'boolean' } } } },
      },
    })
    at(input, 'components').examples = { payload: { value: literal } }
    input['x-custom'] = literal
    at(input, 'paths')['/data'] = {
      get: {
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { example: literal, examples: { named: { value: literal } } } },
          },
        },
      },
    }
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it.each([
    [{ wrapped: true }, { nodeType: 'element' }],
    [{ wrapped: true, attribute: false }, { nodeType: 'element' }],
    [
      { attribute: false, wrapped: false },
      { attribute: false, wrapped: false },
    ],
  ])('migrates array XML %j without incompatible legacy fields', (xml, expected) => {
    const input = withSchemas({ Books: { type: 'array', items: { type: 'string' }, xml } })
    expect(at(upgrade(input), 'components', 'schemas', 'Books').xml).toStrictEqual(expected)
  })

  it('preserves XML names, namespaces, prefixes, and extensions', () => {
    const xml = { attribute: true, name: 'id', namespace: 'urn:example', prefix: 'a', 'x-extra': true }
    const result = upgrade(withSchemas({ Id: { type: 'string', xml } }))
    expect(at(result, 'components', 'schemas', 'Id').xml).toStrictEqual({
      nodeType: 'attribute',
      name: 'id',
      namespace: 'urn:example',
      prefix: 'a',
      'x-extra': true,
    })
  })

  it('visits nested schema keywords without interpreting property names as keywords', () => {
    const input = withSchemas({
      Root: {
        properties: { example: attribute(), default: attribute(), xml: attribute() },
        patternProperties: { '^a': attribute() },
        $defs: { local: attribute() },
        dependentSchemas: { name: { properties: { id: attribute() } } },
        allOf: [attribute()],
        anyOf: [attribute()],
        oneOf: [attribute()],
        prefixItems: [attribute()],
        items: attribute(),
        contains: attribute(),
        additionalProperties: attribute(),
        unevaluatedProperties: attribute(),
        unevaluatedItems: attribute(),
        propertyNames: attribute(),
        not: attribute(),
        if: attribute(),
        // biome-ignore lint/suspicious/noThenProperty: JSON Schema uses then for conditional subschemas.
        then: attribute(),
        else: attribute(),
        contentSchema: attribute(),
      },
      Yes: true,
      No: false,
    })
    const result = at(upgrade(input), 'components', 'schemas')
    for (const keyword of ['properties', 'patternProperties', '$defs']) {
      for (const schema of Object.values(at(result, 'Root', keyword)) as UnknownObject[]) {
        expect(schema.xml).toStrictEqual({ nodeType: 'attribute' })
      }
    }
    expect(at(result, 'Root', 'dependentSchemas', 'name', 'properties', 'id').xml).toStrictEqual({
      nodeType: 'attribute',
    })
    for (const keyword of ['allOf', 'anyOf', 'oneOf', 'prefixItems']) {
      expect(at(result, 'Root', keyword, 0).xml).toStrictEqual({ nodeType: 'attribute' })
    }
    for (const keyword of [
      'items',
      'contains',
      'additionalProperties',
      'unevaluatedProperties',
      'unevaluatedItems',
      'propertyNames',
      'not',
      'if',
      'then',
      'else',
      'contentSchema',
    ]) {
      expect(at(result, 'Root', keyword).xml).toStrictEqual({ nodeType: 'attribute' })
    }
    expect(result.Yes).toBe(true)
    expect(result.No).toBe(false)
  })

  it('visits parameters, headers, request bodies, responses, webhooks, and callbacks', () => {
    const media = { schema: attribute() }
    const response = {
      description: 'OK',
      headers: { id: { schema: attribute() } },
      content: { 'application/json': media },
    }
    const requestBody = { content: { 'application/json': media } }
    const pathItem = {
      parameters: [{ name: 'id', in: 'query', schema: attribute() }],
      post: { requestBody, responses: { '200': response } },
    }
    const input = document({
      paths: { '/data': pathItem },
      webhooks: { received: pathItem },
      components: {
        pathItems: { shared: pathItem },
        requestBodies: { body: requestBody },
        responses: { response },
        headers: { id: { schema: attribute() } },
        callbacks: { notify: { '{$request.body#/url}': pathItem } },
      },
    })
    const result = upgrade(input)
    expect(at(result, 'webhooks', 'received', 'parameters', 0, 'schema').xml).toStrictEqual({ nodeType: 'attribute' })
    expect(
      at(
        result,
        'components',
        'callbacks',
        'notify',
        '{$request.body#/url}',
        'post',
        'requestBody',
        'content',
        'application/json',
        'schema',
      ).xml,
    ).toStrictEqual({ nodeType: 'attribute' })
    expect(at(result, 'components', 'headers', 'id', 'schema').xml).toStrictEqual({ nodeType: 'attribute' })
    expect(at(result, 'paths', '/data', 'post', 'responses', '200', 'headers', 'id', 'schema').xml).toStrictEqual({
      nodeType: 'attribute',
    })
  })

  it('follows local schema references only when used as schemas', () => {
    const input = withSchemas({ Alias: { $ref: '#/x-schemas/0' } })
    input['x-schemas'] = [attribute()]
    input['x-unreferenced'] = attribute()
    const result = upgrade(input)
    expect(at(result, 'x-schemas', 0).xml).toStrictEqual({ nodeType: 'attribute' })
    expect(result['x-unreferenced']).toStrictEqual(attribute())
  })

  it('preserves pinned schema dialects and does not resolve through a changed base URI', () => {
    const input = withSchemas({
      Custom: { $schema: 'https://example.com/dialect', properties: { id: attribute() } },
      Pinned: { $schema: 'https://spec.openapis.org/oas/3.1/dialect/base', ...attribute() },
      Relative: { $id: 'https://example.com/schema', $ref: '#/x-other' },
    })
    input['x-other'] = attribute()
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
    const pinned = {
      ...withSchemas({ Id: attribute() }),
      jsonSchemaDialect: 'https://spec.openapis.org/oas/3.1/dialect/base',
    }
    expect(upgrade(pinned)).toStrictEqual({ ...pinned, openapi: '3.2.0' })
  })

  it('creates ordered parents and missing tags without guessing kinds from group names', () => {
    const input = document({
      tags: [
        { name: 'invoices', description: 'Bills' },
        { name: 'users', 'x-displayName': 'Users' },
        { name: 'other' },
      ],
      'x-tagGroups': [
        { name: 'Audience', tags: ['users', 'profiles'] },
        { name: 'Badge', tags: ['invoices'] },
      ],
    })
    const result = upgrade(input)
    expect(result.tags).toStrictEqual([
      { name: 'Audience', kind: 'nav' },
      { name: 'users', 'x-displayName': 'Users', parent: 'Audience' },
      { name: 'profiles', parent: 'Audience' },
      { name: 'Badge', kind: 'nav' },
      { name: 'invoices', description: 'Bills', parent: 'Badge' },
      { name: 'other' },
    ])
    expect(result['x-tagGroups']).toStrictEqual(input['x-tagGroups'])
  })

  it('materializes operation-only tags', () => {
    const input = document({
      paths: { '/users': { get: { tags: ['users'], ...operation() } } },
      'x-tagGroups': [{ name: 'Accounts', tags: ['users'] }],
    })
    expect(upgrade(input).tags).toStrictEqual([
      { name: 'Accounts', kind: 'nav' },
      { name: 'users', parent: 'Accounts' },
    ])
  })

  it.each(
    [
      [
        { name: 'A', tags: ['users'] },
        { name: 'B', tags: ['users'] },
      ],
      [{ name: 'A', tags: ['A'] }],
      [
        { name: 'A', tags: ['B'] },
        { name: 'B', tags: ['users'] },
      ],
      [{ name: 'users', tags: ['other'] }],
      [{ name: 'A', tags: ['users'], 'x-extra': true }],
      [null],
      [{ name: 'A' }],
      [],
    ].map((groups) => [groups]),
  )('preserves groups that cannot be safely converted: %j', (groups) => {
    const input = document({ tags: [{ name: 'users' }], 'x-tagGroups': groups })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it('preserves existing parent relationships', () => {
    const input = document({
      tags: [{ name: 'users', parent: 'existing' }, { name: 'existing' }],
      'x-tagGroups': [{ name: 'A', tags: ['users'] }],
    })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it('leaves the input intact after errors and permits a corrected retry', () => {
    const input = withSchemas({
      Invalid: { type: 'array', items: { type: 'string' }, xml: { wrapped: true, attribute: true } },
    })
    input['x-tagGroups'] = [{ name: 'A', tags: ['users'] }]
    const before = structuredClone(input)
    expect(() => upgrade(input)).toThrow('#/components/schemas/Invalid/xml')
    expect(input).toStrictEqual(before)
    at(input, 'components', 'schemas', 'Invalid', 'xml').attribute = false
    expect(at(upgrade(input), 'components', 'schemas', 'Invalid').xml).toStrictEqual({ nodeType: 'element' })
    expect(input.openapi).toBe('3.1.2')
  })

  it('rejects an optional discriminator without a fallback', () => {
    const input = withSchemas({
      Pet: {
        properties: { kind: { type: 'string' } },
        oneOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'string' } } }],
        discriminator: { propertyName: 'kind' },
      },
    })
    expect(() => upgrade(input)).toThrow(
      '#/components/schemas/Pet/discriminator: An optional discriminating property needs an explicit defaultMapping.',
    )
    at(input, 'components', 'schemas', 'Pet', 'discriminator').defaultMapping = 'Other'
    expect(at(upgrade(input), 'components', 'schemas').Pet).toStrictEqual(at(input, 'components', 'schemas').Pet)
  })

  it('recognizes required discriminator properties inherited through references and composition', () => {
    const input = withSchemas({
      Base: { required: ['kind'] },
      Pet: { allOf: [{ $ref: '#/components/schemas/Base' }], discriminator: { propertyName: 'kind' } },
    })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
    at(input, 'components', 'schemas').Pet = {
      oneOf: [{ required: ['kind'] }, { required: ['kind'] }],
      discriminator: { propertyName: 'kind' },
    }
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it('does not guess requiredness for external or cyclic references', () => {
    const input = withSchemas({
      External: { allOf: [{ $ref: 'other.yaml' }], discriminator: { propertyName: 'kind' } },
      Cycle: { $ref: '#/components/schemas/Cycle', discriminator: { propertyName: 'kind' } },
    })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it('rejects repeated path variables with an escaped JSON pointer', () => {
    const input = document({
      paths: {
        '/{id}/related/{id}': {
          get: operation([{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]),
        },
      },
    })
    expect(() => upgrade(input)).toThrow('#/paths/~1{id}~1related~1{id}')
    expect(input.openapi).toBe('3.1.2')
  })

  it('rejects repeated server variables at operation level', () => {
    const input = document({
      paths: {
        '/users': {
          get: { ...operation(), servers: [{ url: 'https://{host}/{host}', variables: { host: { default: 'api' } } }] },
        },
      },
    })
    expect(() => upgrade(input)).toThrow('#/paths/~1users/get/servers/0/url')
  })

  it('requires names for inline XML elements and wrapped arrays', () => {
    for (const schema of [{ type: 'object' }, { type: 'array', items: { type: 'string' }, xml: { wrapped: true } }]) {
      const input = document({
        paths: {
          '/data': {
            get: {
              responses: {
                '200': { description: 'OK', content: { 'application/vnd.example+xml; charset=utf-8': { schema } } },
              },
            },
          },
        },
      })
      expect(() => upgrade(input)).toThrow('An inline XML element needs an explicit xml.name.')
    }
  })

  it('accepts named inline XML schemas and referenced XML components', () => {
    const input = withSchemas({ Data: { type: 'object' } })
    at(input, 'paths')['/data'] = {
      get: {
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/xml': { schema: { type: 'object', xml: { name: 'data' } } },
              'text/xml': { schema: { $ref: '#/components/schemas/Data' } },
            },
          },
        },
      },
    }
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it('removes previously inactive allowReserved settings only from parameters', () => {
    const parameters = ['path', 'cookie', 'query'].map((location) => ({
      name: 'id',
      in: location,
      allowReserved: true,
      schema: { type: 'string' },
    }))
    const input = document({
      paths: { '/{id}': { parameters, get: operation() } },
      components: { parameters: { Cookie: parameters[1] } },
    })
    const result = upgrade(input)
    expect(at(result, 'paths', '/{id}').parameters).toStrictEqual([
      { name: 'id', in: 'path', schema: { type: 'string' } },
      { name: 'id', in: 'cookie', schema: { type: 'string' } },
      { name: 'id', in: 'query', allowReserved: true, schema: { type: 'string' } },
    ])
    expect(at(result, 'components', 'parameters', 'Cookie').allowReserved).toBeUndefined()
    expect(at(input, 'paths', '/{id}', 'parameters', 0).allowReserved).toBe(true)
  })
  it('does not follow references across a pinned schema resource', () => {
    const input = withSchemas({
      Pinned: { $schema: 'https://example.com/dialect', $defs: { Id: attribute() } },
      Alias: { $ref: '#/components/schemas/Pinned/$defs/Id' },
    })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it('preserves response-map extensions', () => {
    const input = document({
      paths: {
        '/data': {
          get: {
            responses: {
              '200': { description: 'OK' },
              'x-custom': { content: { 'application/json': { schema: attribute() } } },
            },
          },
        },
      },
    })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it('does not mistake constant-constrained discriminator properties for optional properties', () => {
    const input = withSchemas({
      Pet: { const: { kind: 'dog' }, oneOf: [{ type: 'object' }], discriminator: { propertyName: 'kind' } },
    })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })
  it('isolates shared YAML aliases from examples and other literal data', () => {
    const shared = attribute()
    const input = withSchemas({ Id: shared, Payload: { const: shared, examples: [shared] } })
    const result = upgrade(input)
    expect(at(result, 'components', 'schemas', 'Id').xml).toStrictEqual({ nodeType: 'attribute' })
    expect(at(result, 'components', 'schemas', 'Payload')).toStrictEqual({ const: shared, examples: [shared] })
    expect(at(input, 'components', 'schemas', 'Id')).toStrictEqual(attribute())
  })

  it('rejects object cycles without mutating the input', () => {
    const input = document()
    input['x-cycle'] = input
    expect(() => upgrade(input)).toThrow('cyclic objects cannot be represented in JSON')
    expect(input.openapi).toBe('3.1.2')
    expect(input['x-cycle']).toBe(input)
  })
  it.each([
    { type: 'array', items: { type: 'string' } },
    { type: 'array', xml: { wrapped: true, name: 'Root' }, items: { type: 'string' } },
  ])('rejects unnamed root XML array items: %j', (schema) => {
    const input = document({
      components: { responses: { Xml: { description: 'OK', content: { 'application/xml': { schema } } } } },
    })
    expect(() => upgrade(input)).toThrow('#/components/responses/Xml/content/application~1xml/schema/items')
    expect(input.openapi).toBe('3.1.2')
  })

  it.each([
    { type: 'array', items: { type: 'string', xml: { name: 'Item' } } },
    { type: 'array', items: { $ref: '#/components/schemas/Item' } },
    { type: 'array', items: { type: 'string', xml: { nodeType: 'text' } } },
    { type: 'array', items: { $schema: 'https://example.com/dialect', type: 'string' } },
    { type: 'object', xml: { name: 'Root' }, properties: { items: { type: 'array', items: { type: 'string' } } } },
  ])('accepts XML items with explicit, inferred, or dialect-specific naming: %j', (schema) => {
    const input = document({
      components: {
        schemas: { Item: { type: 'string' } },
        responses: { Xml: { description: 'OK', content: { 'application/xml': { schema } } } },
      },
    })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it.each(['path', 'webhook', 'callback', 'reference'])(
    'preserves a tag group colliding with an operation-only tag in a %s',
    (location) => {
      const pathItem = { get: { ...operation(), tags: ['Animals'] } }
      const input = document({ 'x-tagGroups': [{ name: 'Animals', tags: ['Dogs'] }] })
      if (location === 'path') {
        input.paths = { '/animals': pathItem }
      }
      if (location === 'webhook') {
        input.webhooks = { animals: pathItem }
      }
      if (location === 'callback') {
        input.components = { callbacks: { callback: { '{$request.body#/url}': pathItem } } }
      }
      if (location === 'reference') {
        input.paths = { '/animals': { $ref: '#/x-path-item' } }
        input['x-path-item'] = pathItem
      }
      expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
    },
  )

  it('bounds expansion of compact acyclic alias graphs', () => {
    const schema = Array.from({ length: 30 }).reduce<UnknownObject>((previous) => ({ allOf: [previous, previous] }), {
      type: 'string',
    })
    const input = withSchemas({ Alias: schema })
    expect(() => upgrade(input)).toThrow('excessive YAML alias expansion')
    expect(input.openapi).toBe('3.1.2')
  })
  it('bounds alias expansion of wide arrays of scalar values', () => {
    const leaf = Array.from({ length: 2000 }, () => 'x')
    const input = document({ 'x-aliases': Array.from({ length: 1001 }, () => leaf) })
    expect(() => upgrade(input)).toThrow('excessive YAML alias expansion')
    expect(input.openapi).toBe('3.1.2')
  })

  it('preserves large arrays that do not expand aliases', () => {
    const input = document({ 'x-values': Array.from({ length: 100_001 }, () => 'x') })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it('validates XML names in local referenced array components', () => {
    const input = document({
      components: {
        schemas: { Items: { type: 'array', items: { type: 'string' } } },
        responses: {
          Xml: {
            description: 'OK',
            content: { 'application/xml': { schema: { $ref: '#/components/schemas/Items' } } },
          },
        },
      },
    })
    expect(() => upgrade(input)).toThrow('#/components/schemas/Items/items')
    at(input, 'components', 'schemas', 'Items', 'items').xml = { name: 'Item' }
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it('retains property naming context and terminates cycles in XML references', () => {
    const input = document({
      components: {
        schemas: {
          Root: {
            type: 'object',
            properties: {
              names: { type: 'array', items: { type: 'string' } },
              child: { $ref: '#/components/schemas/Root' },
            },
          },
        },
        responses: {
          Xml: {
            description: 'OK',
            content: { 'application/xml': { schema: { $ref: '#/components/schemas/Root/properties/names' } } },
          },
        },
      },
    })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
    at(input, 'components', 'responses', 'Xml', 'content', 'application/xml').schema = {
      $ref: '#/components/schemas/Root',
    }
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it('does not resolve XML references against the wrong schema base URI', () => {
    const input = document({
      components: {
        schemas: {
          Names: { $id: 'https://example.com/schema', type: 'array', items: { $ref: '#/components/schemas/Other' } },
          Other: { type: 'array', items: { type: 'string' } },
        },
        responses: {
          Xml: {
            description: 'OK',
            content: { 'application/xml': { schema: { $ref: '#/components/schemas/Names' } } },
          },
        },
      },
    })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })
  it('memoizes XML analysis of branching local references', () => {
    const schemas: UnknownObject = { S0: { type: 'string' } }
    for (const index of Array.from({ length: 30 }, (_, value) => value + 1)) {
      const reference = { $ref: '#/components/schemas/S' + (index - 1) }
      schemas['S' + index] = { type: 'object', properties: { left: { ...reference }, right: { ...reference } } }
    }
    const input = document({
      components: {
        schemas,
        responses: {
          Xml: { description: 'OK', content: { 'application/xml': { schema: { $ref: '#/components/schemas/S30' } } } },
        },
      },
    })
    expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
  })

  it.each(['required', 'external', 'cycle'])('bounds discriminator analysis of branching %s references', (kind) => {
    const schemas: UnknownObject = { S0: { required: ['kind'] } }
    if (kind === 'external') {
      schemas.S0 = { $ref: 'other.yaml' }
    }
    if (kind === 'cycle') {
      schemas.S0 = { $ref: '#/components/schemas/S0' }
    }
    for (const index of Array.from({ length: 30 }, (_, value) => value + 1)) {
      const reference = { $ref: '#/components/schemas/S' + (index - 1) }
      schemas['S' + index] = { allOf: [{ ...reference }, { ...reference }] }
    }
    at(schemas, 'S30').discriminator = { propertyName: 'kind' }
    const input = withSchemas(schemas)
    if (kind === 'cycle') {
      expect(() => upgrade(input)).toThrow(
        'Discriminator requiredness analysis was truncated after 100,000 evaluations.',
      )
    } else {
      expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
    }
  })

  it.each(['allOf', 'anyOf', 'oneOf'])('requires explicit XML names in inline %s branches', (keyword) => {
    const schema = { type: 'object', xml: { name: 'Root' }, [keyword]: [{ type: 'object' }] }
    const input = document({
      components: { responses: { Xml: { description: 'OK', content: { 'application/xml': { schema } } } } },
    })
    expect(() => upgrade(input)).toThrow('#/components/responses/Xml/content/application~1xml/schema/' + keyword + '/0')
  })

  it.each(['allOf', 'anyOf', 'oneOf'])('preserves valid XML naming in %s branches', (keyword) => {
    for (const branch of [
      { type: 'object', xml: { name: 'Branch' } },
      { type: 'object', xml: { nodeType: 'none' }, properties: { id: { type: 'string' } } },
      { $ref: '#/components/schemas/Branch' },
      { $schema: 'https://example.com/dialect', type: 'object' },
    ]) {
      const schema = { type: 'object', xml: { name: 'Root' }, [keyword]: [branch] }
      const input = document({
        components: {
          schemas: { Branch: { type: 'object' } },
          responses: { Xml: { description: 'OK', content: { 'application/xml': { schema } } } },
        },
      })
      expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
    }
  })
  it.each(['properties', 'items', 'prefixItems'])('infers XML names from a property literally named %s', (name) => {
    for (const suffix of ['', '/items', '/prefixItems/0']) {
      const property = { type: 'array', items: { type: 'string' }, prefixItems: [{ type: 'string' }] }
      const input = document({
        components: {
          responses: {
            Xml: {
              description: 'OK',
              content: {
                'application/xml': {
                  schema: { $ref: '#/components/schemas/Root/properties/' + name + suffix },
                },
              },
            },
          },
          schemas: { Root: { type: 'object', properties: { [name]: property } } },
        },
      })
      expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
    }
  })

  it.each(['properties', 'List'])('does not infer XML item names from component %s', (name) => {
    const input = document({
      components: {
        schemas: { [name]: { type: 'array', items: { type: 'string' } } },
        responses: {
          Xml: {
            description: 'OK',
            content: {
              'application/xml': {
                schema: { $ref: '#/components/schemas/' + name + '/items' },
              },
            },
          },
        },
      },
    })
    expect(() => upgrade(input)).toThrow('#/components/schemas/' + name + '/items')
  })
  it.each(['#/__proto__', '#/constructor/prototype', '#/components/parameters/__proto__'])(
    'does not follow inherited reference %s',
    ($ref) => {
      const input = document({
        components: { parameters: { Ref: { $ref } } },
      })
      const prototype = Object.entries(Object.getOwnPropertyDescriptors(Object.prototype))
      expect(upgrade(input)).toStrictEqual({ ...input, openapi: '3.2.0' })
      expect(Object.entries(Object.getOwnPropertyDescriptors(Object.prototype))).toStrictEqual(prototype)
    },
  )

  it('migrates own reference targets named __proto__ and constructor', () => {
    const parameters: UnknownObject = JSON.parse(
      '{"__proto__":{"name":"id","in":"path","required":true,"allowReserved":true},"constructor":{"name":"token","in":"cookie","allowReserved":true}}',
    )
    const input = document({
      'x-parameters': parameters,
      components: {
        parameters: {
          Id: { $ref: '#/x-parameters/__proto__' },
          Token: { $ref: '#/x-parameters/constructor' },
        },
      },
    })
    const prototype = Object.entries(Object.getOwnPropertyDescriptors(Object.prototype))
    expect(JSON.stringify(upgrade(input))).toBe(
      JSON.stringify({
        ...input,
        openapi: '3.2.0',
        'x-parameters': JSON.parse(
          '{"__proto__":{"name":"id","in":"path","required":true},"constructor":{"name":"token","in":"cookie"}}',
        ),
      }),
    )
    expect(at(parameters, '__proto__').allowReserved).toBe(true)
    expect(at(parameters, 'constructor').allowReserved).toBe(true)
    expect(Object.entries(Object.getOwnPropertyDescriptors(Object.prototype))).toStrictEqual(prototype)
  })
})
