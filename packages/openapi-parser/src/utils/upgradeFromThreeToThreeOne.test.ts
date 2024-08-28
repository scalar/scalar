import { describe, expect, it } from 'vitest'

import { upgradeFromThreeToThreeOne } from './upgradeFromThreeToThreeOne'

describe('version', () => {
  it('doesn’t modify Swagger 2.0 files', async () => {
    const result = upgradeFromThreeToThreeOne({
      swagger: '2.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(result.swagger).toBe('2.0')
  })

  it('changes the version to from 3.0.0 to 3.1.0', async () => {
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(result.openapi).toBe('3.1.0')
  })

  it('changes the version to 3.0.3 to 3.1.0', async () => {
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.3',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(result.openapi).toBe('3.1.0')
  })
})

describe('nullable types', () => {
  it('migrates nullable types', async () => {
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                description: 'foobar',
                content: {
                  'application/json': {
                    schema: {
                      type: 'string',
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(
      result.paths['/test'].get.responses['200'].content['application/json']
        .schema,
    ).toEqual({
      type: ['null', 'string'],
    })
  })
})

describe('exclusiveMinimum and exclusiveMaximum', () => {
  it('migrate exclusiveMinimum and exclusiveMaximum', async () => {
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                description: 'foobar',
                content: {
                  'application/json': {
                    schema: {
                      type: 'integer',
                      minimum: 1,
                      exclusiveMinimum: true,
                      maximum: 100,
                      exclusiveMaximum: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(
      result.paths['/test'].get.responses['200'].content['application/json']
        .schema,
    ).toEqual({
      type: 'integer',
      exclusiveMinimum: 1,
      exclusiveMaximum: 100,
    })
  })
})

describe('use examples not example', () => {
  it('migrates example to examples', async () => {
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                description: 'foobar',
                content: {
                  'application/json': {
                    schema: {
                      type: 'integer',
                      example: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(
      result.paths['/test'].get.responses['200'].content['application/json']
        .schema,
    ).toEqual({
      type: 'integer',
      examples: {
        default: 1,
      },
    })
  })
})

describe('describing File Upload Payloads ', () => {
  it('remove schema for file uploads', async () => {
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            requestBody: {
              content: {
                'application/octet-stream': {
                  schema: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(
      result.paths['/test'].get.requestBody.content['application/octet-stream'],
    ).toEqual({})
  })

  it('migrates base64 format to contentEncoding', async () => {
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            requestBody: {
              content: {
                'application/octet-stream': {
                  schema: {
                    type: 'string',
                    format: 'base64',
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(
      result.paths['/test'].get.requestBody.content['application/octet-stream'],
    ).toEqual({
      schema: {
        type: 'string',
        contentEncoding: 'base64',
      },
    })
  })

  it('migrates binary format for multipart file uploads', async () => {
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            requestBody: {
              content: {
                'multipart/form-data': {
                  schema: {
                    type: 'object',
                    properties: {
                      fileName: {
                        type: 'string',
                        format: 'binary',
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

    expect(
      result.paths['/test'].get.requestBody.content['multipart/form-data'],
    ).toEqual({
      schema: {
        type: 'object',
        properties: {
          fileName: {
            type: 'string',
            contentEncoding: 'application/octet-stream',
          },
        },
      },
    })
  })
})

describe.skip('declaring $schema', () => {
  it('adds a $schema', async () => {
    const result = upgradeFromThreeToThreeOne({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(result.$schema).toBe('http://json-schema.org/draft-07/schema#')
  })
})
