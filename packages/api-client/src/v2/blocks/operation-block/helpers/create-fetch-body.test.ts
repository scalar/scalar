import { requestExampleSchema } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { createFetchBody } from './create-fetch-body'

describe('createFetchBody', () => {
  it('should handle request method in lowercase', () => {
    const example = requestExampleSchema.parse({
      body: {
        activeBody: 'raw',
        raw: {
          value: 'hello world',
          encoding: 'text',
        },
      },
    })

    const result = createFetchBody('post', example, {})

    expect(result).toEqual({
      body: 'hello world',
      contentType: 'text',
    })
  })
})
