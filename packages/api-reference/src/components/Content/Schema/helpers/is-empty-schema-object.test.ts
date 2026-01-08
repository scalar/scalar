import { describe, expect, it } from 'vitest'

import { isEmptySchemaObject } from './is-empty-schema-object'

describe('isEmptySchemaObject', () => {
  it('returns true for empty object schema', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
        properties: {},
      }),
    ).toBe(true)
  })

  it('returns true for object schema without properties key', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
      }),
    ).toBe(true)
  })

  it('returns true for object schema with additionalProperties set to false', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
        additionalProperties: false,
      }),
    ).toBe(true)
  })

  it('returns true for object schema with empty patternProperties', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
        patternProperties: {},
      }),
    ).toBe(true)
  })

  it('returns true for schema with type object nullable', () => {
    expect(
      isEmptySchemaObject({
        type: ['object', 'null'],
      }),
    ).toBe(true)
  })

  it('returns false for object schema with properties', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }),
    ).toBe(false)
  })

  it('returns false for object schema with properties and additionalProperties false', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: false,
      }),
    ).toBe(false)
  })

  it('returns false for object schema with additionalProperties defined as object with properties', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
        additionalProperties: {
          type: 'string',
        },
      }),
    ).toBe(false)
  })

  it('returns false for object schema with patternProperties defined', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
        patternProperties: {
          '^S_': { type: 'string' },
        },
      }),
    ).toBe(false)
  })

  it('returns false for object schema with additionalProperties set to true', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
        additionalProperties: true,
      }),
    ).toBe(false)
  })

  it('returns false for non-object schema', () => {
    expect(
      isEmptySchemaObject({
        type: 'string',
      }),
    ).toBe(false)
  })

  it('returns false for undefined schema', () => {
    expect(isEmptySchemaObject(undefined)).toBe(false)
  })

  it('returns false for object with all three extension types', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: {
          type: 'number',
        },
        patternProperties: {
          '^S_': { type: 'string' },
        },
      }),
    ).toBe(false)
  })
})
