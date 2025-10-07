import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { AsyncApiDocumentSchemaStrict } from './schemas/asyncapi'
import { isAsyncApiDocument } from './schemas/workspace'

describe('AsyncAPI 3.0', () => {
  const asyncApiDocument = {
    asyncapi: '3.0.0' as const,
    info: {
      title: 'Test AsyncAPI',
      version: '1.0.0',
    },
    channels: {
      'user/signedup': {
        title: 'User signed up',
        operations: {
          publish: 'publishUserSignedUp',
        },
      },
    },
    operations: {
      publishUserSignedUp: {
        action: 'publish' as const,
        channel: 'user/signedup',
        title: 'Publish user signed up event',
      },
    },
    components: {
      schemas: {},
    },
  }

  it('validates basic AsyncAPI 3.0 document', () => {
    const isValid = Value.Check(AsyncApiDocumentSchemaStrict, asyncApiDocument)
    expect(isValid).toBe(true)
  })

  it('identifies AsyncAPI documents correctly', () => {
    expect(isAsyncApiDocument(asyncApiDocument)).toBe(true)
  })

  it('does not identify OpenAPI documents as AsyncAPI', () => {
    const openApiDocument = {
      openapi: '3.0.0',
      info: {
        title: 'Test OpenAPI',
        version: '1.0.0',
      },
      paths: {},
    }
    expect(isAsyncApiDocument(openApiDocument)).toBe(false)
  })
})
