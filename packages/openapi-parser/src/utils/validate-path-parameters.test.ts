import { describe, expect, it } from 'vitest'

import { validatePathParameters } from './validate-path-parameters'

describe('validatePathParameters', () => {
  it('returns no errors for valid path parameters', () => {
    const spec = {
      paths: {
        '/pets/{petId}': {
          get: {
            parameters: [
              { name: 'petId', in: 'path', required: true, schema: { type: 'string' } },
            ],
          },
        },
      },
    }

    expect(validatePathParameters(spec)).toEqual([])
  })

  it('detects unused path parameter not in path template (#7447)', () => {
    const spec = {
      paths: {
        '/pets/{petId}': {
          get: {
            parameters: [
              { name: 'petId', in: 'path', required: true, schema: { type: 'string' } },
              { name: 'testId', in: 'path', required: true, schema: { type: 'string' } },
            ],
          },
        },
      },
    }

    const errors = validatePathParameters(spec)
    expect(errors.length).toBe(1)
    expect(errors[0].message).toContain('testId')
    expect(errors[0].message).toContain('{testId}')
    expect(errors[0].message).toContain('/pets/{petId}')
  })

  it('detects missing path parameter (in template but not defined)', () => {
    const spec = {
      paths: {
        '/test/{test}/{test2}': {
          get: {
            parameters: [
              { name: 'test', in: 'path', required: true, schema: { type: 'string' } },
            ],
          },
        },
      },
    }

    const errors = validatePathParameters(spec)
    expect(errors.length).toBe(1)
    expect(errors[0].message).toContain('test2')
  })

  it('accepts path-level parameters', () => {
    const spec = {
      paths: {
        '/pets/{petId}': {
          parameters: [
            { name: 'petId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          get: {
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    }

    expect(validatePathParameters(spec)).toEqual([])
  })

  it('ignores non-path parameters', () => {
    const spec = {
      paths: {
        '/pets/{petId}': {
          get: {
            parameters: [
              { name: 'petId', in: 'path', required: true, schema: { type: 'string' } },
              { name: 'limit', in: 'query', schema: { type: 'integer' } },
            ],
          },
        },
      },
    }

    expect(validatePathParameters(spec)).toEqual([])
  })

  it('returns no errors when paths is empty', () => {
    expect(validatePathParameters({ paths: {} })).toEqual([])
    expect(validatePathParameters({})).toEqual([])
  })

  it('handles multiple operations on the same path', () => {
    const spec = {
      paths: {
        '/pets/{petId}': {
          get: {
            parameters: [
              { name: 'petId', in: 'path', required: true },
            ],
          },
          put: {
            parameters: [
              { name: 'petId', in: 'path', required: true },
              { name: 'bogus', in: 'path', required: true },
            ],
          },
        },
      },
    }

    const errors = validatePathParameters(spec)
    // GET is fine, PUT has an unused 'bogus' param
    expect(errors.length).toBe(1)
    expect(errors[0].message).toContain('bogus')
    expect(errors[0].path).toContain('put') // path array includes 'put'
  })

  it('operation-level params override path-level params', () => {
    const spec = {
      paths: {
        '/pets/{petId}': {
          parameters: [
            { name: 'petId', in: 'path', required: true },
          ],
          get: {
            // Operation also defines petId — this is valid override
            parameters: [
              { name: 'petId', in: 'path', required: true },
            ],
          },
        },
      },
    }

    expect(validatePathParameters(spec)).toEqual([])
  })
})
