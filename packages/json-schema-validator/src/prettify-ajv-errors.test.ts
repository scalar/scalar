import { describe, expect, it } from 'vitest'

import { type AjvError, prettifyAjvErrors } from './prettify-ajv-errors'

describe('prettify-ajv-errors', () => {
  it('keeps the required error when an anyOf error and children sit at the same node', () => {
    // Ajv can report a `required` error next to an `anyOf` error at the same
    // instancePath, plus a more specific child error. The `required` message is
    // the actionable one and must survive the pruning.
    const errors: AjvError[] = [
      {
        keyword: 'required',
        instancePath: '/foo',
        message: "must have required property 'name'",
        params: { missingProperty: 'name' },
      },
      { keyword: 'anyOf', instancePath: '/foo', message: 'must match a schema in anyOf', params: {} },
      { keyword: 'type', instancePath: '/foo/bar', message: 'must be string', params: {} },
    ]

    const result = prettifyAjvErrors({ foo: {} }, errors)

    expect(result).toContainEqual(expect.objectContaining({ message: "must have required property 'name'" }))
  })

  it('prunes an enum error when a sibling only has errors on a grandchild', () => {
    // The meaningful error often sits below the sibling rather than on it, so the
    // sibling check has to look at the whole subtree.
    const errors: AjvError[] = [
      {
        keyword: 'enum',
        instancePath: '/foo/a',
        message: 'must be equal to one of the allowed values',
        params: { allowedValues: ['x', 'y'] },
      },
      { keyword: 'type', instancePath: '/foo/b/c', message: 'must be string', params: {} },
    ]

    const result = prettifyAjvErrors({ foo: {} }, errors)

    expect(result).toEqual([expect.objectContaining({ path: '/foo/b/c' })])
  })

  it('prunes a root-level enum error when a sibling has errors', () => {
    // The root node is keyed by the empty string, which must not disqualify it
    // from pruning.
    const errors: AjvError[] = [
      {
        keyword: 'enum',
        instancePath: '',
        message: 'must be equal to one of the allowed values',
        params: { allowedValues: ['x'] },
      },
      { keyword: 'type', instancePath: '/foo', message: 'must be string', params: {} },
    ]

    const result = prettifyAjvErrors({}, errors)

    expect(result).toEqual([expect.objectContaining({ path: '/foo' })])
  })

  it('names the property in a pattern error', () => {
    // Ajv only sets `propertyName` for `propertyNames`, so the name comes from
    // the instance path.
    const errors: AjvError[] = [
      {
        keyword: 'pattern',
        instancePath: '/name',
        message: 'must match pattern "^[a-z]+$"',
        params: { pattern: '^[a-z]+$' },
      },
    ]

    const result = prettifyAjvErrors({ name: 'ABC' }, errors)

    expect(result[0]?.message).toBe('Property "name" must match pattern ^[a-z]+$')
  })

  it('keeps errors whose instance path has no ASCII-word segments', () => {
    // The pointer pattern cannot match these, but dropping them would report a
    // document as invalid with an empty error list.
    const errors: AjvError[] = [
      { keyword: 'type', instancePath: '/\u65e5\u672c\u8a9e', message: 'must be string', params: {} },
    ]

    const result = prettifyAjvErrors({}, errors)

    expect(result).toEqual([expect.objectContaining({ path: '/\u65e5\u672c\u8a9e' })])
  })

  it('keeps an unmatched instance path separate from root-level errors', () => {
    // Errors the pointer pattern cannot match must not be grouped with the root,
    // where a `required` error would prune them away.
    const errors: AjvError[] = [
      {
        keyword: 'required',
        instancePath: '',
        message: "must have required property 'info'",
        params: { missingProperty: 'info' },
      },
      {
        keyword: 'pattern',
        instancePath: '/\u65e5\u672c\u8a9e',
        message: 'must match pattern "^[a-z]+$"',
        params: { pattern: '^[a-z]+$' },
      },
    ]

    const result = prettifyAjvErrors({}, errors)

    expect(result).toHaveLength(2)
    expect(result).toContainEqual(expect.objectContaining({ path: '/\u65e5\u672c\u8a9e' }))
  })

  it('does not call an array index a property in a pattern error', () => {
    const errors: AjvError[] = [
      {
        keyword: 'pattern',
        instancePath: '/items/0',
        message: 'must match pattern "^[a-z]+$"',
        params: { pattern: '^[a-z]+$' },
      },
    ]

    const result = prettifyAjvErrors({ items: ['ABC'] }, errors)

    expect(result[0]?.message).not.toContain('Property')
    expect(result[0]?.path).toBe('/items/0')
  })

  it('keeps a numeric property name when the parent is not an array', () => {
    // OpenAPI is full of numeric object keys, so a numeric segment is only an
    // array index when the document actually holds an array there.
    const errors: AjvError[] = [
      {
        keyword: 'pattern',
        instancePath: '/responses/404',
        message: 'must match pattern "^[a-z]+$"',
        params: { pattern: '^[a-z]+$' },
      },
    ]

    const result = prettifyAjvErrors({ responses: { 404: 'NOPE' } }, errors)

    expect(result[0]?.message).toBe('Property "404" must match pattern ^[a-z]+$')
  })

  it('drops an `if` error when a more specific child error exists', () => {
    // An if/then/else conditional reports `if must match "else" schema` at the
    // parent while the real failure (a bad enum value) sits on a child. The
    // conditional restatement is noise, so the specific child error is the only
    // survivor and stays first — this is what `throwOnError` surfaces.
    const errors: AjvError[] = [
      { keyword: 'if', instancePath: '/foo', message: 'must match "else" schema', params: {} },
      {
        keyword: 'enum',
        instancePath: '/foo/in',
        message: 'must be equal to one of the allowed values',
        params: { allowedValues: ['query', 'header', 'path', 'cookie'] },
      },
    ]

    const result = prettifyAjvErrors({ foo: { in: 'nonsense' } }, errors)

    expect(result).toEqual([
      expect.objectContaining({
        message: 'must be equal to one of the allowed values: query, header, path, cookie',
        path: '/foo/in',
      }),
    ])
  })

  it('keeps an `if` error when it is the only signal', () => {
    // With no more specific error to fall back to, the conditional error is all
    // there is, so it must survive rather than leaving an empty error list.
    const errors: AjvError[] = [
      { keyword: 'if', instancePath: '/foo', message: 'must match "else" schema', params: {} },
    ]

    const result = prettifyAjvErrors({ foo: {} }, errors)

    expect(result).toEqual([expect.objectContaining({ message: 'if must match "else" schema' })])
  })
})
