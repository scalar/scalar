import { describe, expect, it } from 'vitest'

import { supportedVersions } from './index'
import { validate } from './validate'

describe('validate', () => {
  it('validates an AsyncAPI 2.6.0 document', () => {
    const result = validate({
      asyncapi: '2.6.0',
      info: { title: 'Hello World', version: '1.0.0' },
      channels: {},
    })

    expect(result.valid).toBe(true)
    expect(result.version).toBe('2.6.0')
  })

  it('validates an AsyncAPI 3.0.0 document', () => {
    const result = validate({
      asyncapi: '3.0.0',
      info: { title: 'Hello World', version: '1.0.0' },
    })

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0.0')
  })

  it('validates a document passed as a YAML string', () => {
    const result = validate(['asyncapi: 3.0.0', 'info:', '  title: Hello', '  version: 1.0.0'].join('\n'))

    expect(result.valid).toBe(true)
  })

  it('reports schema errors for an invalid document', () => {
    const result = validate({
      asyncapi: '3.0.0',
      // `info` is required
    })

    expect(result.valid).toBe(false)
    expect(result.errors?.length).toBeGreaterThan(0)
  })

  it('validates a patch version against its minor schema', () => {
    // There is no dedicated 3.1.4 schema, so it falls back to the 3.1.0 schema.
    const result = validate({
      asyncapi: '3.1.4',
      info: { title: 'Hello World', version: '1.0.0' },
    })

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.1.0')
  })

  it('fails when the version is not supported', () => {
    const result = validate({ asyncapi: '9.9.9', info: { title: 'Nope', version: '1.0.0' } })

    expect(result.valid).toBe(false)
  })

  it('fails for an unsupported minor version', () => {
    // 3.9 has no schema, and must not fall back to another minor.
    const result = validate({ asyncapi: '3.9.0', info: { title: 'Nope', version: '1.0.0' } })

    expect(result.valid).toBe(false)
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
    expect(() => validate({ asyncapi: '9.9.9' }, { throwOnError: true })).toThrow()
  })

  it('exposes the supported versions', () => {
    expect(supportedVersions).toContain('2.6.0')
    expect(supportedVersions).toContain('3.0.0')
  })

  it('compiles the schema for every supported version', () => {
    for (const version of supportedVersions) {
      const result = validate({
        asyncapi: version,
        info: { title: 'x', version: '1.0.0' },
        channels: {},
      })

      // The point is that each schema compiles and the version is detected,
      // not whether this minimal document is valid for every version.
      expect(result.version).toBe(version)
    }
  })
})
