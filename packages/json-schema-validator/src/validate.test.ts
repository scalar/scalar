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
})
