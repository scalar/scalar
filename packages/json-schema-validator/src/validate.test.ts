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
  it.each([
    ['#/Användare', '$ref "#/Användare" contains non-ASCII characters. Percent-encode them using UTF-8 (RFC 3986).'],
    [
      '#/bad%ZZ',
      '$ref "#/bad%ZZ" contains invalid percent-encoding. Each "%" must be followed by two hexadecimal digits; encode a literal "%" as "%25".',
    ],
    [
      '#/bad%',
      '$ref "#/bad%" contains invalid percent-encoding. Each "%" must be followed by two hexadecimal digits; encode a literal "%" as "%25".',
    ],
    [
      '#/bad%2',
      '$ref "#/bad%2" contains invalid percent-encoding. Each "%" must be followed by two hexadecimal digits; encode a literal "%" as "%25".',
    ],
    [
      '#/has space',
      '$ref "#/has space" contains whitespace. Remove it or percent-encode it (for example, use "%20" for a space).',
    ],
    ['#/bad<value>', '$ref "#/bad<value>" is not a valid URI reference'],
  ])('explains an invalid URI reference: %s', (reference, message) => {
    const referenceSchema = { type: 'object', properties: { $ref: { type: 'string', format: 'uri-reference' } } }
    const result = validate({ $ref: reference }, referenceSchema)

    expect(result).toStrictEqual({ valid: false, errors: [{ message, path: '/$ref' }] })
    expect(() => validate({ $ref: reference }, referenceSchema, { throwOnError: true })).toThrow(message)
  })

  it.each(['#/Anv%C3%A4ndare', '#/has%20space', '#/literal%25', '#/valid-name'])(
    'accepts a valid URI reference: %s',
    (reference) => {
      const result = validate(
        { $ref: reference },
        { type: 'object', properties: { $ref: { type: 'string', format: 'uri-reference' } } },
      )

      expect(result).toStrictEqual({ valid: true, errors: [] })
    },
  )

  it('preserves the fallback for other formats and properties', () => {
    const result = validate(
      { email: 'invalid', url: 'has space' },
      { type: 'object', properties: { email: { format: 'email' }, url: { format: 'uri-reference' } } },
    )

    expect(result).toStrictEqual({
      valid: false,
      errors: [
        { message: 'format must match format "email"', path: '/email' },
        { message: 'format must match format "uri-reference"', path: '/url' },
      ],
    })
  })

  it('reads references through escaped and empty JSON Pointer segments', () => {
    const result = validate(
      { 'a/b~c%': { '': { $ref: '#/has space' } } },
      {
        type: 'object',
        properties: {
          'a/b~c%': {
            type: 'object',
            properties: { '': { type: 'object', properties: { $ref: { format: 'uri-reference' } } } },
          },
        },
      },
    )

    expect(result).toStrictEqual({
      valid: false,
      errors: [
        {
          message:
            '$ref "#/has space" contains whitespace. Remove it or percent-encode it (for example, use "%20" for a space).',
          path: '/a~1b~0c%//$ref',
        },
      ],
    })
  })

  for (const $schema of [
    'http://json-schema.org/draft-04/schema#',
    'http://json-schema.org/draft-07/schema#',
    'https://json-schema.org/draft/2020-12/schema',
  ]) {
    it.each([
      {
        divisor: 0.01,
        cases: [
          { value: 0.07, valid: true },
          { value: 0.29, valid: true },
          { value: 1.15, valid: true },
          { value: 4.35, valid: true },
          { value: 8.2, valid: true },
          { value: 19.99, valid: true },
          { value: -19.99, valid: true },
          { value: 1000000.19, valid: true },
          { value: 0, valid: true },
          { value: -0, valid: true },
          { value: 1.1, valid: true },
          { value: 0.075, valid: false },
          { value: -0.075, valid: false },
          { value: 0.010000000001, valid: false },
          { value: 0.009999999999, valid: false },
          { value: Number.NaN, valid: false },
          { value: Number.POSITIVE_INFINITY, valid: false },
          { value: Number.NEGATIVE_INFINITY, valid: false },
        ],
      },
      {
        divisor: 0.1,
        cases: [
          { value: 0.3, valid: true },
          { value: 0.30000000000000004, valid: false },
        ],
      },
      {
        divisor: 0.5,
        cases: [{ value: 1.5, valid: true }],
      },
      {
        divisor: 2,
        cases: [
          { value: 6, valid: true },
          { value: 7, valid: false },
        ],
      },
      {
        divisor: 1e-7,
        cases: [
          { value: 7e-7, valid: true },
          { value: 7.5e-7, valid: false },
        ],
      },
      {
        divisor: 1e20,
        cases: [{ value: 3e21, valid: true }],
      },
      {
        divisor: 2e21,
        cases: [{ value: 3e21, valid: false }],
      },
      {
        divisor: 5e-324,
        cases: [
          { value: 1e-323, valid: true },
          { value: Number.MAX_VALUE, valid: true },
        ],
      },
      {
        divisor: 1e-323,
        cases: [{ value: 5e-324, valid: false }],
      },
      {
        divisor: 1e100,
        cases: [{ value: 1e-100, valid: false }],
      },
    ])(`validates exact decimal multiples of $divisor with ${$schema}`, ({ divisor, cases }) => {
      // Reuse each schema so these cases do not repeatedly pay Ajv's compilation cost in CI.
      const numberSchema = { $schema, type: 'number', multipleOf: divisor }
      const validateNumber = createValidator(numberSchema)

      for (const { value, valid } of cases) {
        expect(validate(value, numberSchema).valid, `${value} / ${divisor}`).toBe(valid)
        expect(validateNumber(value).valid, `${value} / ${divisor}`).toBe(valid)
      }
    })
  }

  it('preserves nested multipleOf errors and throwing behavior', () => {
    const priceSchema = { type: 'object', properties: { price: { type: 'number', multipleOf: 0.01 } } }
    expect(validate({ price: 0.075 }, priceSchema)).toStrictEqual({
      valid: false,
      errors: [{ message: 'multipleOf must be multiple of 0.01', path: '/price' }],
    })
    expect(() => validate({ price: 0.075 }, priceSchema, { throwOnError: true })).toThrow('must be multiple of 0.01')
    expect(validate({ price: 19.99 }, priceSchema)).toStrictEqual({ valid: true, errors: [] })
    expect(validate({ price: '19.99' }, priceSchema).valid).toBe(false)
    expect(validate({ price: 'text' }, { properties: { price: { multipleOf: 0.01 } } })).toStrictEqual({
      valid: true,
      errors: [],
    })
  })

  it('validates decimal values read from JSON and YAML', () => {
    const priceSchema = { properties: { price: { type: 'number', multipleOf: 0.01 } } }
    expect(validate('{"price":19.99}', priceSchema)).toStrictEqual({ valid: true, errors: [] })
    expect(validate('price: 1000000.19', priceSchema)).toStrictEqual({ valid: true, errors: [] })
    expect(validate('price: 0.010000000001', priceSchema).valid).toBe(false)
  })
})
