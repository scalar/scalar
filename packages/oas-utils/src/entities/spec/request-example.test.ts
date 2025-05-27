import { describe, expect, it } from 'vitest'

import { operationSchema } from './operation'
import {
  convertExampleToXScalar,
  createExampleFromRequest,
  createParamInstance,
  parameterArrayToObject,
  requestExampleSchema,
} from './request-examples'

describe('createParamInstance', () => {
  it('works with schema enum type number', () => {
    const result = createParamInstance({
      in: 'path',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: 1.2,
        type: 'number',
        enum: [1.2, 2.1, 3],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: '1.2',
      enabled: true,
      description: undefined,
      required: true,
      enum: ['1.2', '2.1', '3'],
      type: 'number',
      default: 1.2,
    })
  })

  it('works with schema enum type string', () => {
    const result = createParamInstance({
      in: 'path',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: 'foo',
        type: 'string',
        enum: ['foo', 'bar'],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: 'foo',
      enabled: true,
      description: undefined,
      required: true,
      enum: ['foo', 'bar'],
      type: 'string',
      default: 'foo',
    })
  })

  it('works with schema enum type integer', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: 1,
        type: 'integer',
        enum: [1, 2, 3],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: '1',
      enabled: true,
      description: undefined,
      required: true,
      enum: ['1', '2', '3'],
      type: 'integer',
      default: 1,
    })
  })

  it('works with schema enum type boolean', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: false,
        type: 'boolean',
        enum: [true, false],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: 'false',
      enabled: true,
      description: undefined,
      required: true,
      enum: ['true', 'false'],
      type: 'boolean',
      default: false,
    })
  })

  it('works with schema examples type number', () => {
    const result = createParamInstance({
      in: 'path',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: 1.2,
        type: 'number',
        examples: [1.2, 2.1, 3],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: '1.2',
      enabled: true,
      description: undefined,
      required: true,
      examples: ['1.2', '2.1', '3'],
      type: 'number',
      default: 1.2,
    })
  })

  it('works with schema examples type string', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: false,
        type: 'boolean',
        examples: ['foo', 'bar'],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: 'false',
      enabled: true,
      description: undefined,
      required: true,
      type: 'boolean',
      default: false,
      examples: ['foo', 'bar'],
    })
  })

  it('works with schema examples type integer', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: 1,
        type: 'integer',
        examples: [1, 2, 3],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: '1',
      enabled: true,
      description: undefined,
      required: true,
      examples: ['1', '2', '3'],
      type: 'integer',
      default: 1,
    })
  })

  it('works with schema examples type boolean', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        default: false,
        type: 'boolean',
        examples: [true, false],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: 'false',
      enabled: true,
      description: undefined,
      required: true,
      examples: ['true', 'false'],
      type: 'boolean',
      default: false,
    })
  })

  it('works with array of types', () => {
    const result = createParamInstance({
      in: 'path',
      name: 'foo',
      required: true,
      deprecated: false,
      schema: {
        type: ['string', 'null'],
      },
    })

    expect(result).toEqual({
      key: 'foo',
      enabled: true,
      enum: undefined,
      examples: undefined,
      description: undefined,
      required: true,
      type: 'string',
      nullable: true,
      value: '',
    })
  })

  it('works with content examples', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: false,
      deprecated: false,
      content: {
        'application/json': {
          schema: { type: 'integer', maximum: 50 },
          examples: {
            zero: { value: 0 },
            max: { value: 50 },
          },
        },
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: '0',
      enabled: false,
      description: undefined,
      required: false,
    })
  })

  it('works with content example', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: false,
      deprecated: false,
      content: {
        'application/json': {
          schema: { type: 'integer' },
          example: 42,
        },
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: '42',
      enabled: false,
      description: undefined,
      required: false,
    })
  })

  it('works with parameter example', () => {
    const result = createParamInstance({
      in: 'query',
      name: 'foo',
      required: false,
      deprecated: false,
      example: 42,
      schema: {
        type: 'integer',
        example: 1,
      },
    })

    expect(result).toEqual({
      key: 'foo',
      value: '42',
      enabled: false,
      description: undefined,
      required: false,
      type: 'integer',
    })
  })
})

