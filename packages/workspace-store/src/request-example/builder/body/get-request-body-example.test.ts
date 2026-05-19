import { openapiSchemas } from '@scalar/schemas/openapi/3.1'
import type { RequestBodyObject } from '@scalar/types/openapi/3.1'
import { coerce } from '@scalar/validation'
import { assert, describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { isOpenApiDocument } from '@/schemas'

import { getExampleFromBody } from './get-request-body-example'

describe('get-request-body-example', () => {
  it('returns existing example when found in content.examples', () => {
    const requestBody = {
      content: {
        'application/json': {
          examples: {
            myExample: {
              value: { id: 123, name: 'Test User' },
            },
          },
        },
      },
    }

    const result = getExampleFromBody(requestBody, 'application/json', 'myExample')

    expect(result).toEqual({ value: { id: 123, name: 'Test User' } })
  })

  it('generates example from schema when no example exists', () => {
    const requestBody = coerce(openapiSchemas.requestBody, {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
            },
          },
        },
      },
    })

    const result = getExampleFromBody(requestBody, 'application/json', 'default')
    expect(result).toEqual({ value: { id: 1, name: '' } })
  })

  it('returns null when content for contentType does not exist', () => {
    const requestBody = {
      content: {
        'application/xml': {
          schema: { type: 'object' },
        },
      },
    } satisfies RequestBodyObject

    const result = getExampleFromBody(requestBody, 'application/json', 'default')

    expect(result).toBeNull()
  })

  it('returns null when neither example nor schema exists', () => {
    const requestBody = {
      content: {
        'application/json': {},
      },
    }

    const result = getExampleFromBody(requestBody, 'application/json', 'default')

    expect(result).toBeNull()
  })

  it('resolves $ref examples correctly', () => {
    const requestBody = {
      content: {
        'application/json': {
          examples: {
            refExample: {
              $ref: '#/components/examples/UserExample',
              '$ref-value': {
                value: { id: 456, email: 'ref@example.com' },
              },
            },
          },
        },
      },
    }

    const result = getExampleFromBody(requestBody, 'application/json', 'refExample')

    expect(result).toEqual({ value: { id: 456, email: 'ref@example.com' } })
  })

  it('filters out readOnly properties when generating example from schema', () => {
    const requestBody = {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              createdAt: { type: 'string', readOnly: true },
              updatedAt: { type: 'string', readOnly: true },
            },
          },
        },
      },
    } satisfies RequestBodyObject

    const result = getExampleFromBody(requestBody, 'application/json', 'default')

    // readOnly properties should be filtered out
    expect(result).toEqual({ value: { id: 1, name: '' } })
    expect(result?.value).not.toHaveProperty('createdAt')
    expect(result?.value).not.toHaveProperty('updatedAt')
  })

  it('uses requestBodyCompositionSelection when generating an example from schema', () => {
    const requestBody = coerce(openapiSchemas.requestBody, {
      content: {
        'application/json': {
          schema: {
            anyOf: [
              {
                type: 'object',
                properties: {
                  source: { type: 'string', default: 'file' },
                },
              },
              {
                type: 'object',
                properties: {
                  source: { type: 'string', default: 'service' },
                },
              },
            ],
          },
        },
      },
    })

    const result = getExampleFromBody(requestBody, 'application/json', 'default', { 'requestBody.anyOf': 1 })

    expect(result).toEqual({ value: { source: 'service' } })
  })

  it('deep resolves nested refs when generating selected nested composition examples', async () => {
    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'test',
      document: {
        paths: {
          '/': {
            get: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        payload: {
                          anyOf: [
                            {
                              $ref: '#/$defs/aFilePayload',
                            },
                            {
                              $ref: '#/$defs/NestedServicePayload',
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        $defs: {
          aFilePayload: {
            type: 'object',
            properties: {
              payloadType: { type: 'string', const: 'file' },
              fileName: { type: 'string', example: 'buildings.geojson' },
              transform: {
                oneOf: [
                  {
                    $ref: '#/$defs/ReprojectTransform',
                  },
                ],
              },
            },
          },
          ReprojectTransform: {
            type: 'object',
            properties: {
              mode: { type: 'string', const: 'reproject' },
              epsg: { type: 'integer', example: 4326 },
            },
          },
          NestedServicePayload: {
            type: 'object',
            properties: {
              payloadType: { type: 'string', const: 'service' },
              layerName: { type: 'string', example: 'zoning' },
              transform: {
                oneOf: [
                  {
                    $ref: '#/$defs/BufferTransform',
                  },
                ],
              },
            },
          },
          BufferTransform: {
            type: 'object',
            properties: {
              mode: { type: 'string', const: 'buffer' },
              distanceMeters: { type: 'integer', example: 25 },
            },
          },
        },
      },
    })

    const document = store.workspace.documents.test
    if (!isOpenApiDocument(document)) {
      throw new Error('Document is not an OpenAPI document')
    }
    const requestBody = getResolvedRef(getResolvedRef(document.paths?.['/']?.get)?.requestBody)!

    expect(requestBody).toBeDefined()
    assert(requestBody)

    const result = getExampleFromBody(requestBody, 'application/json', 'default', {
      'requestBody.payload.anyOf': 1,
      'requestBody.payload.transform.oneOf': 0,
    })

    expect(result).toEqual({
      value: {
        payload: {
          payloadType: 'service',
          layerName: 'zoning',
          transform: {
            mode: 'buffer',
            distanceMeters: 25,
          },
        },
      },
    })
  })
})
