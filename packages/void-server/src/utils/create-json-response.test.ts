import { createMockContext } from '@test/utils/create-mock-context'
import { describe, expect, it } from 'vitest'

import { createJsonResponse } from '@/utils/create-json-response'

describe('create-json-response', () => {
  it('calls c.json with the provided data', () => {
    const mockContext = createMockContext()
    const data = { foo: 'bar' }

    createJsonResponse(mockContext as any, data)

    expect(mockContext.json).toHaveBeenCalledWith(data)
  })

  it('returns the result of c.json', () => {
    const mockContext = createMockContext()
    const data = { name: 'John', age: 30 }

    const result = createJsonResponse(mockContext as any, data)

    expect(result).toEqual(data)
  })

  it('handles nested objects correctly', () => {
    const mockContext = createMockContext()
    const nestedData = {
      user: {
        name: 'Jane',
        address: {
          city: 'Berlin',
          country: 'Germany',
        },
      },
    }

    const result = createJsonResponse(mockContext as any, nestedData)

    expect(mockContext.json).toHaveBeenCalledWith(nestedData)
    expect(result).toEqual(nestedData)
  })
})