describe('parameterArrayToObject', () => {
  it('converts array of parameters to key-value object', () => {
    const params = [
      { key: 'foo', value: 'bar', enabled: true },
      { key: 'hello', value: 'world', enabled: false },
    ]

    const result = parameterArrayToObject(params)

    expect(result).toEqual({
      foo: 'bar',
      hello: 'world',
    })
  })

  it('handles empty array', () => {
    const result = parameterArrayToObject([])
    expect(result).toEqual({})
  })
})

describe('convertExampleToXScalar', () => {
  it('converts raw JSON body', () => {
    const example = requestExampleSchema.parse({
      uid: 'test-uid',
      requestUid: 'req-uid',
      body: {
        activeBody: 'raw',
        raw: {
          encoding: 'json' as const,
          value: '{"test": true}',
        },
      },
      parameters: {
        path: [{ key: 'id', value: '123', enabled: true }],
        headers: [{ key: 'Accept', value: '*/*', enabled: true }],
      },
    })

    const result = convertExampleToXScalar(example)

    expect(result).toEqual({
      body: {
        encoding: 'application/json',
        content: '{"test": true}',
      },
      parameters: {
        path: { id: '123' },
        headers: { Accept: '*/*' },
      },
    })
  })

  it('converts form data body', () => {
    const example = requestExampleSchema.parse({
      uid: 'test-uid',
      requestUid: 'req-uid',
      body: {
        activeBody: 'formData',
        formData: {
          encoding: 'form-data' as const,
          value: [
            { key: 'field1', value: 'value1', enabled: true },
            {
              key: 'file1',
              value: 'ignore this',
              file: new File(['test content'], 'test.txt', { type: 'text/plain' }),
              enabled: true,
            },
          ],
        },
      },
    })

    const result = convertExampleToXScalar(example)

    expect(result).toEqual({
      body: {
        encoding: 'multipart/form-data',
        content: {
          field1: { type: 'string', value: 'value1' },
          file1: { type: 'file', file: null },
        },
      },
      parameters: {
        headers: {
          Accept: '*/*',
        },
      },
    })
  })

  it('converts binary body', () => {
    const example = requestExampleSchema.parse({
      uid: 'test-uid',
      requestUid: 'req-uid',
      body: {
        activeBody: 'binary',
        binary: new Blob(['test']),
      },
    })

    const result = convertExampleToXScalar(example)

    expect(result).toEqual({
      body: {
        encoding: 'binary',
        content: '',
        file: null,
      },
      parameters: {
        headers: {
          Accept: '*/*',
        },
      },
    })
  })
})

