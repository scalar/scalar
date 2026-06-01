import { describe, expectTypeOf, it } from 'vitest'

import type { Document as OpenAPIV3_1Document, SchemaObject as OpenAPIV3_1SchemaObject } from '../3.1'
import type {
  Document as OpenAPIV3_2Document,
  MediaTypeObject as OpenAPIV3_2MediaTypeObject,
  SchemaObject as OpenAPIV3_2SchemaObject,
} from '../3.2'
import type { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1, OpenAPIV3_2 } from './openapi-types'

describe('OpenAPI', () => {
  it('has a generic type', () => {
    const document: OpenAPI.Document = {
      // anything
    }

    expectTypeOf(document).toEqualTypeOf<OpenAPI.Document>()
  })

  it('narrows it down to Swagger 2.0', () => {
    const document: OpenAPI.Document = {
      swagger: '2.0',
    }

    expectTypeOf(document).toEqualTypeOf<OpenAPIV2.Document>()
  })

  it('narrows it down to OpenAPI 3.0.0', () => {
    const document: OpenAPI.Document = {
      openapi: '3.0.0',
    }

    expectTypeOf(document).toEqualTypeOf<OpenAPIV3.Document>()
  })

  it('narrows it down to OpenAPI 3.0.4', () => {
    const document: OpenAPI.Document = {
      openapi: '3.0.4',
    }

    expectTypeOf(document).toEqualTypeOf<OpenAPIV3.Document>()
  })

  it('narrows it down to OpenAPI 3.1.0', () => {
    const document: OpenAPI.Document = {
      openapi: '3.1.0',
    }

    expectTypeOf(document).toEqualTypeOf<OpenAPIV3_1.Document>()
  })

  it('narrows it down to OpenAPI 3.1.1', () => {
    const document: OpenAPI.Document = {
      openapi: '3.1.1',
    }

    expectTypeOf(document).toEqualTypeOf<OpenAPIV3_1.Document>()
  })

  it('narrows it down to OpenAPI 3.1.2', () => {
    const document: OpenAPI.Document = {
      openapi: '3.1.2',
    }

    expectTypeOf(document).toEqualTypeOf<OpenAPIV3_1.Document>()
  })

  it('narrows it down to OpenAPI 3.2.0', () => {
    const document: OpenAPI.Document = {
      openapi: '3.2.0',
    }

    expectTypeOf(document).toEqualTypeOf<OpenAPIV3_2.Document>()
  })

  it('types a custom extension', () => {
    const document: OpenAPI.Document<{
      'x-custom'?: boolean
      'random-attribute'?: any
    }> = {}

    expectTypeOf(document['random-attribute']).toEqualTypeOf<any>()
    expectTypeOf(document['x-custom']).toEqualTypeOf<boolean | undefined>()
  })

  it('has a HttpMethod type', () => {
    expectTypeOf('get' as OpenAPI.HttpMethod).toEqualTypeOf<OpenAPI.HttpMethod>()

    // @ts-expect-error name is a string
    assertType('NOT_A_METHOD' as OpenAPI.HttpMethod)
  })
})

describe('@scalar/openapi-types/3.1', () => {
  it('allows boolean schemas anywhere a schema object is accepted', () => {
    expectTypeOf<true>().toExtend<OpenAPIV3_1SchemaObject>()
    expectTypeOf<false>().toExtend<OpenAPIV3_1SchemaObject>()

    const schema: OpenAPIV3_1SchemaObject = {
      type: 'object',
      properties: {
        anything: true,
        nothing: false,
      },
      allOf: [true, false, { type: 'string' }],
    }

    const document: OpenAPIV3_1Document = {
      openapi: '3.1.0',
      info: {
        title: 'Boolean schema test',
        version: '1.0.0',
      },
      components: {
        schemas: {
          Anything: true,
          Nothing: false,
        },
      },
    }

    expectTypeOf(schema).not.toBeAny()
    expectTypeOf(document).not.toBeAny()
  })
})

describe('@scalar/openapi-types/3.2', () => {
  it('allows boolean schemas anywhere a schema object is accepted', () => {
    expectTypeOf<true>().toExtend<OpenAPIV3_2SchemaObject>()
    expectTypeOf<false>().toExtend<OpenAPIV3_2SchemaObject>()

    const schema: OpenAPIV3_2SchemaObject = {
      type: 'object',
      properties: {
        anything: true,
        nothing: false,
      },
      allOf: [true, false, { type: 'string' }],
    }

    const document: OpenAPIV3_2Document = {
      openapi: '3.2.0',
      info: {
        title: 'Boolean schema test',
        version: '1.0.0',
      },
      components: {
        schemas: {
          Anything: true,
          Nothing: false,
        },
      },
    }

    expectTypeOf(schema).not.toBeAny()
    expectTypeOf(document).not.toBeAny()
  })

  it('allows media type schemas to be references', () => {
    const mediaType: OpenAPIV3_2MediaTypeObject = {
      schema: {
        $ref: '#/components/schemas/Pet',
      },
      itemSchema: {
        $ref: '#/components/schemas/Pet',
      },
    }

    expectTypeOf(mediaType).not.toBeAny()
  })
})
