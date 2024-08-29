import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expectTypeOf, it } from 'vitest'

import { upgrade } from './index'

describe('OpenAPI', () => {
  it('narrows it down to OpenAPI 3.1', () => {
    const { specification } = upgrade({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expectTypeOf(specification).toMatchTypeOf<OpenAPIV3_1.Document>()
  })
})
