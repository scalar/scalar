import { describe, expect, it } from 'vitest'

import { supportedVersions } from './index'
import { validate } from './validate'

describe('validate', () => {
  it('validates a document passed as an object', () => {
    const result = validate({
      openapi: '3.1.0',
      info: { title: 'Hello World', version: '1.0.0' },
      paths: {},
    })

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.1')
  })

  it('validates a document passed as a JSON string', () => {
    const result = validate('{ "openapi": "3.1.0", "info": { "title": "Hello", "version": "1.0.0" }, "paths": {} }')

    expect(result.valid).toBe(true)
  })

  it('validates a document passed as a YAML string', () => {
    const result = validate(['openapi: 3.1.0', 'info:', '  title: Hello', '  version: 1.0.0', 'paths: {}'].join('\n'))

    expect(result.valid).toBe(true)
  })

  it('reports schema errors for an invalid document', () => {
    const result = validate({
      openapi: '3.1.0',
      // `info` is required
      paths: {},
    })

    expect(result.valid).toBe(false)
    expect(result.errors?.length).toBeGreaterThan(0)
  })

  it('fails when the version is not supported', () => {
    const result = validate({ openapi: '4.0.0', info: { title: 'Nope', version: '1.0.0' }, paths: {} })

    expect(result.valid).toBe(false)
  })

  it('reports unused path parameters', () => {
    const result = validate({
      openapi: '3.1.0',
      info: { title: 'Hello', version: '1.0.0' },
      paths: {
        '/foo': {
          get: {
            parameters: [{ name: 'bar', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    })

    expect(result.valid).toBe(false)
  })

  it('throws when throwOnError is set', () => {
    expect(() =>
      validate({ openapi: '4.0.0', info: { title: 'Nope', version: '1.0.0' } }, { throwOnError: true }),
    ).toThrow()
  })

  it('exposes the supported versions', () => {
    expect(supportedVersions).toEqual(['2.0', '3.0', '3.1', '3.2'])
  })
})
