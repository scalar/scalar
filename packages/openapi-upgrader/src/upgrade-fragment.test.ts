import { describe, expect, it } from 'vitest'

import { upgradeFragment } from './upgrade-fragment'

describe('upgrade-fragment', () => {
  it('upgrades a bare schema without interpreting literal example data', async () => {
    const example = { type: 'string', nullable: true, $ref: './literal' }
    const input = { type: 'object', properties: { name: { type: 'string', nullable: true } }, example }
    const result = await upgradeFragment(input, { from: '3.0', to: '3.1', kind: 'schema' })
    expect(result.value).toStrictEqual({
      type: 'object',
      properties: { name: { type: ['string', 'null'] } },
      examples: [example],
    })
    expect(input.properties.name).toStrictEqual({ type: 'string', nullable: true })
  })

  it('preserves parameter examples and schema examples in their respective shapes', async () => {
    const result = await upgradeFragment(
      { name: 'q', in: 'query', example: 'sample', schema: { type: 'string', example: 'sample', nullable: true } },
      { from: '3.0', to: '3.1', kind: 'parameter' },
    )
    expect(result.value).toStrictEqual({
      name: 'q',
      in: 'query',
      example: 'sample',
      schema: { type: ['string', 'null'], examples: ['sample'] },
    })
  })

  it('records the new location of a 2.0 definition and its descendants', async () => {
    const result = await upgradeFragment(
      {
        swagger: '2.0',
        info: { title: 'Test', version: '1' },
        paths: {},
        definitions: { Pet: { type: 'object', properties: { name: { type: 'string', 'x-nullable': true } } } },
      },
      { from: '2.0', to: '3.1', kind: 'document' },
    )
    expect(result.value).toStrictEqual({
      openapi: '3.1.1',
      info: { title: 'Test', version: '1' },
      paths: {},
      components: { schemas: { Pet: { type: 'object', properties: { name: { type: ['string', 'null'] } } } } },
    })
    expect(result.locations.find(({ source }) => source.join('/') === 'definitions/Pet/properties/name')).toStrictEqual(
      {
        source: ['definitions', 'Pet', 'properties', 'name'],
        output: ['components', 'schemas', 'Pet', 'properties', 'name'],
      },
    )
  })

  it('upgrades a 2.0 path item including query, header and body parameters', async () => {
    const result = await upgradeFragment(
      {
        post: {
          consumes: ['application/json'],
          parameters: [
            { name: 'limit', in: 'query', type: 'integer' },
            { name: 'X-Trace', in: 'header', type: 'string' },
            { name: 'body', in: 'body', required: true, schema: { type: 'string' } },
          ],
          responses: { '201': { description: 'created' } },
        },
      },
      { from: '2.0', to: '3.1', kind: 'path-item' },
    )
    expect(result.value).toStrictEqual({
      post: {
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'X-Trace', in: 'header', schema: { type: 'string' } },
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'string' } } } },
        responses: { '201': { description: 'created' } },
      },
    })
  })
  it('upgrades callback request-body schemas', async () => {
    const input = {
      openapi: '3.0.3',
      paths: {
        '/subscribe': {
          post: {
            callbacks: {
              event: {
                '{$request.body.callbackUrl}': {
                  post: {
                    requestBody: { content: { 'application/json': { schema: { type: 'string', nullable: true } } } },
                    responses: { '200': { description: 'OK' } },
                  },
                },
              },
            },
          },
        },
      },
    }
    const result = await upgradeFragment(input, { from: '3.0', to: '3.1', kind: 'document' })
    const output = result.value as typeof input
    expect(
      output.paths['/subscribe'].post.callbacks.event['{$request.body.callbackUrl}'].post.requestBody.content[
        'application/json'
      ].schema,
    ).toStrictEqual({ type: ['string', 'null'] })
  })

  it('combines referenced reusable form parameters at their owning operation', async () => {
    const file = { name: 'file', in: 'formData', type: 'file', required: true }
    const input = {
      swagger: '2.0',
      parameters: { Upload: file },
      paths: {
        '/upload': {
          post: {
            consumes: ['multipart/form-data'],
            parameters: [{ $ref: '#/parameters/Upload' }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    }
    const result = await upgradeFragment(input, {
      from: '2.0',
      to: '3.1',
      kind: 'document',
      resolveSource: () => Promise.resolve(file),
    })
    const output = result.value as { paths: Record<string, { post: { parameters?: unknown; requestBody: unknown } }> }
    expect(output.paths['/upload']?.post.parameters).toBeUndefined()
    expect(output.paths['/upload']?.post.requestBody).toStrictEqual({
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: { file: { contentMediaType: 'application/octet-stream' } },
            required: ['file'],
          },
        },
      },
    })
  })
  it('converts response headers once and retains their validation fields', async () => {
    const result = await upgradeFragment(
      { description: 'OK', headers: { Count: { type: 'integer', minimum: 0 } } },
      { from: '2.0', to: '3.1', kind: 'response' },
    )
    expect(result.value).toStrictEqual({
      description: 'OK',
      headers: { Count: { schema: { type: 'integer', minimum: 0 } } },
    })
  })
  it('retains distinct inherited parameter refs and their original source paths', async () => {
    const lookup: Record<string, unknown> = {
      '#/parameters/Q': { name: 'q', in: 'query', type: 'string' },
      '#/parameters/H': { name: 'trace', in: 'header', type: 'string' },
    }
    const result = await upgradeFragment(
      {
        parameters: [{ $ref: '#/parameters/Q' }],
        get: { parameters: [{ $ref: '#/parameters/H' }], responses: { '200': { description: 'OK' } } },
      },
      { from: '2.0', to: '3.1', kind: 'path-item', resolveSource: (ref) => Promise.resolve(lookup[ref]) },
    )
    expect(result.value).toStrictEqual({
      get: {
        parameters: [{ $ref: '#/parameters/Q' }, { $ref: '#/parameters/H' }],
        responses: { '200': { description: 'OK' } },
      },
    })
    expect(result.locations).toContainEqual({ source: ['parameters', '0'], output: ['get', 'parameters', '0'] })
    expect(result.locations).toContainEqual({ source: ['get', 'parameters', '0'], output: ['get', 'parameters', '1'] })
  })

  it('composes nested nullable schema relocations', async () => {
    const result = await upgradeFragment(
      { nullable: true, allOf: [{ nullable: true, allOf: [{ type: 'string' }] }] },
      { from: '3.0', to: '3.1', kind: 'schema' },
    )
    expect(result.value).toStrictEqual({ anyOf: [{ anyOf: [{ type: 'string' }, { type: 'null' }] }, { type: 'null' }] })
    expect(result.locations).toContainEqual({
      source: ['allOf', '0', 'allOf', '0'],
      output: ['anyOf', '0', 'anyOf', '0'],
    })
  })

  it.each([
    { consumes: ['multipart/form-data'], expected: 'multipart/form-data' },
    { consumes: undefined, expected: 'multipart/form-data' },
    {
      consumes: ['application/json', 'application/x-www-form-urlencoded'],
      expected: 'application/x-www-form-urlencoded',
    },
  ])('records form parameter descendants for $consumes', async ({ consumes, expected }) => {
    const form = { name: 'tags', in: 'formData', type: 'array', items: { type: 'string' } }
    const options = { from: '2.0', to: '3.1', consumes } as const
    const reusable = await upgradeFragment(form, { ...options, kind: 'request-body' })
    const combined = await upgradeFragment({ parameters: [form] }, { ...options, kind: 'operation' })
    const property = ['content', expected, 'schema', 'properties', 'tags', 'items']
    expect(reusable.locations.filter((location) => location.source.join('/') === 'items')).toStrictEqual([
      { source: ['items'], output: property },
    ])
    expect(combined.locations.filter((location) => location.source.join('/') === 'parameters/0/items')).toStrictEqual([
      { source: ['parameters', '0', 'items'], output: ['requestBody', ...property] },
    ])
  })
})
