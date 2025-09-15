import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expectTypeOf, it } from 'vitest'

import { upgrade } from './upgrade'

describe('OpenAPI', () => {
  it('narrows it down to OpenAPI 3.1', () => {
    const document = upgrade({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expectTypeOf(document).toEqualTypeOf<OpenAPIV3_1.Document>()
  })
})
