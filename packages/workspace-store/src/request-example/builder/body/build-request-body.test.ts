import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { RequestBodyObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { assert, describe, expect, it } from 'vitest'

import { buildRequestBody } from './build-request-body'

describe('buildRequestBody', () => {
  it('returns null when requestBody is undefined', () => {
    const result = buildRequestBody(undefined, 'default')
    expect(result).toBe(null)
  })

  it('returns null when no example value exists', () => {
    const requestBody = coerceValue(RequestBodyObjectSchema, {
      content: {
        'application/json': {
          schema: {},
        },
      },
    })
    const result = buildRequestBody(requestBody, 'default')
    expect(result).toBe(null)
  })

  it('returns string body with environment variables replaced for JSON content', () => {
    const requestBody = {
      content: {
        'application/json': {
          examples: {
            default: {
              value: '{"name": "{{username}}", "id": "{{userId}}"}',
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')
    expect(result).toEqual({
      mode: 'raw',
      value: '{"name": "{{username}}", "id": "{{userId}}"}',
    })
  })

  it('uses requestBodyCompositionSelection when building a generated JSON body', () => {
    const requestBody = coerceValue(RequestBodyObjectSchema, {
      content: {
        'application/json': {
          schema: {
            anyOf: [
              {
                type: 'object',
                properties: {
                  source: { type: 'string', default: 'file' },
                },
              },
              {
                type: 'object',
                properties: {
                  source: { type: 'string', default: 'service' },
                },
              },
            ],
          },
        },
      },
    })

    const result = buildRequestBody(requestBody, 'default', {
      'requestBody.anyOf': 1,
    })

    expect(result).toEqual({
      contentType: 'application/json',
      mode: 'raw',
      value: '{\"source\":\"service\"}',
    })
  })

  it('builds FormData for multipart/form-data content type', () => {
    const requestBody = {
      content: {
        'multipart/form-data': {
          examples: {
            default: {
              value: [
                { name: 'username', value: '{{user}}' },
                { name: 'email', value: 'test@example.com' },
              ],
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')

    expect(result).toEqual({
      mode: 'formdata',
      value: [
        { type: 'text', key: 'username', value: '{{user}}' },
        { type: 'text', key: 'email', value: 'test@example.com' },
      ],
    })
  })

  it('applies encoding.contentType to multipart string parts', () => {
    const requestBody = {
      content: {
        'multipart/form-data': {
          encoding: {
            user: {
              contentType: 'application/json;charset=utf-8',
            },
          },
          examples: {
            default: {
              value: [{ name: 'user', value: '{"name":"{{username}}"}' }],
            },
          },
        },
      },
    }

    const result = buildRequestBody(requestBody, 'default')

    expect(result?.mode).toBe('formdata')
    assert(result?.mode === 'formdata')

    expect(result?.value?.[0]).toBeDefined()
    assert(result?.value?.[0])
    expect(result.value[0].value).toBeInstanceOf(Blob)
    assert(result.value[0].value instanceof Blob)
    expect(result.value[0].value.type).toBe('application/json;charset=utf-8')
  })

  it('applies encoding.contentType overrides to multipart files', () => {
    const mockFile = new File(['file content'], 'test.txt', { type: 'text/plain', lastModified: 123 })
    const requestBody = {
      content: {
        'multipart/form-data': {
          encoding: {
            file: {
              contentType: 'application/json',
            },
          },
          examples: {
            default: {
              value: [{ name: 'file', value: mockFile }],
            },
          },
        },
      },
    }

    const result = buildRequestBody(requestBody, 'default')

    expect(result?.mode).toBe('formdata')
    assert(result?.mode === 'formdata')

    expect(result?.value?.[0]).toBeDefined()
    assert(result?.value?.[0])
    expect(result.value[0].value).toBeInstanceOf(File)
    assert(result.value[0].value instanceof File)
    expect(result.value[0].value.type).toBe('application/json')
  })

  it('builds URLSearchParams for application/x-www-form-urlencoded content type', () => {
    const requestBody = {
      content: {
        'application/x-www-form-urlencoded': {
          examples: {
            default: {
              value: [
                { name: 'field1', value: '{{var1}}' },
                { name: 'field2', value: 'static_value' },
              ],
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')

    expect(result?.mode).toBe('urlencoded')
    assert(result?.mode === 'urlencoded')

    expect(result?.value?.[0]).toBeDefined()
    assert(result?.value?.[0])
    expect(result.value[0].key).toBe('field1')
    expect(result.value[0].value).toBe('{{var1}}')
    assert(result.value[1])
    expect(result.value[1].key).toBe('field2')
    expect(result.value[1].value).toBe('static_value')
  })

  it('builds URLSearchParams for application/x-www-form-urlencoded with object example value', () => {
    // This tests the case where the example value is a plain object (from schema)
    // rather than the array format (from UI editor)
    const requestBody = {
      content: {
        'application/x-www-form-urlencoded': {
          examples: {
            default: {
              value: {
                ac: '4',
                product_id: '{{productId}}',
              },
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')

    expect(result?.mode).toBe('urlencoded')
    assert(result?.mode === 'urlencoded')

    expect(result?.value?.[0]).toBeDefined()
    assert(result?.value?.[0])
    expect(result.value[0].key).toBe('ac')
    expect(result.value[0].value).toBe('4')
    assert(result.value[1])
    expect(result.value[1].key).toBe('product_id')
    expect(result.value[1].value).toBe('{{productId}}')
  })

  it('converts non-string values to strings in form-urlencoded object format', () => {
    const requestBody = {
      content: {
        'application/x-www-form-urlencoded': {
          examples: {
            default: {
              value: {
                count: 42,
                active: true,
                name: 'test',
              },
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')

    expect(result?.mode).toBe('urlencoded')
    assert(result?.mode === 'urlencoded')

    expect(result?.value?.[0]).toBeDefined()
    assert(result?.value?.[0])
    expect(result.value[0].key).toBe('count')
    expect(result.value[0].value).toBe('42')
    assert(result.value[1])
    expect(result.value[1].key).toBe('active')
    expect(result.value[1].value).toBe('true')
    assert(result.value[2])
    expect(result.value[2].key).toBe('name')
    expect(result.value[2].value).toBe('test')
  })

  it('skips null and undefined values in form-urlencoded object format', () => {
    const requestBody = {
      content: {
        'application/x-www-form-urlencoded': {
          examples: {
            default: {
              value: {
                valid: 'value',
                nullField: null,
                undefinedField: undefined,
              },
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')

    expect(result?.mode).toBe('urlencoded')
    assert(result?.mode === 'urlencoded')

    expect(result.value.length).toBe(1)
    expect(result?.value?.[0]).toBeDefined()
    assert(result?.value?.[0])
    expect(result.value[0].key).toBe('valid')
    expect(result.value[0].value).toBe('value')
  })

  it('handles File objects in FormData for multipart/form-data', () => {
    const mockFile = new File(['file content'], 'test.txt', { type: 'text/plain' })
    const requestBody = {
      content: {
        'multipart/form-data': {
          examples: {
            default: {
              value: [
                { name: 'file', value: mockFile },
                { name: 'description', value: 'Test file' },
              ],
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')

    expect(result?.mode).toBe('formdata')
    assert(result?.mode === 'formdata')

    expect(result?.value?.[0]).toBeDefined()
    assert(result?.value?.[0])
    expect(result.value[0].key).toBe('file')
    expect(result.value[0].value).toBe(mockFile)
    assert(result.value[1])
    expect(result.value[1].key).toBe('description')
    expect(result.value[1].value).toBe('Test file')
  })

  it('returns File bodies for raw binary request examples', () => {
    const mockFile = new File(['binary content'], 'payload.bin', { type: 'application/octet-stream' })
    const requestBody = {
      content: {
        'application/octet-stream': {
          examples: {
            default: {
              value: mockFile,
            },
          },
        },
      },
    }

    const result = buildRequestBody(requestBody, 'default')

    expect(result?.mode).toBe('raw')
    assert(result?.mode === 'raw')

    expect(result?.value).toBe(mockFile)
    assert(result?.value === mockFile)
  })

  it('skips form entries with empty names', () => {
    const requestBody = {
      content: {
        'multipart/form-data': {
          examples: {
            default: {
              value: [
                { name: '', value: 'should_be_skipped' },
                { name: '{{fieldName}}', value: 'test_value' },
                { name: 'normal_field', value: '{{envValue}}' },
              ],
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')

    expect(result?.mode).toBe('formdata')
    assert(result?.mode === 'formdata')

    expect(result?.value.length).toBe(2)
    expect(result?.value?.[0]).toBeDefined()
    assert(result?.value?.[0])
    expect(result.value[0].key).toBe('{{fieldName}}')
    expect(result.value[0].value).toBe('test_value')
    assert(result.value[1])
    expect(result.value[1].key).toBe('normal_field')
    expect(result.value[1].value).toBe('{{envValue}}')
  })

  it('returns nested object body as-is when example value is a complex object', () => {
    const exampleValue = {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      },
      metadata: {
        timestamp: 1234567890,
        version: '1.0',
      },
    }
    const requestBody = {
      content: {
        'application/json': {
          examples: {
            default: {
              value: exampleValue,
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')
    expect(result?.mode).toBe('raw')
    assert(result?.mode === 'raw')
    expect(result?.value).toBe(JSON.stringify(exampleValue))
    assert(result?.value === JSON.stringify(exampleValue))
  })

  it('returns array of objects stringified when example value is an array', () => {
    const exampleValue = [
      { id: 1, name: 'Item 1', active: true },
      { id: 2, name: 'Item 2', active: false },
      { id: 3, name: 'Item 3', active: true },
    ]
    const requestBody = {
      content: {
        'application/json': {
          examples: {
            default: {
              value: exampleValue,
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')
    expect(result?.mode).toBe('raw')
    assert(result?.mode === 'raw')
    expect(result?.value).toBe(JSON.stringify(exampleValue))
    assert(result?.value === JSON.stringify(exampleValue))
  })

  it('uses x-scalar-selected-content-type when specified', () => {
    const requestBody = {
      'x-scalar-selected-content-type': {
        default: 'application/xml',
      },
      content: {
        'application/json': {
          examples: {
            default: {
              value: '{"name": "json"}',
            },
          },
        },
        'application/xml': {
          examples: {
            default: {
              value: '<name>xml</name>',
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')
    expect(result?.mode).toBe('raw')
    assert(result?.mode === 'raw')
    expect(result?.value).toBe('<name>xml</name>')
    assert(result?.value === '<name>xml</name>')
  })

  it('falls back to first content type when x-scalar-selected-content-type is not set', () => {
    const requestBody = {
      content: {
        'application/xml': {
          examples: {
            default: {
              value: '<name>xml</name>',
            },
          },
        },
        'application/json': {
          examples: {
            default: {
              value: '{"name": "json"}',
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')
    expect(result?.mode).toBe('raw')
    assert(result?.mode === 'raw')
    expect(result?.value).toBe('<name>xml</name>')
    assert(result?.value === '<name>xml</name>')
  })

  it('handles primitive number JSON values correctly', () => {
    const requestBody = {
      content: {
        'application/json': {
          examples: {
            default: {
              value: '42',
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')
    expect(result?.mode).toBe('raw')
    assert(result?.mode === 'raw')
    expect(result?.value).toBe('42')
    assert(result?.value === '42')
    expect(typeof result?.value).toBe('string')
  })

  it('handles primitive boolean JSON values correctly', () => {
    const requestBody = {
      content: {
        'application/json': {
          examples: {
            default: {
              value: 'true',
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')
    expect(result?.mode).toBe('raw')
    assert(result?.mode === 'raw')
    expect(result?.value).toBe('true')
    assert(result?.value === 'true')
    expect(typeof result?.value).toBe('string')
  })

  it('handles primitive null JSON values correctly', () => {
    const requestBody = {
      content: {
        'application/json': {
          examples: {
            default: {
              value: 'null',
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')
    expect(result?.mode).toBe('raw')
    assert(result?.mode === 'raw')
    expect(result?.value).toBe('null')
    assert(result?.value === 'null')
    expect(typeof result?.value).toBe('string')
  })
})
