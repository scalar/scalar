import { describe, expect, it } from 'vitest'

import { validate } from './validate'

describe('validate', () => {
  it('fails on invalid schema', () => {
    const result = validate('')

    expect(result.valid).toBe(false)
    expect(result.errors).toMatchObject([
      {
        message: "Can't find JSON, YAML or filename in data.",
      },
    ])
  })

  it('returns errors for an invalid schema', () => {
    const result = validate(
      `{
        "openapi": "3.1.0",
        "paths": {}
      }`,
    )

    expect(result.valid).toBe(false)

    expect(result.errors).toBeTypeOf('object')
    expect(Array.isArray(result.errors)).toBe(true)
    expect(result.errors.length).toBe(1)
    expect(result.errors[0]).toMatchObject({
      message: "must have required property 'info'",
    })
  })

  it('returns errors for an invalid specification', () => {
    const result = validate('pineapples')

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toBe("Can't find JSON, YAML or filename in data.")
  })

  it('works with YAML', () => {
    const result = validate(`openapi: 3.1.0
info:
  title: Hello World
  version: 1.0.0
paths: {}
`)

    expect(result.schema.info.title).toBe('Hello World')
  })

  it('works with OpenAPI 3.2.0', () => {
    const result = validate(`{
      "openapi": "3.2.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.valid).toBe(true)
    expect(result.schema.info.title).toBe('Hello World')
  })

  it(`doesn't work with OpenAPI 4.0.0`, () => {
    const result = validate(`{
      "openapi": "4.0.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain("Can't find supported Swagger/OpenAPI version in the provided document")
  })

  it('throws an error', () => {
    expect(() => {
      validate(undefined, {
        throwOnError: true,
      })
    }).toThrowError("Can't find JSON, YAML or filename in data")
  })
})
