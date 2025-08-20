import { describe, expect, it } from 'vitest'
import { createMagicProxy } from '@scalar/json-magic/magic-proxy'

import { getRequestBodyFromOperation } from './get-request-body-from-operation'

describe('getRequestBodyFromOperation', () => {
  it('creates a JSON body from a requestBody schema', () => {
    const body = getRequestBodyFromOperation({
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  example: 1,
                },
              },
            },
          },
        },
      },
    })

    const expectedResult = {
      id: 1,
    }

    expect(body).toMatchObject({
      mimeType: 'application/json',
      text: JSON.stringify(expectedResult, null, 2),
    })
  })

  it('ignores charset in mimetypes', () => {
    const body = getRequestBodyFromOperation({
      requestBody: {
        content: {
          'application/json; charset=utf-8': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  example: 1,
                },
              },
            },
          },
        },
      },
    })

    const expectedResult = {
      id: 1,
    }

    expect(body).toMatchObject({
      mimeType: 'application/json',
      text: JSON.stringify(expectedResult, null, 2),
    })
  })

  it('uses example', () => {
    const body = getRequestBodyFromOperation(
      createMagicProxy({
        requestBody: {
          description: 'Sample request body',
          required: false,
          content: {
            'application/json': {
              example: {
                someObject: {
                  someAttribute: 'attribute1',
                },
              },
              schema: {
                type: 'object',
                properties: {
                  someObject: {
                    type: 'object',
                    properties: {
                      someAttribute: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    )

    const expectedResult = {
      someObject: {
        someAttribute: 'attribute1',
      },
    }

    expect(body).toMatchObject({
      mimeType: 'application/json',
      text: JSON.stringify(expectedResult, null, 2),
    })
  })

  it('uses examples', () => {
    const body = getRequestBodyFromOperation({
      requestBody: {
        description: 'Sample request body',
        required: false,
        content: {
          'application/json': {
            examples: {
              'request-example-1': {
                summary: 'an example of a request',
                description: 'a longer string than the summary',
                value: {
                  someObject: {
                    someAttribute: 'attribute1',
                  },
                },
              },
            },
            schema: {
              $ref: '#/components/schemas/PutDocumentRequest',
            },
          },
        },
      },
    })

    const expectedResult = {
      someObject: {
        someAttribute: 'attribute1',
      },
    }

    expect(body).toMatchObject({
      mimeType: 'application/json',
      text: JSON.stringify(expectedResult, null, 2),
    })
  })

  it('creates key-value pair examples from object schema', () => {
    const body = getRequestBodyFromOperation({
      requestBody: {
        description: 'Sample request body',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'recordString',
                'recordInteger',
                'recordArray',
                'recordBoolean',
                'recordNullable',
                'recordObject',
                'recordWithoutAdditionalProperties',
              ],
              properties: {
                recordString: {
                  type: 'string',
                },
                recordInteger: {
                  type: 'integer',
                },
                recordArray: {
                  type: 'array',
                },
                recordBoolean: {
                  type: 'boolean',
                },
                recordNullable: {
                  nullable: 'true',
                },
                recordObject: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    })

    const expectedResult = {
      recordString: '',
      recordInteger: 1,
      recordArray: [],
      recordBoolean: true,
      recordNullable: null,
      recordObject: {},
    }

    expect(body).toMatchObject({
      mimeType: 'application/json',
      text: JSON.stringify(expectedResult, null, 2),
    })
  })

  it('adds parameters from a requestBody schema', () => {
    const body = getRequestBodyFromOperation({
      requestBody: {
        content: {
          'application/x-www-form-urlencoded': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  example: 1,
                },
                name: {
                  type: 'string',
                  example: 'foobar',
                },
              },
            },
          },
        },
      },
    })

    expect(body).toMatchObject({
      mimeType: 'application/x-www-form-urlencoded',
      params: [
        {
          name: 'id',
          value: 1,
        },
        {
          name: 'name',
          value: 'foobar',
        },
      ],
    })
  })

  it('handles vendor-specific MIME types', () => {
    const body = getRequestBodyFromOperation({
      requestBody: {
        content: {
          'application/vnd.github+json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  example: 1,
                },
              },
            },
          },
        },
      },
    })

    const expectedResult = {
      id: 1,
    }

    expect(body).toMatchObject({
      mimeType: 'application/vnd.github+json',
      text: JSON.stringify(expectedResult, null, 2),
    })
  })
})
