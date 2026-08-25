import { describe, expect, it } from 'vitest'

import { createValidator, validate } from './validate'

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['name'],
  properties: { name: { type: 'string' } },
  additionalProperties: false,
}

describe('validate', () => {
  it('passes a valid document', () => {
    expect(validate({ name: 'Hello' }, schema).valid).toBe(true)
  })

  it('reports a missing required property', () => {
    const result = validate({}, schema)

    expect(result.valid).toBe(false)
    expect(result.errors[0]?.message).toContain("must have required property 'name'")
  })

  it('reports unexpected properties', () => {
    const result = validate({ name: 'Hello', extra: true }, schema)

    expect(result.valid).toBe(false)
    expect(result.errors[0]?.message).toBe('Property extra is not expected to be here')
  })

  it('accepts a JSON string', () => {
    expect(validate('{ "name": "Hi" }', schema).valid).toBe(true)
  })

  it('accepts a YAML string', () => {
    expect(validate('name: Hi\n', schema).valid).toBe(true)
  })

  it('throws when throwOnError is set', () => {
    expect(() => validate({}, schema, { throwOnError: true })).toThrow()
  })

  it('reuses a precompiled validator via createValidator', () => {
    const validateName = createValidator(schema)

    expect(validateName({ name: 'Hello' }).valid).toBe(true)
    expect(validateName({}).valid).toBe(false)
  })

  it('reports a schema that fails to compile instead of throwing', () => {
    const brokenSchema = { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'string', pattern: '(' }
    const result = validate('anything', brokenSchema)

    expect(result.valid).toBe(false)
    expect(result.errors[0]?.message).toContain('Invalid regular expression')
  })

  it('reports malformed YAML instead of throwing', () => {
    const result = validate('{ name: ', schema)

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
  })

  it('still throws for malformed input when throwOnError is set', () => {
    expect(() => validate('{ name: ', schema, { throwOnError: true })).toThrow()
  })

  it('validates against a boolean schema', () => {
    // `true` and `false` are valid JSON Schemas, but cannot key the compile cache.
    expect(validate({ anything: true }, true as unknown as typeof schema).valid).toBe(true)
    expect(validate({ anything: true }, false as unknown as typeof schema).valid).toBe(false)
  })

  it('does not recompile a schema that already failed to compile', () => {
    const brokenSchema = { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'string', pattern: '(' }

    expect(validate('anything', brokenSchema).valid).toBe(false)

    // The recorded failure is rethrown as-is, so the very same error object
    // coming back twice is what proves the schema was not compiled again.
    const thrown = [1, 2].map(() => {
      try {
        validate('anything', brokenSchema, { throwOnError: true })
      } catch (error) {
        return error
      }

      return undefined
    })

    expect(thrown[0]).toBeInstanceOf(Error)
    expect(thrown[1]).toBe(thrown[0])
  })

  it('throws from createValidator when the schema cannot be compiled', () => {
    // Compiling happens up front, so this is a setup failure rather than a
    // validation result.
    expect(() => createValidator({ type: 'string', pattern: '(' })).toThrow()
  })
})
