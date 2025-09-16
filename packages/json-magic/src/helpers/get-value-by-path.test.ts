import { describe, expect, it } from 'vitest'

import { getValueByPath } from './get-value-by-path'

describe('getValueByPath', () => {
  it('should return the value at a simple path', () => {
    const target = {
      foo: 'bar',
    }
    const result = getValueByPath(target, ['foo'])

    expect(result).toEqual({
      context: '',
      value: 'bar',
    })
  })

  it('should return the value at a nested path', () => {
    const target = {
      foo: {
        bar: {
          baz: 42,
        },
      },
    }
    const result = getValueByPath(target, ['foo', 'bar', 'baz'])

    expect(result).toEqual({
      context: '',
      value: 42,
    })
  })

  it('should return context with $id when found', () => {
    const target = {
      foo: {
        $id: 'https://example.com/schema',
        bar: {
          baz: 'value',
        },
      },
    }
    const result = getValueByPath(target, ['foo', 'bar', 'baz'])

    expect(result).toEqual({
      context: 'https://example.com/schema',
      value: 'value',
    })
  })

  it('should preserve context from parent when child has no $id', () => {
    const target = {
      foo: {
        $id: 'https://example.com/parent',
        bar: {
          baz: 'value',
        },
      },
    }
    const result = getValueByPath(target, ['foo', 'bar', 'baz'])

    expect(result).toEqual({
      context: 'https://example.com/parent',
      value: 'value',
    })
  })

  it('should update context when child has $id', () => {
    const target = {
      foo: {
        $id: 'https://example.com/parent',
        bar: {
          $id: 'https://example.com/child',
          baz: 'value',
        },
      },
    }
    const result = getValueByPath(target, ['foo', 'bar', 'baz'])

    expect(result).toEqual({
      context: 'https://example.com/child',
      value: 'value',
    })
  })

  it('should return undefined value when path does not exist', () => {
    const target = {
      foo: 'bar',
    }
    const result = getValueByPath(target, ['nonexistent'])

    expect(result).toEqual({
      context: '',
      value: undefined,
    })
  })

  it('should return undefined value when path partially exists', () => {
    const target = {
      foo: {
        bar: 'baz',
      },
    }
    const result = getValueByPath(target, ['foo', 'nonexistent'])

    expect(result).toEqual({
      context: '',
      value: undefined,
    })
  })

  it('should return undefined value when traversing through null', () => {
    const target = {
      foo: null,
    }
    const result = getValueByPath(target, ['foo', 'bar'])

    expect(result).toEqual({
      context: '',
      value: undefined,
    })
  })

  it('should return undefined value when traversing through primitive', () => {
    const target = {
      foo: 'string',
    }
    const result = getValueByPath(target, ['foo', 'bar'])

    expect(result).toEqual({
      context: '',
      value: undefined,
    })
  })

  it('should handle empty segments array', () => {
    const target = {
      foo: 'bar',
    }
    const result = getValueByPath(target, [])

    expect(result).toEqual({
      context: '',
      value: target,
    })
  })

  it('should handle array indices in path', () => {
    const target = {
      items: [{ name: 'first' }, { name: 'second' }],
    }
    const result = getValueByPath(target, ['items', '0', 'name'])

    expect(result).toEqual({
      context: '',
      value: 'first',
    })
  })

  it('should handle objects with numeric keys', () => {
    const target = {
      '0': 'zero',
      '1': 'one',
    }
    const result = getValueByPath(target, ['0'])

    expect(result).toEqual({
      context: '',
      value: 'zero',
    })
  })

  it('should handle deeply nested objects', () => {
    const target = {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: 'deep',
              },
            },
          },
        },
      },
    }
    const result = getValueByPath(target, ['level1', 'level2', 'level3', 'level4', 'level5', 'value'])

    expect(result).toEqual({
      context: '',
      value: 'deep',
    })
  })

  it('should handle mixed data types in path', () => {
    const target = {
      string: 'text',
      number: 42,
      boolean: true,
      null: null,
      array: [1, 2, 3],
      object: { nested: 'value' },
    }

    expect(getValueByPath(target, ['string'])).toEqual({ context: '', value: 'text' })
    expect(getValueByPath(target, ['number'])).toEqual({ context: '', value: 42 })
    expect(getValueByPath(target, ['boolean'])).toEqual({ context: '', value: true })
    expect(getValueByPath(target, ['null'])).toEqual({ context: '', value: null })
    expect(getValueByPath(target, ['array'])).toEqual({ context: '', value: [1, 2, 3] })
    expect(getValueByPath(target, ['object', 'nested'])).toEqual({ context: '', value: 'value' })
  })

  it('should handle $id with different formats', () => {
    const target = {
      schema1: {
        $id: 'https://example.com/schema1',
        value: 'test1',
      },
      schema2: {
        $id: 'urn:uuid:123e4567-e89b-12d3-a456-426614174000',
        value: 'test2',
      },
      schema3: {
        $id: 'relative/path',
        value: 'test3',
      },
    }

    expect(getValueByPath(target, ['schema1', 'value'])).toEqual({
      context: 'https://example.com/schema1',
      value: 'test1',
    })
    expect(getValueByPath(target, ['schema2', 'value'])).toEqual({
      context: 'urn:uuid:123e4567-e89b-12d3-a456-426614174000',
      value: 'test2',
    })
    expect(getValueByPath(target, ['schema3', 'value'])).toEqual({
      context: 'relative/path',
      value: 'test3',
    })
  })

  it('should ignore non-string $id values', () => {
    const target = {
      schema1: {
        $id: 123, // number
        value: 'test1',
      },
      schema2: {
        $id: { nested: 'object' }, // object
        value: 'test2',
      },
      schema3: {
        $id: null, // null
        value: 'test3',
      },
    }

    expect(getValueByPath(target, ['schema1', 'value'])).toEqual({
      context: '',
      value: 'test1',
    })
    expect(getValueByPath(target, ['schema2', 'value'])).toEqual({
      context: '',
      value: 'test2',
    })
    expect(getValueByPath(target, ['schema3', 'value'])).toEqual({
      context: '',
      value: 'test3',
    })
  })

  it('should handle context inheritance through multiple levels', () => {
    const target = {
      root: {
        $id: 'https://example.com/root',
        level1: {
          level2: {
            $id: 'https://example.com/level2',
            level3: {
              level4: {
                value: 'nested',
              },
            },
          },
        },
      },
    }

    // Should use root context when no intermediate $id
    expect(getValueByPath(target, ['root', 'level1', 'level2', 'level3', 'level4', 'value'])).toEqual({
      context: 'https://example.com/level2',
      value: 'nested',
    })
  })

  it('should handle edge case with empty string keys', () => {
    const target = {
      '': 'empty key',
      normal: 'normal key',
    }

    expect(getValueByPath(target, [''])).toEqual({
      context: '',
      value: 'empty key',
    })
    expect(getValueByPath(target, ['normal'])).toEqual({
      context: '',
      value: 'normal key',
    })
  })

  it('should handle special characters in keys', () => {
    const target = {
      'key-with-dash': 'dash',
      'key_with_underscore': 'underscore',
      'key.with.dots': 'dots',
      'key with spaces': 'spaces',
    }

    expect(getValueByPath(target, ['key-with-dash'])).toEqual({
      context: '',
      value: 'dash',
    })
    expect(getValueByPath(target, ['key_with_underscore'])).toEqual({
      context: '',
      value: 'underscore',
    })
    expect(getValueByPath(target, ['key.with.dots'])).toEqual({
      context: '',
      value: 'dots',
    })
    expect(getValueByPath(target, ['key with spaces'])).toEqual({
      context: '',
      value: 'spaces',
    })
  })
})
