import type { Context } from 'hono'
import { describe, expect, it } from 'vitest'

import { createMockContext } from '../../test/utils/create-mock-context'
import { getBody } from './get-body'

describe('get-body', () => {
  it('parses JSON body when content is valid JSON', async () => {
    const mockContext = createMockContext({
      requestHeaders: { 'Content-Type': 'application/json' },
      requestBody: '{"name": "John", "age": 30}',
    })

    const result = await getBody(mockContext as unknown as Context)

    expect(result).toEqual({ name: 'John', age: 30 })
  })

  it('returns plain text when body is not valid JSON', async () => {
    const mockContext = createMockContext({
      requestHeaders: { 'Content-Type': 'text/plain' },
      requestBody: 'Hello, World!',
    })

    const result = await getBody(mockContext as unknown as Context)

    expect(result).toBe('Hello, World!')
  })

  it('parses form data when content-type is application/x-www-form-urlencoded', async () => {
    const mockContext = createMockContext({
      requestHeaders: { 'Content-Type': 'application/x-www-form-urlencoded' },
      formData: { username: 'john', password: 'secret' },
    })

    const result = await getBody(mockContext as unknown as Context)

    expect(result).toEqual({ username: 'john', password: 'secret' })
  })
})
