import { describe, expect, it } from 'vitest'

import { Raw, objectToString } from './php'

describe('php', () => {
  describe('objectToString', () => {
    it('converts null to null', () => {
      expect(objectToString(null)).toBe('null')
    })

    it('converts undefined to null', () => {
      expect(objectToString(undefined)).toBe('null')
    })

    it('converts a simple string to single-quoted string', () => {
      expect(objectToString('hello')).toBe("'hello'")
    })

    it('converts an empty string to single-quoted string', () => {
      expect(objectToString('')).toBe("''")
    })

    it('escapes single quotes in strings', () => {
      expect(objectToString("don't")).toBe("'don\\'t'")
    })

    it('escapes multiple single quotes in strings', () => {
      expect(objectToString("it's a 'test'")).toBe("'it\\'s a \\'test\\''")
    })

    it('converts a number to string representation', () => {
      expect(objectToString(42)).toBe('42')
    })

    it('converts zero to string representation', () => {
      expect(objectToString(0)).toBe('0')
    })

    it('converts negative numbers to string representation', () => {
      expect(objectToString(-10)).toBe('-10')
    })

    it('converts floating point numbers to string representation', () => {
      expect(objectToString(3.14)).toBe('3.14')
    })

    it('converts true boolean to string representation', () => {
      expect(objectToString(true)).toBe('true')
    })

    it('converts false boolean to string representation', () => {
      expect(objectToString(false)).toBe('false')
    })

    it('converts an empty array to empty array syntax', () => {
      expect(objectToString([])).toBe('[]')
    })

    it('converts a simple array with one element', () => {
      expect(objectToString([1])).toBe('[\n  1\n]')
    })

    it('converts a simple array with multiple elements', () => {
      expect(objectToString([1, 2, 3])).toBe('[\n  1,\n  2,\n  3\n]')
    })

    it('converts an array with mixed types', () => {
      expect(objectToString([1, 'hello', true])).toBe("[\n  1,\n  'hello',\n  true\n]")
    })

    it('converts an empty object to empty array syntax', () => {
      expect(objectToString({})).toBe('[]')
    })

    it('converts a simple object with one property', () => {
      expect(objectToString({ foo: 'bar' })).toBe("[\n  'foo' => 'bar'\n]")
    })

    it('converts a simple object with multiple properties', () => {
      expect(objectToString({ foo: 'bar', baz: 'qux' })).toBe("[\n  'foo' => 'bar',\n  'baz' => 'qux'\n]")
    })

    it('converts an object with mixed value types', () => {
      expect(objectToString({ name: 'John', age: 30, active: true })).toBe(
        "[\n  'name' => 'John',\n  'age' => 30,\n  'active' => true\n]",
      )
    })

    it('converts a nested array', () => {
      expect(objectToString([1, [2, 3]])).toBe('[\n  1,\n  [\n    2,\n    3\n  ]\n]')
    })

    it('converts an array with nested objects', () => {
      expect(objectToString([{ foo: 'bar' }, { baz: 'qux' }])).toBe(
        "[\n  [\n    'foo' => 'bar'\n  ],\n  [\n    'baz' => 'qux'\n  ]\n]",
      )
    })

    it('converts an object with nested arrays', () => {
      expect(objectToString({ items: [1, 2, 3] })).toBe("[\n  'items' => [\n    1,\n    2,\n    3\n  ]\n]")
    })

    it('converts an object with nested objects', () => {
      expect(objectToString({ user: { name: 'John', age: 30 } })).toBe(
        "[\n  'user' => [\n    'name' => 'John',\n    'age' => 30\n  ]\n]",
      )
    })

    it('converts deeply nested structures', () => {
      expect(objectToString({ a: { b: { c: 'value' } } })).toBe(
        "[\n  'a' => [\n    'b' => [\n      'c' => 'value'\n    ]\n  ]\n]",
      )
    })

    it('converts an object with null values', () => {
      expect(objectToString({ foo: null, bar: 'baz' })).toBe("[\n  'foo' => null,\n  'bar' => 'baz'\n]")
    })

    it('converts an object with undefined values', () => {
      expect(objectToString({ foo: undefined, bar: 'baz' })).toBe("[\n  'foo' => null,\n  'bar' => 'baz'\n]")
    })

    it('converts an array with null and undefined', () => {
      expect(objectToString([null, undefined, 'value'])).toBe("[\n  null,\n  null,\n  'value'\n]")
    })

    it('handles strings with special characters', () => {
      expect(objectToString('it\'s a "test"')).toBe("'it\\'s a \"test\"'")
    })

    it('handles object keys with special characters', () => {
      // Note: keys are not escaped, only values are escaped
      expect(objectToString({ "key'with'quotes": 'value' })).toBe("[\n  'key'with'quotes' => 'value'\n]")
    })

    it('handles complex nested structure with arrays and objects', () => {
      expect(objectToString({ users: [{ name: 'John' }, { name: 'Jane' }] })).toBe(
        "[\n  'users' => [\n    [\n      'name' => 'John'\n    ],\n    [\n      'name' => 'Jane'\n    ]\n  ]\n]",
      )
    })

    it('preserves indentation at different levels', () => {
      const result = objectToString({ a: { b: { c: 'value' } } }, 1)
      expect(result).toContain("'a' => [")
      expect(result).toContain("'b' => [")
      expect(result).toContain("'c' => 'value'")
    })

    it('handles array with empty nested arrays', () => {
      expect(objectToString([[], [1, 2]])).toBe('[\n  [],\n  [\n    1,\n    2\n  ]\n]')
    })

    it('handles object with empty nested objects', () => {
      expect(objectToString({ empty: {}, filled: { key: 'value' } })).toBe(
        "[\n  'empty' => [],\n  'filled' => [\n    'key' => 'value'\n  ]\n]",
      )
    })

    it('handles Raw values without quotes', () => {
      expect(objectToString({ file: new Raw("fopen('test.txt', 'r')") })).toBe(
        "[\n  'file' => fopen('test.txt', 'r')\n]",
      )
    })

    it('handles Raw values in arrays', () => {
      expect(objectToString([new Raw("fopen('file1.txt', 'r')"), new Raw("fopen('file2.txt', 'r')")])).toBe(
        "[\n  fopen('file1.txt', 'r'),\n  fopen('file2.txt', 'r')\n]",
      )
    })

    it('handles Raw values with multi-line content', () => {
      const rawValue = new Raw('function() {\n  return true;\n}')
      expect(objectToString({ func: rawValue })).toBe("[\n  'func' => function() {\n      return true;\n    }\n]")
    })

    it('handles nested Raw values', () => {
      expect(
        objectToString({
          options: {
            file: new Raw("fopen('test.txt', 'r')"),
            mode: 'read',
          },
        }),
      ).toBe("[\n  'options' => [\n    'file' => fopen('test.txt', 'r'),\n    'mode' => 'read'\n  ]\n]")
    })
  })
})
