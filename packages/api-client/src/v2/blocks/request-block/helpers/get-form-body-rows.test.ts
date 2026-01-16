import type { ExampleObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getFormBodyRows } from './get-form-body-rows'

describe('getFormBodyRows', () => {
  it('returns empty array when example is null, undefined, or missing value', () => {
    expect(getFormBodyRows(null, 'multipart/form-data')).toEqual([])
    expect(getFormBodyRows(undefined, 'multipart/form-data')).toEqual([])

    const exampleWithoutValue: ExampleObject = {}
    const exampleWithNullValue: ExampleObject = { value: null }
    const exampleWithUndefinedValue: ExampleObject = { value: undefined }
    const exampleWithFalsyValue: ExampleObject = { value: false }

    expect(getFormBodyRows(exampleWithoutValue, 'multipart/form-data')).toEqual([])
    expect(getFormBodyRows(exampleWithNullValue, 'multipart/form-data')).toEqual([])
    expect(getFormBodyRows(exampleWithUndefinedValue, 'multipart/form-data')).toEqual([])
    expect(getFormBodyRows(exampleWithFalsyValue, 'multipart/form-data')).toEqual([])
  })

  it('returns empty array when contentType is not multipart/form-data or application/x-www-form-urlencoded', () => {
    const example: ExampleObject = {
      value: {
        value: [{ name: 'test', value: 'data', isDisabled: false }],
      },
    }

    expect(getFormBodyRows(example, 'application/json')).toEqual([])
    expect(getFormBodyRows(example, 'application/xml')).toEqual([])
    expect(getFormBodyRows(example, 'text/plain')).toEqual([])
    expect(getFormBodyRows(example, 'application/octet-stream')).toEqual([])
  })

  it('returns array directly when example.value is already an array of form rows', () => {
    const formRows = [
      { name: 'username', value: 'john_doe', isDisabled: false },
      { name: 'email', value: 'john@example.com', isDisabled: true },
      { name: 'age', value: '30', isDisabled: false },
    ]

    const example: ExampleObject = {
      value: formRows,
    }

    const result = getFormBodyRows(example, 'multipart/form-data')
    expect(result).toEqual(formRows)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ name: 'username', value: 'john_doe', isDisabled: false })
    expect(result[1]).toEqual({ name: 'email', value: 'john@example.com', isDisabled: true })
    expect(result[2]).toEqual({ name: 'age', value: '30', isDisabled: false })
  })

  it('converts object to array of rows when example.value.value is a plain object', () => {
    const formDataObject = {
      username: 'jane_doe',
      email: 'jane@example.com',
      age: '25',
      isActive: 'true',
    }

    const example: ExampleObject = {
      value: formDataObject,
    }

    const result = getFormBodyRows(example, 'application/x-www-form-urlencoded')
    expect(result).toHaveLength(4)
    expect(result).toEqual([
      { name: 'username', value: 'jane_doe', isDisabled: false },
      { name: 'email', value: 'jane@example.com', isDisabled: false },
      { name: 'age', value: '25', isDisabled: false },
      { name: 'isActive', value: 'true', isDisabled: false },
    ])

    // Verify it works with both form content types
    const result2 = getFormBodyRows(example, 'multipart/form-data')
    expect(result2).toHaveLength(4)
  })

  it('returns empty array for invalid data types: empty arrays, empty objects, primitives, and null', () => {
    // Empty array
    const exampleWithEmptyArray: ExampleObject = {
      value: [],
    }
    expect(getFormBodyRows(exampleWithEmptyArray, 'multipart/form-data')).toEqual([])

    // Empty object
    const exampleWithEmptyObject: ExampleObject = {
      value: {},
    }
    expect(getFormBodyRows(exampleWithEmptyObject, 'multipart/form-data')).toEqual([])

    // Non-object, non-array value (string, number, null)
    const exampleWithString: ExampleObject = {
      value: 'not an object or array',
    }
    expect(getFormBodyRows(exampleWithString, 'multipart/form-data')).toEqual([])

    const exampleWithNumber: ExampleObject = {
      value: 123,
    }
    expect(getFormBodyRows(exampleWithNumber, 'multipart/form-data')).toEqual([])

    const exampleWithNullInValue: ExampleObject = {
      value: null,
    }
    expect(getFormBodyRows(exampleWithNullInValue, 'multipart/form-data')).toEqual([])
  })
})
