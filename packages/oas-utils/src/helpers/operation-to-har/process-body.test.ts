import { describe, it, expect } from 'vitest'
import { processBody } from './process-body'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

describe('processBody', () => {
  it('should process a simple JSON request body', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                age: { type: 'number' },
              },
            },
          },
        },
      },
    }

    const example = { name: 'John', age: 30 }
    const result = processBody({ operation, example })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify(example),
    })
  })

  it('should handle custom content type', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
          'application/xml': {
            schema: {
              type: 'string',
            },
          },
        },
      },
    }

    const example = '<user><name>John</name></user>'
    const result = processBody({
      operation,
      contentType: 'application/xml',
      example,
    })

    expect(result).toEqual({
      mimeType: 'application/xml',
      text: JSON.stringify(example),
    })
  })

  it('should handle array request body', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    }

    const example = ['item1', 'item2', 'item3']
    const result = processBody({ operation, example })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify(example),
    })
  })

  it('should handle nested object request body', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    address: {
                      type: 'object',
                      properties: {
                        street: { type: 'string' },
                        city: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const example = {
      user: {
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      },
    }
    const result = processBody({ operation, example })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify(example),
    })
  })

  it('should handle primitive type request body', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'string',
            },
          },
        },
      },
    }

    const example = 'Hello, World!'
    const result = processBody({ operation, example })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify(example),
    })
  })

  it('should handle operation without requestBody', () => {
    const operation: OpenAPIV3_1.OperationObject = {}
    const result = processBody({ operation, example: null })

    expect(result).toEqual({
      mimeType: undefined,
      text: 'null',
    })
  })

  it('should handle operation with empty content', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      requestBody: {
        content: {},
      },
    }
    const result = processBody({ operation, example: null })

    expect(result).toEqual({
      mimeType: undefined,
      text: 'null',
    })
  })

  it('should handle binary content type', () => {
    const operation: OpenAPIV3_1.OperationObject = {
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
    }

    const example = 'SGVsbG8gV29ybGQ=' // Base64 encoded "Hello World"
    const result = processBody({
      operation,
      contentType: 'application/octet-stream',
      example,
    })

    expect(result).toEqual({
      mimeType: 'application/octet-stream',
      text: JSON.stringify(example),
    })
  })

  it('should handle multipart form data', () => {
    const operation: OpenAPIV3_1.OperationObject = {
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                },
                name: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    }

    const example = {
      file: 'SGVsbG8gV29ybGQ=', // Base64 encoded file content
      name: 'test.txt',
    }
    const result = processBody({
      operation,
      contentType: 'multipart/form-data',
      example,
    })

    expect(result).toEqual({
      mimeType: 'multipart/form-data',
      text: JSON.stringify(example),
    })
  })

  describe('multipart/form-data', () => {
    it('handles file upload with multiple fields', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                  },
                  description: {
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
      }

      const example = {
        file: 'SGVsbG8gV29ybGQ=', // Base64 encoded "Hello World"
        description: 'Test file upload',
        tags: ['test', 'upload'],
      }

      const result = processBody({
        operation,
        contentType: 'multipart/form-data',
        example,
      })

      expect(result).toEqual({
        mimeType: 'multipart/form-data',
        text: JSON.stringify(example),
      })
    })

    it('handles multiple file uploads', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  files: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
            },
          },
        },
      }

      const example = {
        files: [
          'SGVsbG8gV29ybGQ=', // Base64 encoded "Hello World"
          'VGhpcyBpcyBhIHRlc3Q=', // Base64 encoded "This is a test"
        ],
      }

      const result = processBody({
        operation,
        contentType: 'multipart/form-data',
        example,
      })

      expect(result).toEqual({
        mimeType: 'multipart/form-data',
        text: JSON.stringify(example),
      })
    })
  })

  describe('application/x-www-form-urlencoded', () => {
    it('handles simple form data', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' },
                  remember: { type: 'boolean' },
                },
              },
            },
          },
        },
      }

      const example = {
        username: 'testuser',
        password: 'secret123',
        remember: true,
      }

      const result = processBody({
        operation,
        contentType: 'application/x-www-form-urlencoded',
        example,
      })

      expect(result).toEqual({
        mimeType: 'application/x-www-form-urlencoded',
        text: JSON.stringify(example),
      })
    })

    it('handles form data with arrays', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  categories: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
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
      }

      const example = {
        categories: ['electronics', 'gadgets'],
        tags: ['new', 'featured'],
      }

      const result = processBody({
        operation,
        contentType: 'application/x-www-form-urlencoded',
        example,
      })

      expect(result).toEqual({
        mimeType: 'application/x-www-form-urlencoded',
        text: JSON.stringify(example),
      })
    })
  })

  describe('binary files', () => {
    it('handles image file upload', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        requestBody: {
          content: {
            'image/png': {
              schema: {
                type: 'string',
                format: 'binary',
              },
            },
          },
        },
      }

      // Base64 encoded PNG image data
      const example = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

      const result = processBody({
        operation,
        contentType: 'image/png',
        example,
      })

      expect(result).toEqual({
        mimeType: 'image/png',
        text: JSON.stringify(example),
      })
    })

    it('handles PDF file upload', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        requestBody: {
          content: {
            'application/pdf': {
              schema: {
                type: 'string',
                format: 'binary',
              },
            },
          },
        },
      }

      // Base64 encoded PDF data
      const example =
        'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwog' +
        'IC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAv' +
        'TWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0K' +
        'Pj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAg' +
        'L1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+' +
        'PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9u' +
        'dAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2Jq'

      const result = processBody({
        operation,
        contentType: 'application/pdf',
        example,
      })

      expect(result).toEqual({
        mimeType: 'application/pdf',
        text: JSON.stringify(example),
      })
    })

    it('handles large binary file', () => {
      const operation: OpenAPIV3_1.OperationObject = {
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
      }

      // Create a large binary string (1MB of data)
      const largeBinary = 'A'.repeat(1024 * 1024)
      const example = Buffer.from(largeBinary).toString('base64')

      const result = processBody({
        operation,
        contentType: 'application/octet-stream',
        example,
      })

      expect(result).toEqual({
        mimeType: 'application/octet-stream',
        text: JSON.stringify(example),
      })
    })
  })
})
