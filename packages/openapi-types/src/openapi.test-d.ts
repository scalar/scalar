import { describe, expectTypeOf, it } from 'vitest'

import type { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from './index'

describe('OpenAPI', () => {
  it('has a generic type', () => {
    const specification: OpenAPI.Document = {
      // anything
    }

    expectTypeOf(specification).toMatchTypeOf<OpenAPI.Document>()
  })

  it('narrows it down to Swagger 2.0', () => {
    const specification: OpenAPI.Document = {
      swagger: '2.0',
    }

    expectTypeOf(specification).toMatchTypeOf<OpenAPIV2.Document>()
  })

  it('narrows it down to OpenAPI 3.0', () => {
    const specification: OpenAPI.Document = {
      openapi: '3.0.0',
    }

    expectTypeOf(specification).toMatchTypeOf<OpenAPIV3.Document>()
  })

  it('narrows it down to OpenAPI 3.1', () => {
    const specification: OpenAPI.Document = {
      openapi: '3.1.0',
    }

    expectTypeOf(specification).toMatchTypeOf<OpenAPIV3_1.Document>()
  })

  it('types a custom extension', () => {
    const specification: OpenAPI.Document<{
      'x-custom'?: boolean
    }> = {}

    expectTypeOf(specification['random-attribute']).toEqualTypeOf<any>()
    expectTypeOf(specification['x-custom']).toEqualTypeOf<boolean | undefined>()
  })
})
