import { requestSchema } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { useParameters } from './useParameters'

describe('useParameters', () => {
  it('maps path parameters', () => {
    const operation = requestSchema.parse({
      path: '/example/{id}',
      method: 'get',
      parameters: [
        { name: 'id', in: 'path', required: true },
        { name: 'userId', in: 'path', required: true },
      ],
    })

    const { parameterMap } = useParameters(operation)

    expect(parameterMap.value.path).toHaveLength(2)
    expect(parameterMap.value.path?.[0].name).toBe('id')
    expect(parameterMap.value.path?.[1].name).toBe('userId')
  })

  it('maps query parameters', () => {
    const operation = requestSchema.parse({
      path: '/example',
      method: 'get',
      parameters: [
        { name: 'filter', in: 'query' },
        { name: 'sort', in: 'query' },
      ],
    })

    const { parameterMap } = useParameters(operation)

    expect(parameterMap.value.query).toHaveLength(2)
    expect(parameterMap.value.query?.[0].name).toBe('filter')
    expect(parameterMap.value.query?.[1].name).toBe('sort')
  })

  it('maps header parameters', () => {
    const operation = requestSchema.parse({
      path: '/example',
      method: 'get',
      parameters: [
        { name: 'Authorization', in: 'header' },
        { name: 'X-API-Key', in: 'header' },
      ],
    })

    const { parameterMap } = useParameters(operation)

    expect(parameterMap.value.header).toHaveLength(2)
    expect(parameterMap.value.header?.[0].name).toBe('Authorization')
    expect(parameterMap.value.header?.[1].name).toBe('X-API-Key')
  })

  it('maps body parameters', () => {
    const operation = requestSchema.parse({
      path: '/example',
      method: 'post',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                payload: { type: 'string' },
              },
              required: ['payload'],
            },
          },
        },
      },
    })

    const { parameterMap } = useParameters(operation)

    expect(parameterMap.value.body).toHaveLength(1)
    expect(parameterMap.value.body[0].name).toBe('payload')
  })

  it('handles empty parameters', () => {
    const operation = requestSchema.parse({
      path: '/example',
      method: 'get',
    })

    const { parameterMap } = useParameters(operation)

    expect(parameterMap.value.path).toHaveLength(0)
    expect(parameterMap.value.query).toHaveLength(0)
    expect(parameterMap.value.header).toHaveLength(0)
    expect(parameterMap.value.body).toHaveLength(0)
  })

  it('combines parameters from the operation and the path', () => {
    // TODO: How do I pass those path level parameters?
    //   pathParameters: [{ name: 'id', in: 'path' }],

    const operation = requestSchema.parse({
      path: '/example/{id}',
      method: 'get',
      parameters: [{ name: 'userId', in: 'path' }],
    })

    const { parameterMap } = useParameters(operation)

    expect(parameterMap.value.path).toHaveLength(2)
    expect(parameterMap.value.path?.[0].name).toBe('id')
    expect(parameterMap.value.path?.[1].name).toBe('userId')
  })

  it('maps formData parameters', () => {
    const operation = requestSchema.parse({
      path: '/example',
      method: 'post',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: { type: 'string', format: 'binary' },
                description: { type: 'string' },
              },
              required: ['file'],
            },
          },
        },
      },
    })

    const { parameterMap } = useParameters(operation)

    expect(parameterMap.value.formData).toHaveLength(2)
    expect(parameterMap.value.formData?.[0].name).toBe('file')
    expect(parameterMap.value.formData?.[1].name).toBe('description')
  })
})
