import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'

describe('unusedPathParam (#7447)', () => {
  it('returns an error for path parameter not in path template', async () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pets/{petId}': {
          get: {
            operationId: 'getPet',
            parameters: [
              { name: 'petId', in: 'path', required: true, schema: { type: 'string' } },
              { name: 'testId', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    }

    const result = await validate(spec)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(1)

    const pathParamError = result.errors.find((e) => e.message?.includes('testId'))
    expect(pathParamError).toBeDefined()
    expect(pathParamError.message).toContain('{testId}')
  })

  it('passes validation when all path parameters match', async () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pets/{petId}': {
          get: {
            operationId: 'getPet',
            parameters: [
              { name: 'petId', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    }

    const result = await validate(spec)
    expect(result.valid).toBe(true)
    expect(result.errors.length).toBe(0)
  })
})
