import { describe, expect, it } from 'vitest'
import { OperationObjectSchema } from '../unprocessed/operation-object'

describe('operation-object', () => {
  describe('OperationObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#operation-object-example
    it('Operation Object Example', () => {
      const result = OperationObjectSchema.parse({
        tags: ['pet'],
        summary: 'Updates a pet in the store with form data',
        operationId: 'updatePetWithForm',
        parameters: [
          {
            name: 'petId',
            in: 'path',
            description: 'ID of pet that needs to be updated',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    description: 'Updated name of the pet',
                    type: 'string',
                  },
                  status: {
                    description: 'Updated status of the pet',
                    type: 'string',
                  },
                },
                required: ['status'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Pet updated.',
            content: {
              'application/json': {},
              'application/xml': {},
            },
          },
          405: {
            description: 'Method Not Allowed',
            content: {
              'application/json': {},
              'application/xml': {},
            },
          },
        },
        security: [
          {
            petstore_auth: ['write:pets', 'read:pets'],
          },
        ],
      })
      expect(result).toEqual({
        tags: ['pet'],
        summary: 'Updates a pet in the store with form data',
        operationId: 'updatePetWithForm',
        parameters: [
          {
            name: 'petId',
            in: 'path',
            description: 'ID of pet that needs to be updated',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    description: 'Updated name of the pet',
                    type: 'string',
                  },
                  status: {
                    description: 'Updated status of the pet',
                    type: 'string',
                  },
                },
                required: ['status'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Pet updated.',
            content: {
              'application/json': {},
              'application/xml': {},
            },
          },
          405: {
            description: 'Method Not Allowed',
            content: {
              'application/json': {},
              'application/xml': {},
            },
          },
        },
        security: [
          {
            petstore_auth: ['write:pets', 'read:pets'],
          },
        ],
      })
    })

    describe('Considerations for File Uploads', () => {
      it('PNG image as a binary file', () => {
        const result = OperationObjectSchema.parse({
          requestBody: {
            content: {
              'image/png': {},
            },
          },
        })

        expect(result).toEqual({
          requestBody: {
            content: {
              'image/png': {},
            },
          },
        })
      })

      it('arbitrary binary file', () => {
        const result = OperationObjectSchema.parse({
          requestBody: {
            content: {
              'application/octet-stream': {},
            },
          },
        })

        expect(result).toEqual({
          requestBody: {
            content: {
              'application/octet-stream': {},
            },
          },
        })
      })

      it('arbitrary JSON without constraints beyond being syntactically valid', () => {
        const result = OperationObjectSchema.parse({
          requestBody: {
            content: {
              'application/json': {},
            },
          },
        })

        expect(result).toEqual({
          requestBody: {
            content: {
              'application/json': {},
            },
          },
        })
      })
    })

    describe('Encoding the x-www-form-urlencoded Media Type', () => {
      it(`When there is no encoding field, the serialization strategy is based on the Encoding Object's default values`, () => {
        const result = OperationObjectSchema.parse({
          requestBody: {
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                    },
                    address: {
                      // complex types are stringified to support RFC 1866
                      type: 'object',
                      properties: {},
                    },
                  },
                },
              },
            },
          },
        })

        expect(result).toEqual({
          requestBody: {
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                    },
                    address: {
                      // complex types are stringified to support RFC 1866
                      type: 'object',
                      properties: {},
                    },
                  },
                },
              },
            },
          },
        })
      })

      it('Note that application/x-www-form-urlencoded is a text format, which requires base64-encoding any binary data', () => {
        const result = OperationObjectSchema.parse({
          requestBody: {
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                    icon: {
                      // The default with "contentEncoding" is application/octet-stream,
                      // so we need to set image media type(s) in the Encoding Object.
                      type: 'string',
                      contentEncoding: 'base64url',
                    },
                  },
                },
              },
            },
            encoding: {
              icon: {
                contentType: 'image/png, image/jpeg',
              },
            },
          },
        })

        expect(result).toEqual({
          requestBody: {
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                    icon: {
                      // The default with "contentEncoding" is application/octet-stream,
                      // so we need to set image media type(s) in the Encoding Object.
                      type: 'string',
                      contentEncoding: 'base64url',
                    },
                  },
                },
              },
            },
            encoding: {
              icon: {
                contentType: 'image/png, image/jpeg',
              },
            },
          },
        })
      })

      it('Example: Basic Multipart Form', () => {
        const result = OperationObjectSchema.parse({
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    id: {
                      // default for primitives without a special format is text/plain
                      type: 'string',
                      format: 'uuid',
                    },
                    profileImage: {
                      // default for string with binary format is `application/octet-stream`
                      type: 'string',
                      format: 'binary',
                    },
                    addresses: {
                      // default for arrays is based on the type in the `items`
                      // subschema, which is an object, so `application/json`
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Address',
                      },
                    },
                  },
                },
              },
            },
          },
        })

        expect(result).toEqual({
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    id: {
                      // default for primitives without a special format is text/plain
                      type: 'string',
                      format: 'uuid',
                    },
                    profileImage: {
                      // default for string with binary format is `application/octet-stream`
                      type: 'string',
                      format: 'binary',
                    },
                    addresses: {
                      // default for arrays is based on the type in the `items`
                      // subschema, which is an object, so `application/json`
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Address',
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })

      it('Example: Multipart Form with Encoding Objects', () => {
        const result = OperationObjectSchema.parse({
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                    },
                    addresses: {
                      description: 'addresses in XML format',
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Address',
                      },
                    },
                    profileImage: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
                encoding: {
                  addresses: {
                    contentType: 'application/xml; charset=utf-8',
                  },
                  profileImage: {
                    contentType: 'image/png, image/jpeg',
                    headers: {
                      'X-Rate-Limit-Limit': {
                        description: 'The number of allowed requests in the current period',
                        schema: {
                          type: 'integer',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })

        expect(result).toEqual({
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                    },
                    addresses: {
                      description: 'addresses in XML format',
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Address',
                      },
                    },
                    profileImage: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
                encoding: {
                  addresses: {
                    contentType: 'application/xml; charset=utf-8',
                  },
                  profileImage: {
                    contentType: 'image/png, image/jpeg',
                    headers: {
                      'X-Rate-Limit-Limit': {
                        description: 'The number of allowed requests in the current period',
                        schema: {
                          type: 'integer',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })

      it('Example: Multipart Form with Multiple Files', () => {
        const result = OperationObjectSchema.parse({
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  properties: {
                    // The property name 'file' will be used for all files.
                    file: {
                      type: 'array',
                      items: {},
                    },
                  },
                },
              },
            },
          },
        })

        expect(result).toEqual({
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  properties: {
                    // The property name 'file' will be used for all files.
                    file: {
                      type: 'array',
                      items: {},
                    },
                  },
                },
              },
            },
          },
        })
      })
    })
  })
})
