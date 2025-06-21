import { describe, it, expect } from 'vitest'
import { processBody } from './process-body'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'
import type { Dereference } from '@scalar/workspace-store/schemas/v3.1/type-guard'

describe('processBody', () => {
  it('extracts example from simple object schema', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'John Doe' },
                age: { type: 'number', example: 30 },
                email: { type: 'string', example: 'john@example.com' },
              },
            },
          },
        },
      },
    }

    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify({
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      }),
    })
  })

  it('extracts example from schema with examples array', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string', examples: ['active', 'inactive'] },
                priority: { type: 'string', examples: ['low', 'medium', 'high'] },
              },
            },
          },
        },
      },
    }

    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify({
        status: 'active',
        priority: 'low',
      }),
    })
  })

  it('extracts nested object examples', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Jane Smith' },
                    profile: {
                      type: 'object',
                      properties: {
                        bio: { type: 'string', example: 'Software developer' },
                        location: { type: 'string', example: 'San Francisco' },
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

    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify({
        user: {
          name: 'Jane Smith',
          profile: {
            bio: 'Software developer',
            location: 'San Francisco',
          },
        },
      }),
    })
  })

  it('extracts array examples', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                tags: {
                  type: 'array',
                  items: {
                    type: 'string',
                    example: 'javascript',
                  },
                },
                categories: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number', example: 1 },
                      name: { type: 'string', example: 'Technology' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify({
        tags: ['javascript'],
        categories: [{ id: 1, name: 'Technology' }],
      }),
    })
  })

  it('extracts primitive type examples', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'string',
              example: 'Hello, World!',
            },
          },
        },
      },
    }

    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify('Hello, World!'),
    })
  })

  it('extracts number examples', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'number',
              example: 42,
            },
          },
        },
      },
    }

    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify(42),
    })
  })

  it('extracts boolean examples', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'boolean',
              example: true,
            },
          },
        },
      },
    }

    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify(true),
    })
  })

  it('handles mixed example types in object', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                stringField: { type: 'string', example: 'test' },
                numberField: { type: 'number', example: 123 },
                booleanField: { type: 'boolean', example: false },
                nullField: { type: 'null', example: null },
              },
            },
          },
        },
      },
    }

    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify({
        stringField: 'test',
        numberField: 123,
        booleanField: false,
        nullField: null,
      }),
    })
  })

  it('handles nested arrays with examples', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                matrix: {
                  type: 'array',
                  items: {
                    type: 'array',
                    items: {
                      type: 'number',
                      example: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify({
        matrix: [[1]],
      }),
    })
  })

  it('handles object with some properties having examples and others not', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Alice' },
                age: { type: 'number' }, // No example
                email: { type: 'string', example: 'alice@example.com' },
                address: { type: 'string' }, // No example
              },
            },
          },
        },
      },
    }

    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify({
        name: 'Alice',
        email: 'alice@example.com',
      }),
    })
  })

  it('handles custom content type with schema examples', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {
          'application/xml': {
            schema: {
              type: 'string',
              example: '<user><name>Bob</name></user>',
            },
          },
        },
      },
    }

    const result = processBody({
      operation,
      contentType: 'application/xml',
    })

    expect(result).toEqual({
      mimeType: 'application/xml',
      text: JSON.stringify('<user><name>Bob</name></user>'),
    })
  })

  it('handles operation without requestBody', () => {
    const operation: Dereference<OperationObject> = {}
    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: undefined,
      text: 'null',
    })
  })

  it('handles operation with empty content', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {},
      },
    }
    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: undefined,
      text: 'null',
    })
  })

  it('handles schema without examples', () => {
    const operation: Dereference<OperationObject> = {
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

    const result = processBody({ operation })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: 'null',
    })
  })

  it('prioritizes external example over schema examples', () => {
    const operation: Dereference<OperationObject> = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Schema Example' },
                age: { type: 'number', example: 25 },
              },
            },
          },
        },
      },
    }

    const externalExample = { name: 'External Example', age: 30 }
    const result = processBody({ operation, example: externalExample })

    expect(result).toEqual({
      mimeType: 'application/json',
      text: JSON.stringify(externalExample),
    })
  })

  describe('multipart/form-data', () => {
    it('extracts examples from form data schema', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    example: 'SGVsbG8gV29ybGQ=',
                  },
                  description: {
                    type: 'string',
                    example: 'Test file upload',
                  },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'string',
                      example: 'document',
                    },
                  },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'multipart/form-data',
      })

      expect(result).toEqual({
        mimeType: 'multipart/form-data',
        params: [
          { name: 'file', value: 'SGVsbG8gV29ybGQ=' },
          { name: 'description', value: 'Test file upload' },
          { name: 'tags', value: 'document' },
        ],
      })
    })

    it('handles file upload with fileName and contentType', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                    examples: [
                      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
                    ],
                  },
                  title: { type: 'string', example: 'My Image' },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'multipart/form-data',
      })

      expect(result).toEqual({
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'image',
            value: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          },
          { name: 'title', value: 'My Image' },
        ],
      })
    })

    it('handles multiple file uploads with examples', () => {
      const operation: Dereference<OperationObject> = {
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
                      example: 'SGVsbG8gV29ybGQ=',
                    },
                  },
                  metadata: {
                    type: 'object',
                    properties: {
                      uploadDate: { type: 'string', example: '2024-01-01' },
                      category: { type: 'string', example: 'images' },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'multipart/form-data',
      })

      expect(result).toEqual({
        mimeType: 'multipart/form-data',
        params: [
          { name: 'files', value: 'SGVsbG8gV29ybGQ=' },
          { name: 'metadata.uploadDate', value: '2024-01-01' },
          { name: 'metadata.category', value: 'images' },
        ],
      })
    })

    it('handles multipart form data with mixed content types', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                    example:
                      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
                  },
                  title: { type: 'string', example: 'My Image' },
                  description: { type: 'string', example: 'A beautiful image' },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'string',
                      examples: ['photo', 'nature', 'landscape'],
                    },
                  },
                  settings: {
                    type: 'object',
                    properties: {
                      public: { type: 'boolean', example: true },
                      quality: { type: 'string', example: 'high' },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'multipart/form-data',
      })

      expect(result).toEqual({
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'image',
            value: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          },
          { name: 'title', value: 'My Image' },
          { name: 'description', value: 'A beautiful image' },
          { name: 'tags', value: 'photo' },
          { name: 'settings.public', value: 'true' },
          { name: 'settings.quality', value: 'high' },
        ],
      })
    })

    it('handles multipart form data without external example', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'multipart/form-data',
      })

      expect(result).toEqual({
        mimeType: 'multipart/form-data',
        text: 'null',
      })
    })

    it('handles multipart form data with array of files', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    examples: ['@mars.jpg', '@jupiter.png'],
                    description: 'Mars rover photo',
                  },
                  name: { type: 'string', example: 'Mars Rover Photo' },
                  category: { type: 'string', example: 'space' },
                  metadata: {
                    type: 'object',
                    properties: {
                      location: { type: 'string', example: 'Mars' },
                      date: { type: 'string', example: '2024-01-15' },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'multipart/form-data',
      })

      expect(result).toEqual({
        mimeType: 'multipart/form-data',
        params: [
          { name: 'file', value: '@mars.jpg' },
          { name: 'name', value: 'Mars Rover Photo' },
          { name: 'category', value: 'space' },
          { name: 'metadata.location', value: 'Mars' },
          { name: 'metadata.date', value: '2024-01-15' },
        ],
      })
    })

    it('handles multipart form data with empty object', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {},
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'multipart/form-data',
      })

      expect(result).toEqual({
        mimeType: 'multipart/form-data',
        text: 'null',
      })
    })

    it('handles multipart form data with primitive values', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string', example: 'Simple text' },
                  number: { type: 'number', example: 42 },
                  boolean: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'multipart/form-data',
      })

      expect(result).toEqual({
        mimeType: 'multipart/form-data',
        params: [
          { name: 'text', value: 'Simple text' },
          { name: 'number', value: '42' },
          { name: 'boolean', value: 'true' },
        ],
      })
    })

    it('handles file upload with comment', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  document: {
                    type: 'string',
                    format: 'binary',
                    description: 'Quarterly financial report',
                    examples: ['base64-encoded-content'],
                  },
                  notes: { type: 'string', example: 'Important document' },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'multipart/form-data',
      })

      expect(result).toEqual({
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'document',
            value: 'base64-encoded-content',
          },
          { name: 'notes', value: 'Important document' },
        ],
      })
    })
  })

  describe('application/x-www-form-urlencoded', () => {
    it('extracts examples from form data schema', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'testuser' },
                  password: { type: 'string', example: 'secret123' },
                  remember: { type: 'boolean', example: true },
                  role: { type: 'string', examples: ['user', 'admin'] },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'application/x-www-form-urlencoded',
      })

      expect(result).toEqual({
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'username', value: 'testuser' },
          { name: 'password', value: 'secret123' },
          { name: 'remember', value: 'true' },
          { name: 'role', value: 'user' },
        ],
      })
    })

    it('handles form data with array examples', () => {
      const operation: Dereference<OperationObject> = {
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
                      example: 'electronics',
                    },
                  },
                  preferences: {
                    type: 'object',
                    properties: {
                      theme: { type: 'string', example: 'dark' },
                      language: { type: 'string', example: 'en' },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'application/x-www-form-urlencoded',
      })

      expect(result).toEqual({
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'categories', value: 'electronics' },
          { name: 'preferences.theme', value: 'dark' },
          { name: 'preferences.language', value: 'en' },
        ],
      })
    })

    it('handles form data with multiple array items', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  tags: {
                    type: 'array',
                    items: {
                      type: 'string',
                      examples: ['javascript', 'typescript', 'react'],
                    },
                  },
                  numbers: {
                    type: 'array',
                    items: {
                      type: 'number',
                      example: 42,
                    },
                  },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'application/x-www-form-urlencoded',
      })

      expect(result).toEqual({
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'tags', value: 'javascript' },
          { name: 'numbers', value: '42' },
        ],
      })
    })

    it('handles deeply nested objects in form data', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      profile: {
                        type: 'object',
                        properties: {
                          personal: {
                            type: 'object',
                            properties: {
                              firstName: { type: 'string', example: 'John' },
                              lastName: { type: 'string', example: 'Doe' },
                            },
                          },
                          contact: {
                            type: 'object',
                            properties: {
                              email: { type: 'string', example: 'john@example.com' },
                              phone: { type: 'string', example: '+1234567890' },
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
      }

      const result = processBody({
        operation,
        contentType: 'application/x-www-form-urlencoded',
      })

      expect(result).toEqual({
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'user.profile.personal.firstName', value: 'John' },
          { name: 'user.profile.personal.lastName', value: 'Doe' },
          { name: 'user.profile.contact.email', value: 'john@example.com' },
          { name: 'user.profile.contact.phone', value: '+1234567890' },
        ],
      })
    })

    it('handles form data with mixed primitive types', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  stringField: { type: 'string', example: 'hello world' },
                  numberField: { type: 'number', example: 123.45 },
                  integerField: { type: 'integer', example: 42 },
                  booleanField: { type: 'boolean', example: false },
                  nullField: { type: 'null', example: null },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'application/x-www-form-urlencoded',
      })

      expect(result).toEqual({
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'stringField', value: 'hello world' },
          { name: 'numberField', value: '123.45' },
          { name: 'integerField', value: '42' },
          { name: 'booleanField', value: 'false' },
        ],
      })
    })

    it('handles form data with external example', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Schema Example' },
                  age: { type: 'number', example: 25 },
                },
              },
            },
          },
        },
      }

      const externalExample = {
        name: 'External Example',
        age: 30,
        extra: 'additional field',
        nested: {
          key: 'value',
        },
      }

      const result = processBody({
        operation,
        contentType: 'application/x-www-form-urlencoded',
        example: externalExample,
      })

      expect(result).toEqual({
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'name', value: 'External Example' },
          { name: 'age', value: '30' },
          { name: 'extra', value: 'additional field' },
          { name: 'nested.key', value: 'value' },
        ],
      })
    })

    it('handles form data with empty object', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {},
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'application/x-www-form-urlencoded',
      })

      expect(result).toEqual({
        mimeType: 'application/x-www-form-urlencoded',
        text: 'null',
      })
    })

    it('handles form data with properties without examples', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John' },
                  age: { type: 'number' }, // No example
                  email: { type: 'string', example: 'john@example.com' },
                  address: { type: 'string' }, // No example
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'application/x-www-form-urlencoded',
      })

      expect(result).toEqual({
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'name', value: 'John' },
          { name: 'email', value: 'john@example.com' },
        ],
      })
    })

    it('handles nested form data', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      firstName: { type: 'string', example: 'John' },
                      lastName: { type: 'string', example: 'Doe' },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'application/x-www-form-urlencoded',
      })

      expect(result).toEqual({
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'user.firstName', value: 'John' },
          { name: 'user.lastName', value: 'Doe' },
        ],
      })
    })
  })

  describe('binary files', () => {
    it('extracts binary file examples', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'image/png': {
              schema: {
                type: 'string',
                format: 'binary',
                example:
                  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'image/png',
      })

      expect(result).toEqual({
        mimeType: 'image/png',
        text: JSON.stringify(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        ),
      })
    })

    it('handles PDF file with example', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'application/pdf': {
              schema: {
                type: 'string',
                format: 'binary',
                example:
                  'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2Jq',
              },
            },
          },
        },
      }

      const result = processBody({
        operation,
        contentType: 'application/pdf',
      })

      expect(result).toEqual({
        mimeType: 'application/pdf',
        text: JSON.stringify(
          'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2Jq',
        ),
      })
    })
  })

  describe('complex nested structures', () => {
    it('handles deeply nested objects with examples', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  company: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'Tech Corp' },
                      departments: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string', example: 'Engineering' },
                            employees: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  id: { type: 'number', example: 1 },
                                  name: { type: 'string', example: 'John Doe' },
                                  skills: {
                                    type: 'array',
                                    items: {
                                      type: 'string',
                                      example: 'JavaScript',
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
              },
            },
          },
        },
      }

      const result = processBody({ operation })

      expect(result).toEqual({
        mimeType: 'application/json',
        text: JSON.stringify({
          company: {
            name: 'Tech Corp',
            departments: [
              {
                name: 'Engineering',
                employees: [
                  {
                    id: 1,
                    name: 'John Doe',
                    skills: ['JavaScript'],
                  },
                ],
              },
            ],
          },
        }),
      })
    })

    it('handles mixed example and examples properties', () => {
      const operation: Dereference<OperationObject> = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'Alice' },
                      status: { type: 'string', examples: ['active', 'inactive'] },
                      preferences: {
                        type: 'object',
                        properties: {
                          theme: { type: 'string', example: 'dark' },
                          notifications: { type: 'boolean', examples: [true, false] },
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

      const result = processBody({ operation })

      expect(result).toEqual({
        mimeType: 'application/json',
        text: JSON.stringify({
          user: {
            name: 'Alice',
            status: 'active',
            preferences: {
              theme: 'dark',
              notifications: true,
            },
          },
        }),
      })
    })
  })
})
