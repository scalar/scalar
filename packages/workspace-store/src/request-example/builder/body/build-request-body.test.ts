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

  describe('encoding style/explode', () => {
    it('breaks a multipart object into deepObject bracket-notation parts', () => {
      const requestBody = {
        content: {
          'multipart/form-data': {
            encoding: {
              address: { style: 'deepObject' as const, explode: true },
            },
            examples: {
              default: {
                value: { address: { street: 'Main', city: 'Berlin' } },
              },
            },
          },
        },
      }

      const result = buildRequestBody(requestBody, 'default')

      expect(result).toEqual({
        mode: 'formdata',
        value: [
          { type: 'text', key: 'address[street]', value: 'Main' },
          { type: 'text', key: 'address[city]', value: 'Berlin' },
        ],
      })
    })

    it('explodes a multipart object into one part per property under style: form', () => {
      const requestBody = {
        content: {
          'multipart/form-data': {
            encoding: {
              address: { style: 'form' as const, explode: true },
            },
            examples: {
              default: {
                value: { address: { street: 'Main', city: 'Berlin' } },
              },
            },
          },
        },
      }

      const result = buildRequestBody(requestBody, 'default')

      expect(result).toEqual({
        mode: 'formdata',
        value: [
          { type: 'text', key: 'street', value: 'Main' },
          { type: 'text', key: 'city', value: 'Berlin' },
        ],
      })
    })

    it('regroups dotted UI rows then serializes them with bracket notation', () => {
      const requestBody = coerceValue(RequestBodyObjectSchema, {
        content: {
          'multipart/form-data': {
            encoding: {
              address: { style: 'deepObject', explode: true },
            },
            schema: {
              type: 'object',
              properties: {
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                  },
                },
              },
            },
            examples: {
              default: {
                value: [
                  { name: 'address.street', value: 'Main' },
                  { name: 'address.city', value: 'Berlin' },
                ],
              },
            },
          },
        },
      })

      const result = buildRequestBody(requestBody, 'default')

      expect(result).toEqual({
        mode: 'formdata',
        value: [
          { type: 'text', key: 'address[street]', value: 'Main' },
          { type: 'text', key: 'address[city]', value: 'Berlin' },
        ],
      })
    })

    it('ignores encoding.contentType when a style is set', () => {
      const requestBody = {
        content: {
          'multipart/form-data': {
            encoding: {
              address: { style: 'form' as const, explode: true, contentType: 'application/json' },
            },
            examples: {
              default: {
                value: { address: { city: 'Berlin' } },
              },
            },
          },
        },
      }

      const result = buildRequestBody(requestBody, 'default')

      expect(result).toEqual({
        mode: 'formdata',
        value: [{ type: 'text', key: 'city', value: 'Berlin' }],
      })
    })

    it('serializes urlencoded objects with bracket notation under style: deepObject', () => {
      const requestBody = {
        content: {
          'application/x-www-form-urlencoded': {
            encoding: {
              filter: { style: 'deepObject' as const, explode: true },
            },
            examples: {
              default: {
                value: { filter: { status: 'active', role: 'admin' } },
              },
            },
          },
        },
      }

      const result = buildRequestBody(requestBody, 'default')

      expect(result).toEqual({
        mode: 'urlencoded',
        value: [
          { key: 'filter[status]', value: 'active' },
          { key: 'filter[role]', value: 'admin' },
        ],
      })
    })

    it('drops a styled empty object instead of emitting an empty part', () => {
      const requestBody = {
        content: {
          'multipart/form-data': {
            encoding: {
              address: { style: 'form' as const, explode: true },
            },
            examples: {
              default: {
                value: { address: {} },
              },
            },
          },
        },
      }

      const result = buildRequestBody(requestBody, 'default')

      expect(result).toEqual({ mode: 'formdata', value: [] })
    })

    it('keeps JSON-stringifying multipart objects without an encoding style', () => {
      const requestBody = {
        content: {
          'multipart/form-data': {
            examples: {
              default: {
                value: { address: { city: 'Berlin' } },
              },
            },
          },
        },
      }

      const result = buildRequestBody(requestBody, 'default')

      expect(result).toEqual({
        mode: 'formdata',
        value: [{ type: 'text', key: 'address', value: '{"city":"Berlin"}' }],
      })
    })
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

  it('JSON-stringifies nested object and array values in form-urlencoded object format', () => {
    const requestBody = {
      content: {
        'application/x-www-form-urlencoded': {
          examples: {
            default: {
              value: {
                tags: ['a', 'b'],
                meta: { foo: 'bar' },
              },
            },
          },
        },
      },
    }
    const result = buildRequestBody(requestBody, 'default')

    expect(result?.mode).toBe('urlencoded')
    assert(result?.mode === 'urlencoded')

    assert(result.value[0])
    expect(result.value[0].key).toBe('tags')
    expect(result.value[0].value).toBe('["a","b"]')
    assert(result.value[1])
    expect(result.value[1].key).toBe('meta')
    expect(result.value[1].value).toBe('{"foo":"bar"}')
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

  it('builds FormData for schema-generated multipart/form-data object examples', () => {
    const requestBody = coerceValue(RequestBodyObjectSchema, {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              image: {
                type: 'string',
                format: 'binary',
              },
              description: {
                type: 'string',
                default: 'An image upload',
              },
            },
            required: ['image'],
          },
        },
      },
    })

    const result = buildRequestBody(requestBody, 'default')

    expect(result?.mode).toBe('formdata')
    assert(result?.mode === 'formdata')

    expect(result.value).toStrictEqual([
      {
        type: 'text',
        key: 'image',
        value: '@filename',
      },
      {
        type: 'text',
        key: 'description',
        value: 'An image upload',
      },
    ])
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

  it('returns raw File for multipart/form-data when example value is a File instance', () => {
    const mockFile = new File(['binary content'], 'payload.bin', { type: 'application/octet-stream' })
    const requestBody = {
      content: {
        'multipart/form-data': {
          examples: {
            default: {
              value: mockFile,
            },
          },
        },
      },
    }

    const result = buildRequestBody(requestBody, 'default')

    expect(result).toStrictEqual({
      mode: 'raw',
      value: mockFile,
      contentType: 'application/octet-stream',
    })
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

  it('regroups dotted multipart rows back into a single JSON-stringified text part', () => {
    const requestBody = coerceValue(RequestBodyObjectSchema, {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              props: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  created_at: { type: 'string' },
                  note: { type: 'string' },
                },
              },
            },
          },
          examples: {
            default: {
              value: [
                { name: 'file', value: '@filename' },
                { name: 'props.name', value: 'Widget' },
                { name: 'props.description', value: 'A useful widget' },
                { name: 'props.created_at', value: '2026-01-02T03:04:05Z' },
                { name: 'props.note', value: 'ignored', isDisabled: true },
              ],
            },
          },
        },
      },
    })

    const result = buildRequestBody(requestBody, 'default')
    expect(result?.mode).toBe('formdata')
    assert(result?.mode === 'formdata')

    // The wire sends one `props` part (not three `props.*` parts), so the wire shape is
    // consistent between the initial schema-derived example and edited form rows. The
    // part is plain text because browser FormData adds a `filename="blob"` header to
    // every Blob, which generic multipart parsers then misinterpret as a file upload.
    expect(result.value).toEqual([
      { type: 'text', key: 'file', value: '@filename' },
      {
        type: 'text',
        key: 'props',
        value: JSON.stringify({
          name: 'Widget',
          description: 'A useful widget',
          created_at: '2026-01-02T03:04:05Z',
        }),
      },
    ])
  })

  it('emits the regrouped multipart object at the position of its first dotted row', () => {
    const requestBody = coerceValue(RequestBodyObjectSchema, {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              before: { type: 'string' },
              middle: { type: 'string' },
              after: { type: 'string' },
              props: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
          examples: {
            default: {
              value: [
                { name: 'before', value: 'first' },
                { name: 'props.name', value: 'Widget' },
                { name: 'middle', value: 'second' },
                { name: 'props.description', value: 'A useful widget' },
                { name: 'after', value: 'third' },
              ],
            },
          },
        },
      },
    })

    const result = buildRequestBody(requestBody, 'default')
    expect(result?.mode).toBe('formdata')
    assert(result?.mode === 'formdata')

    // The regrouped `props` part stays where the user placed its first dotted row,
    // so flat rows around it keep their relative order.
    expect(result.value).toEqual([
      { type: 'text', key: 'before', value: 'first' },
      {
        type: 'text',
        key: 'props',
        value: JSON.stringify({ name: 'Widget', description: 'A useful widget' }),
      },
      { type: 'text', key: 'middle', value: 'second' },
      { type: 'text', key: 'after', value: 'third' },
    ])
  })

  it('keeps a flat multipart row whose name happens to contain dots (filename)', () => {
    const requestBody = {
      content: {
        'multipart/form-data': {
          examples: {
            default: {
              value: [
                {
                  name: 'scalar.jpeg',
                  value: new File(['scalar'], 'scalar.jpeg', { type: 'image/jpeg' }),
                },
                { name: 'caption', value: 'logo' },
              ],
            },
          },
        },
      },
    }

    const result = buildRequestBody(requestBody, 'default')
    expect(result?.mode).toBe('formdata')
    assert(result?.mode === 'formdata')

    expect(result.value).toHaveLength(2)
    expect(result.value[0]?.type).toBe('file')
    expect(result.value[0]?.key).toBe('scalar.jpeg')
    expect(result.value[1]).toEqual({ type: 'text', key: 'caption', value: 'logo' })
  })

  it('keeps non-File multipart rows whose names contain literal dots when the schema does not declare them as nested objects', () => {
    const requestBody = {
      content: {
        'multipart/form-data': {
          examples: {
            default: {
              value: [
                { name: 'user.email', value: 'foo@bar.com' },
                { name: 'config.json', value: '{"k":1}' },
                { name: 'image.url', value: 'https://example.com/a.png' },
              ],
            },
          },
        },
      },
    }

    const result = buildRequestBody(requestBody, 'default')
    expect(result?.mode).toBe('formdata')
    assert(result?.mode === 'formdata')

    // Without a schema declaring `user`/`config`/`image` as nested object properties,
    // these names are literal and must be sent as-is — not folded into nested objects.
    expect(result.value).toEqual([
      { type: 'text', key: 'user.email', value: 'foo@bar.com' },
      { type: 'text', key: 'config.json', value: '{"k":1}' },
      { type: 'text', key: 'image.url', value: 'https://example.com/a.png' },
    ])
  })

  it('keeps multipart rows with literal dots flat when the schema declares the dotted name as a top-level property', () => {
    const requestBody = coerceValue(RequestBodyObjectSchema, {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              'user.email': { type: 'string' },
              caption: { type: 'string' },
            },
          },
          examples: {
            default: {
              value: [
                { name: 'user.email', value: 'foo@bar.com' },
                { name: 'caption', value: 'profile' },
              ],
            },
          },
        },
      },
    })

    const result = buildRequestBody(requestBody, 'default')
    expect(result?.mode).toBe('formdata')
    assert(result?.mode === 'formdata')

    expect(result.value).toEqual([
      { type: 'text', key: 'user.email', value: 'foo@bar.com' },
      { type: 'text', key: 'caption', value: 'profile' },
    ])
  })
})