describe('createExampleFromRequest', () => {
  it('creates example with JSON request body', () => {
    const operation = operationSchema.parse({
      uid: 'request-1',
      path: '/test',
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          deprecated: false,
          schema: { type: 'string', default: '123' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {},
            example: '{"test": true}',
          },
        },
      },
    })

    const result = createExampleFromRequest(operation, 'Test Example')

    expect(result).toMatchObject({
      requestUid: 'request-1',
      name: 'Test Example',
      body: {
        activeBody: 'raw',
        raw: {
          encoding: 'json',
          value: '{"test": true}',
        },
      },
      parameters: {
        path: [
          {
            key: 'id',
            value: '123',
            enabled: true,
            required: true,
          },
        ],
        headers: [
          { key: 'Accept', value: '*/*', enabled: true },
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ],
        query: [],
        cookies: [],
      },
    })
  })

  it('does not overwrite the content-type header if it exists', () => {
    const operation = operationSchema.parse({
      uid: 'request-1',
      path: '/test',
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          deprecated: false,
          schema: { type: 'string', default: '123' },
        },
        {
          in: 'header',
          name: 'Content-Type',
          required: true,
          deprecated: false,
          schema: { type: 'string', default: 'application/testing' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {},
            example: '{"test": true}',
          },
        },
      },
    })

    const result = createExampleFromRequest(operation, 'Test Example')

    expect(result).toMatchObject({
      requestUid: 'request-1',
      name: 'Test Example',
      body: {
        activeBody: 'raw',
        raw: {
          encoding: 'json',
          value: '{"test": true}',
        },
      },
      parameters: {
        path: [
          {
            key: 'id',
            value: '123',
            enabled: true,
            required: true,
          },
        ],
        headers: [{ key: 'Content-Type', value: 'application/testing', enabled: true }],
        query: [],
        cookies: [],
      },
    })
  })

  it('creates example with form-data request body', () => {
    const operation = operationSchema.parse({
      uid: 'request-1',
      path: '/test',
      parameters: [],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                image: {
                  type: 'string',
                  format: 'binary',
                  description: "The pet's image file",
                },
                additionalImages: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'binary',
                  },
                  description: 'Additional pet images',
                },
                metadata: {
                  type: 'object',
                  properties: {
                    caption: {
                      type: 'string',
                    },
                    tags: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    const result = createExampleFromRequest(operation, 'Form Example')

    expect(result).toMatchObject({
      requestUid: 'request-1',
      name: 'Form Example',
      body: {
        activeBody: 'formData',
        formData: {
          encoding: 'form-data',
          value: [
            { key: 'image', value: 'BINARY', file: expect.any(File), enabled: true },
            { key: 'additionalImages', value: 'BINARY', file: expect.any(File), enabled: true },
            { key: 'metadata', value: '{"caption":"","tags":[""]}', enabled: true },
          ],
        },
      },
      parameters: {
        headers: [{ key: 'Accept', value: '*/*', enabled: true }],
        path: [],
        query: [],
        cookies: [],
      },
    })
  })
})

describe('createExampleFromRequest with default body when Content-Type header is exists', () => {
  it.each([
    { contentType: 'application/json', defaultBody: { activeBody: 'raw', raw: { encoding: 'json', value: '{}' } } },
    { contentType: 'application/xml', defaultBody: { activeBody: 'raw', raw: { encoding: 'xml', value: '' } } },
    { contentType: 'application/octet-stream', defaultBody: { activeBody: 'binary', binary: undefined } },
    {
      contentType: 'application/x-www-form-urlencoded',
      defaultBody: { activeBody: 'formData', formData: { encoding: 'urlencoded', value: [] } },
    },
    {
      contentType: 'multipart/form-data',
      defaultBody: { activeBody: 'formData', formData: { encoding: 'form-data', value: [] } },
    },
  ] as const)('when Content-Type header is $contentType', ({ contentType, defaultBody }) => {
    const operation = operationSchema.parse({
      uid: 'request-1',
      path: '/test',
      parameters: [
        {
          in: 'header',
          name: 'Content-Type',
          required: true,
          deprecated: false,
          schema: { type: 'string', default: contentType },
        },
      ],
    })

    const result = createExampleFromRequest(operation, 'Test Example')

    expect(result).toMatchObject({
      requestUid: 'request-1',
      name: 'Test Example',
      body: defaultBody,
      parameters: {
        headers: [{ key: 'Content-Type', value: contentType, enabled: true }],
        query: [],
        cookies: [],
      },
    })
  })

  it('when Content-Type header is not exists', () => {
    const operation = operationSchema.parse({
      uid: 'request-1',
      path: '/test',
      parameters: [
        {
          in: 'header',
          name: 'Content-Type',
          required: true,
          deprecated: false,
          schema: { type: 'string' },
        },
      ],
    })

    const result = createExampleFromRequest(operation, 'Test Example')

    expect(result).toMatchObject({
      requestUid: 'request-1',
      name: 'Test Example',
      body: {
        activeBody: 'raw',
      },
      parameters: {
        headers: [{ key: 'Content-Type', value: '', enabled: true }],
        query: [],
        cookies: [],
      },
    })
  })
})
