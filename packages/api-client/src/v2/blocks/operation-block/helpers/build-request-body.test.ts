import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { RequestBodyObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { buildRequestBody } from './build-request-body'

describe('buildRequestBody', () => {
  it('returns null when requestBody is undefined', () => {
    const result = buildRequestBody(undefined, 'default', 'application/json')
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
    const result = buildRequestBody(requestBody, 'default', 'application/json')
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
    const env = { username: 'john_doe', userId: '12345' }
    const result = buildRequestBody(requestBody, 'default', 'application/json', env)
    expect(result).toBe('{"name": "john_doe", "id": "12345"}')
  })

  it('returns object body as-is when example value is not a string', () => {
    const exampleValue = { name: 'test', id: 123 }
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
    const result = buildRequestBody(requestBody, 'default', 'application/json')
    expect(result).toBe(exampleValue)
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
    const env = { user: 'john_doe' }
    const result = buildRequestBody(requestBody, 'default', 'multipart/form-data', env)

    expect(result).toBeInstanceOf(FormData)
    const formData = result as FormData
    expect(formData.get('username')).toBe('john_doe')
    expect(formData.get('email')).toBe('test@example.com')
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
    const env = { var1: 'dynamic_value' }
    const result = buildRequestBody(requestBody, 'default', 'application/x-www-form-urlencoded', env)

    expect(result).toBeInstanceOf(URLSearchParams)
    const params = result as URLSearchParams
    expect(params.get('field1')).toBe('dynamic_value')
    expect(params.get('field2')).toBe('static_value')
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
    const result = buildRequestBody(requestBody, 'default', 'multipart/form-data')

    expect(result).toBeInstanceOf(FormData)
    const formData = result as FormData
    expect(formData.get('file')).toBe(mockFile)
    expect(formData.get('description')).toBe('Test file')
  })

  it('skips form entries with empty names and replaces environment variables in field names', () => {
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
    const env = { fieldName: 'dynamic_field', envValue: 'replaced_value' }
    const result = buildRequestBody(requestBody, 'default', 'multipart/form-data', env)

    expect(result).toBeInstanceOf(FormData)
    const formData = result as FormData
    // Empty name should be skipped
    expect(formData.has('')).toBe(false)
    // Environment variable in field name should be replaced
    expect(formData.get('dynamic_field')).toBe('test_value')
    // Environment variable in value should be replaced
    expect(formData.get('normal_field')).toBe('replaced_value')
  })
})
