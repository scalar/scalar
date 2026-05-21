import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { asyncApiObjectSchema } from './asyncapi-object'

describe('asyncapi-object', () => {
  it('accepts a value that satisfies the generated AsyncApiDocument type', () => {
    const doc: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: { title: 'Streetlights API', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
    }

    expect(validate(asyncApiObjectSchema, doc)).toBe(true)
  })

  it('coerces a minimal valid document', () => {
    const validInput = {
      asyncapi: '3.0.0',
      info: {
        title: 'Streetlights API',
        version: '1.0.0',
      },
      'x-scalar-original-document-hash': '',
    }

    const result = coerce(asyncApiObjectSchema, validInput)

    expect(result).toEqual(validInput)
  })

  it('coerces a document with an info description', () => {
    const validInput = {
      asyncapi: '3.0.0',
      info: {
        title: 'Streetlights API',
        version: '1.0.0',
        description: 'Turn the lights on and off.',
      },
      'x-scalar-original-document-hash': '',
    }

    const result = coerce(asyncApiObjectSchema, validInput)

    expect(result).toEqual(validInput)
  })

  it('rejects a document missing the asyncapi field', () => {
    const invalidInput = {
      info: { title: 'x', version: '1' },
    }

    expect(validate(asyncApiObjectSchema, invalidInput)).toBe(false)
  })

  it('rejects a document missing required info fields', () => {
    const invalidInput = {
      asyncapi: '3.0.0',
      info: { title: 'x' },
    }

    expect(validate(asyncApiObjectSchema, invalidInput)).toBe(false)
  })
})
