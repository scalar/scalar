import { createRequest } from '@/entities/workspace/spec/requests'
import { describe, expect, it } from 'vitest'

describe('createRequest', () => {
  it('should create a request', () => {
    const request = createRequest({})

    expect(request).toMatchObject({
      path: '',
    })
  })

  it('deals with circular references', () => {
    const foo: Record<string, any> = {
      bar: 'baz',
    }

    // Circular reference
    foo.bar = foo

    // See it failing
    createRequest(foo)
  })
})
