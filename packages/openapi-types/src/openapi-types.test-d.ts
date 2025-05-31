import { describe, expectTypeOf, it } from 'vitest'

import type { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from './openapi-types'

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

  it('narrows it down to OpenAPI 3.0.0', () => {
    const specification: OpenAPI.Document = {
      openapi: '3.0.0',
    }

    expectTypeOf(specification).toMatchTypeOf<OpenAPIV3.Document>()
  })

  it('narrows it down to OpenAPI 3.0.4', () => {
    const specification: OpenAPI.Document = {
      openapi: '3.0.4',
    }

    expectTypeOf(specification).toMatchTypeOf<OpenAPIV3.Document>()
  })

  it('narrows it down to OpenAPI 3.1.0', () => {
    const specification: OpenAPI.Document = {
      openapi: '3.1.0',
    }

    expectTypeOf(specification).toMatchTypeOf<OpenAPIV3_1.Document>()
  })

  it('narrows it down to OpenAPI 3.1.1', () => {
    const specification: OpenAPI.Document = {
      openapi: '3.1.1',
    }

    expectTypeOf(specification).toMatchTypeOf<OpenAPIV3_1.Document>()
  })

  it('types a custom extension', () => {
    const specification: OpenAPI.Document<{
      'x-custom'?: boolean
      'random-attribute'?: any
    }> = {}

    expectTypeOf(specification['random-attribute']).toEqualTypeOf<any>()
    expectTypeOf(specification['x-custom']).toEqualTypeOf<boolean | undefined>()
  })

  it('has a HttpMethod type', () => {
    const validMethod: OpenAPI.HttpMethod = 'GET'
    const anotherValidMethod: Lowercase<OpenAPI.HttpMethod> = 'get'

    expectTypeOf(validMethod).toMatchTypeOf<OpenAPI.HttpMethod>()
    expectTypeOf(anotherValidMethod).toMatchTypeOf<Lowercase<OpenAPI.HttpMethod>>()

    // @ts-expect-error name is a string
    assertType('NOT_A_METHOD' as OpenAPI.HttpMethod)
  })
})
