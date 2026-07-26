import type { ArazzoDocument } from '@scalar/types/arazzo/1.1'
import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { arazzoObjectSchema } from './arazzo-object'

describe('arazzo-object', () => {
  it('accepts a value that satisfies the generated ArazzoDocument type', () => {
    const doc: ArazzoDocument = {
      arazzo: '1.1.0',
      info: { title: 'A pet purchasing workflow', version: '1.0.1' },
      sourceDescriptions: [
        { name: 'petstoreDescription', url: 'https://petstore.example.com/openapi.yaml', type: 'openapi' },
      ],
      workflows: [
        { workflowId: 'loginUserAndRetrievePet', steps: [{ stepId: 'loginStep', operationId: 'loginUser' }] },
      ],
      'x-scalar-original-document-hash': '',
    }

    expect(validate(arazzoObjectSchema, doc)).toBe(true)
  })

  it('coerces the spec pet-purchase example (§5.8.1)', () => {
    const validInput = {
      arazzo: '1.1.0',
      info: {
        title: 'A pet purchasing workflow',
        summary: 'This workflow showcases how to purchase a pet through a sequence of API calls',
        version: '1.0.1',
      },
      sourceDescriptions: [
        { name: 'petstoreDescription', url: 'https://petstore.example.com/openapi.yaml', type: 'openapi' },
      ],
      workflows: [
        {
          workflowId: 'loginUserAndRetrievePet',
          summary: 'Login User and then retrieve pets',
          description: 'This workflow lays out the steps to login a user and then retrieve pets',
          inputs: {
            type: 'object',
            properties: {
              username: { type: 'string' },
              password: { type: 'string' },
              orderCorrelationId: { type: 'string' },
            },
          },
          steps: [
            {
              stepId: 'loginStep',
              description: 'This step demonstrates the user login step',
              operationId: '$sourceDescriptions.petstoreDescription.loginUser',
              parameters: [
                { name: 'username', in: 'query', value: '$inputs.username' },
                { name: 'password', in: 'query', value: '$inputs.password' },
              ],
              successCriteria: [{ condition: '$statusCode == 200' }],
              outputs: {
                tokenExpires: '$response.header.X-Expires-After',
                rateLimit: '$response.header.X-Rate-Limit',
                sessionToken: '$response.body',
              },
            },
            {
              stepId: 'getPetStep',
              description: 'retrieve a pet by status from the GET pets endpoint',
              operationPath: '{$sourceDescriptions.petstoreDescription.url}#/paths/~1pet~1findByStatus/get',
              parameters: [
                { name: 'status', in: 'query', value: 'available' },
                { name: 'Authorization', in: 'header', value: '$steps.loginStep.outputs.sessionToken' },
              ],
              successCriteria: [{ condition: '$statusCode == 200' }],
            },
          ],
        },
      ],
      'x-scalar-original-document-hash': '',
    }

    const result = coerce(arazzoObjectSchema, validInput)

    expect(result).toEqual(validInput)
  })

  it('rejects a document missing the arazzo field', () => {
    const invalidInput = {
      info: { title: 'x', version: '1' },
      sourceDescriptions: [],
      workflows: [],
    }

    expect(validate(arazzoObjectSchema, invalidInput)).toBe(false)
  })

  it('rejects a document missing required info fields', () => {
    const invalidInput = {
      arazzo: '1.1.0',
      info: { title: 'x' },
      sourceDescriptions: [],
      workflows: [],
    }

    expect(validate(arazzoObjectSchema, invalidInput)).toBe(false)
  })

  it('rejects a document missing sourceDescriptions and workflows', () => {
    const invalidInput = {
      arazzo: '1.1.0',
      info: { title: 'x', version: '1' },
    }

    expect(validate(arazzoObjectSchema, invalidInput)).toBe(false)
  })
})
