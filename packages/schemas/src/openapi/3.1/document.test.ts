import { coerce } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { openApiSchema } from './document'

describe('document', () => {
  const base = {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    'x-scalar-original-document-hash': '',
  }

  it('coerces a path item that is a reference object', () => {
    const validInput = {
      ...base,
      paths: {
        '/users': {
          $ref: '#/components/pathItems/UsersPath',
          '$ref-value': {
            get: {
              summary: 'Get users',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      },
    }

    expect(coerce(openApiSchema, validInput)).toEqual(validInput)
  })

  it('coerces a webhook that is a reference object', () => {
    const validInput = {
      ...base,
      webhooks: {
        newUser: {
          $ref: '#/components/pathItems/NewUserWebhook',
          '$ref-value': {
            post: {
              summary: 'New user webhook',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      },
    }

    expect(coerce(openApiSchema, validInput)).toEqual(validInput)
  })

  it('coerces a components.pathItems entry that is a reference object', () => {
    const validInput = {
      ...base,
      components: {
        pathItems: {
          UsersPath: {
            $ref: '#/components/pathItems/Shared',
            '$ref-value': {
              get: {
                summary: 'Get users',
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        },
      },
    }

    expect(coerce(openApiSchema, validInput)).toEqual(validInput)
  })

  it('still coerces inline path items', () => {
    const validInput = {
      ...base,
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    }

    expect(coerce(openApiSchema, validInput)).toEqual(validInput)
  })
})
