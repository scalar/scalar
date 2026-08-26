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

  it('validates a patch version against its minor schema', () => {
    // There is no dedicated 3.1.4 schema, so it validates against the 3.1 one.
    const result = validate({ openapi: '3.1.4', info: { title: 'Hello', version: '1.0.0' }, paths: {} })

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.1')
  })

  it('is strict about the required info.version', () => {
    const result = validate({ openapi: '3.1.0', info: { title: 'No version' }, paths: {} })

    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(expect.objectContaining({ message: "must have required property 'version'" }))
  })

  it('does not mutate the input document', () => {
    const document = { openapi: '3.1.0', info: { title: 'No version' }, paths: {} }
    validate(document)

    expect(document.info).not.toHaveProperty('version')
  })

  it('reports unused path parameters when checkPathParameters is set', () => {
    const document = {
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
    }

    expect(validate(document, { checkPathParameters: true }).valid).toBe(false)
  })

  it('leaves path-parameter checks off by default', () => {
    // The checks need a resolved document, so a standalone call must not report
    // a path-parameter mismatch unless explicitly enabled.
    const document = {
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
    }

    expect(validate(document).valid).toBe(true)
  })

  it('reports a scalar or array as empty/invalid, not an unsupported version', () => {
    // A YAML string can parse to a primitive or an array; neither is a document.
    for (const input of ['42', 'true', '- a\n- b']) {
      const result = validate(input)

      expect(result.valid).toBe(false)
      expect(result.errors).toEqual([{ message: "Can't find JSON, YAML or filename in data." }])
    }
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
