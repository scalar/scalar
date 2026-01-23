import { describe, expect, it } from 'vitest'

import {
  serializeContentValue,
  serializeDeepObjectStyle,
  serializeFormStyle,
  serializeFormStyleForCookies,
  serializePipeDelimitedStyle,
  serializeSimpleStyle,
  serializeSpaceDelimitedStyle,
} from './serialize-parameter'

/**
 * Comprehensive tests for OpenAPI Parameter Object serialization.
 * Tests cover all style variations defined in the OpenAPI specification.
 *
 * @see https://spec.openapis.org/oas/latest.html#parameter-object
 * @see https://spec.openapis.org/oas/latest.html#style-values
 */

describe('serializeContentValue', () => {
  describe('JSON content types', () => {
    it('serializes objects to JSON strings', () => {
      const value = { name: 'John', age: 30 }
      const result = serializeContentValue(value, 'application/json')
      expect(result).toBe('{"name":"John","age":30}')
    })

    it('serializes arrays to JSON strings', () => {
      const value = ['red', 'green', 'blue']
      const result = serializeContentValue(value, 'application/json')
      expect(result).toBe('["red","green","blue"]')
    })

    it('serializes numbers to JSON strings', () => {
      const value = 42
      const result = serializeContentValue(value, 'application/json')
      expect(result).toBe('42')
    })

    it('serializes booleans to JSON strings', () => {
      const value = true
      const result = serializeContentValue(value, 'application/json')
      expect(result).toBe('true')
    })

    it('serializes null to JSON string', () => {
      const value = null
      const result = serializeContentValue(value, 'application/json')
      expect(result).toBe('null')
    })

    it('handles application/vnd.api+json content type', () => {
      const value = { data: { type: 'users', id: '1' } }
      const result = serializeContentValue(value, 'application/vnd.api+json')
      expect(result).toBe('{"data":{"type":"users","id":"1"}}')
    })
  })

  describe('string values', () => {
    it('returns string values as-is', () => {
      const value = 'already a string'
      const result = serializeContentValue(value, 'application/json')
      expect(result).toBe('already a string')
    })

    it('returns empty strings as-is', () => {
      const value = ''
      const result = serializeContentValue(value, 'text/plain')
      expect(result).toBe('')
    })
  })

  describe('non-JSON content types', () => {
    it('converts numbers to strings for text/plain', () => {
      const value = 123
      const result = serializeContentValue(value, 'text/plain')
      expect(result).toBe('123')
    })

    it('serializes objects to JSON strings for text/plain', () => {
      const value = { key: 'value' }
      const result = serializeContentValue(value, 'text/plain')
      expect(result).toBe('{"key":"value"}')
    })

    it('converts arrays to comma-separated strings for text/plain', () => {
      const value = [1, 2, 3]
      const result = serializeContentValue(value, 'text/plain')
      expect(result).toBe('1,2,3')
    })
  })
})

describe('serializeSimpleStyle', () => {
  describe('primitive values', () => {
    it('returns string primitives as-is', () => {
      expect(serializeSimpleStyle('blue', false)).toBe('blue')
      expect(serializeSimpleStyle('blue', true)).toBe('blue')
    })

    it('returns number primitives as-is', () => {
      expect(serializeSimpleStyle(5, false)).toBe(5)
      expect(serializeSimpleStyle(5, true)).toBe(5)
    })

    it('returns boolean primitives as-is', () => {
      expect(serializeSimpleStyle(true, false)).toBe(true)
      expect(serializeSimpleStyle(false, true)).toBe(false)
    })

    it('returns null as-is', () => {
      expect(serializeSimpleStyle(null, false)).toBe(null)
      expect(serializeSimpleStyle(null, true)).toBe(null)
    })

    it('returns undefined as-is', () => {
      expect(serializeSimpleStyle(undefined, false)).toBe(undefined)
      expect(serializeSimpleStyle(undefined, true)).toBe(undefined)
    })
  })

  describe('array values', () => {
    it('serializes arrays with explode: false as comma-separated', () => {
      const value = ['blue', 'black', 'brown']
      expect(serializeSimpleStyle(value, false)).toBe('blue,black,brown')
    })

    it('serializes arrays with explode: true as comma-separated (same as false)', () => {
      const value = ['blue', 'black', 'brown']
      expect(serializeSimpleStyle(value, true)).toBe('blue,black,brown')
    })

    it('handles empty arrays', () => {
      expect(serializeSimpleStyle([], false)).toBe('')
      expect(serializeSimpleStyle([], true)).toBe('')
    })

    it('handles single-element arrays', () => {
      expect(serializeSimpleStyle(['blue'], false)).toBe('blue')
      expect(serializeSimpleStyle(['blue'], true)).toBe('blue')
    })

    it('handles arrays with numeric values', () => {
      expect(serializeSimpleStyle([1, 2, 3], false)).toBe('1,2,3')
    })

    it('handles arrays with mixed types', () => {
      expect(serializeSimpleStyle(['a', 1, true], false)).toBe('a,1,true')
    })

    it('handles arrays with null values', () => {
      expect(serializeSimpleStyle(['a', null, 'b'], false)).toBe('a,,b')
    })
  })

  describe('object values', () => {
    it('serializes objects with explode: false as comma-separated key,value pairs', () => {
      const value = { R: 100, G: 200, B: 150 }
      expect(serializeSimpleStyle(value, false)).toBe('R,100,G,200,B,150')
    })

    it('serializes objects with explode: true as comma-separated key=value pairs', () => {
      const value = { R: 100, G: 200, B: 150 }
      expect(serializeSimpleStyle(value, true)).toBe('R=100,G=200,B=150')
    })

    it('handles empty objects', () => {
      expect(serializeSimpleStyle({}, false)).toBe('')
      expect(serializeSimpleStyle({}, true)).toBe('')
    })

    it('handles single-property objects', () => {
      expect(serializeSimpleStyle({ color: 'blue' }, false)).toBe('color,blue')
      expect(serializeSimpleStyle({ color: 'blue' }, true)).toBe('color=blue')
    })

    it('handles objects with numeric values', () => {
      expect(serializeSimpleStyle({ x: 10, y: 20 }, false)).toBe('x,10,y,20')
      expect(serializeSimpleStyle({ x: 10, y: 20 }, true)).toBe('x=10,y=20')
    })

    it('handles objects with boolean values', () => {
      expect(serializeSimpleStyle({ active: true, visible: false }, false)).toBe('active,true,visible,false')
      expect(serializeSimpleStyle({ active: true, visible: false }, true)).toBe('active=true,visible=false')
    })

    it('handles objects with null values', () => {
      expect(serializeSimpleStyle({ a: null, b: 'value' }, false)).toBe('a,null,b,value')
      expect(serializeSimpleStyle({ a: null, b: 'value' }, true)).toBe('a=null,b=value')
    })

    it('handles objects with string values containing special characters', () => {
      expect(serializeSimpleStyle({ name: 'John Doe', email: 'john@example.com' }, false)).toBe(
        'name,John Doe,email,john@example.com',
      )
      expect(serializeSimpleStyle({ name: 'John Doe', email: 'john@example.com' }, true)).toBe(
        'name=John Doe,email=john@example.com',
      )
    })
  })
})

describe('serializeFormStyle', () => {
  describe('primitive values', () => {
    it('returns string primitives as-is', () => {
      expect(serializeFormStyle('blue', false)).toBe('blue')
      expect(serializeFormStyle('blue', true)).toBe('blue')
    })

    it('returns number primitives as-is', () => {
      expect(serializeFormStyle(5, false)).toBe(5)
      expect(serializeFormStyle(5, true)).toBe(5)
    })

    it('returns boolean primitives as-is', () => {
      expect(serializeFormStyle(true, false)).toBe(true)
      expect(serializeFormStyle(false, true)).toBe(false)
    })
  })

  describe('array values with explode: false', () => {
    it('serializes arrays as comma-separated values', () => {
      const value = ['blue', 'black', 'brown']
      expect(serializeFormStyle(value, false)).toBe('blue,black,brown')
    })

    it('handles empty arrays', () => {
      expect(serializeFormStyle([], false)).toBe('')
    })

    it('handles single-element arrays', () => {
      expect(serializeFormStyle(['blue'], false)).toBe('blue')
    })

    it('handles arrays with numeric values', () => {
      expect(serializeFormStyle([1, 2, 3], false)).toBe('1,2,3')
    })

    it('handles arrays with null values', () => {
      expect(serializeFormStyle(['a', null, 'b'], false)).toBe('a,,b')
    })
  })

  describe('array values with explode: true', () => {
    it('returns array of key-value objects for multiple entries', () => {
      const value = ['blue', 'black', 'brown']
      const result = serializeFormStyle(value, true)
      expect(result).toEqual([
        { key: '', value: 'blue' },
        { key: '', value: 'black' },
        { key: '', value: 'brown' },
      ])
    })

    it('handles empty arrays', () => {
      expect(serializeFormStyle([], true)).toEqual([])
    })

    it('handles single-element arrays', () => {
      const result = serializeFormStyle(['blue'], true)
      expect(result).toEqual([{ key: '', value: 'blue' }])
    })

    it('handles arrays with numeric values', () => {
      const result = serializeFormStyle([1, 2, 3], true)
      expect(result).toEqual([
        { key: '', value: 1 },
        { key: '', value: 2 },
        { key: '', value: 3 },
      ])
    })

    it('handles arrays with null values', () => {
      const result = serializeFormStyle(['a', null, 'b'], true)
      expect(result).toEqual([
        { key: '', value: 'a' },
        { key: '', value: null },
        { key: '', value: 'b' },
      ])
    })
  })

  describe('object values with explode: false', () => {
    it('serializes objects as comma-separated key,value pairs', () => {
      const value = { R: 100, G: 200, B: 150 }
      expect(serializeFormStyle(value, false)).toBe('R,100,G,200,B,150')
    })

    it('handles empty objects', () => {
      expect(serializeFormStyle({}, false)).toBe('')
    })

    it('handles single-property objects', () => {
      expect(serializeFormStyle({ color: 'blue' }, false)).toBe('color,blue')
    })

    it('handles objects with numeric values', () => {
      expect(serializeFormStyle({ x: 10, y: 20 }, false)).toBe('x,10,y,20')
    })

    it('handles objects with boolean values', () => {
      expect(serializeFormStyle({ active: true, visible: false }, false)).toBe('active,true,visible,false')
    })

    it('handles objects with null values', () => {
      expect(serializeFormStyle({ a: null, b: 'value' }, false)).toBe('a,null,b,value')
    })
  })

  describe('object values with explode: true', () => {
    it('returns array of key-value objects for each property', () => {
      const value = { R: 100, G: 200, B: 150 }
      const result = serializeFormStyle(value, true)
      expect(result).toEqual([
        { key: 'R', value: 100 },
        { key: 'G', value: 200 },
        { key: 'B', value: 150 },
      ])
    })

    it('handles empty objects', () => {
      expect(serializeFormStyle({}, true)).toEqual([])
    })

    it('handles single-property objects', () => {
      const result = serializeFormStyle({ color: 'blue' }, true)
      expect(result).toEqual([{ key: 'color', value: 'blue' }])
    })

    it('handles objects with string values', () => {
      const result = serializeFormStyle({ firstName: 'John', lastName: 'Doe' }, true)
      expect(result).toEqual([
        { key: 'firstName', value: 'John' },
        { key: 'lastName', value: 'Doe' },
      ])
    })

    it('handles objects with null values', () => {
      const result = serializeFormStyle({ a: null, b: 'value' }, true)
      expect(result).toEqual([
        { key: 'a', value: null },
        { key: 'b', value: 'value' },
      ])
    })
  })
})

describe('serializeFormStyleForCookies', () => {
  describe('primitive values', () => {
    it('returns string primitives as-is', () => {
      expect(serializeFormStyleForCookies('session123', false)).toBe('session123')
      expect(serializeFormStyleForCookies('session123', true)).toBe('session123')
    })

    it('returns number primitives as-is', () => {
      expect(serializeFormStyleForCookies(42, false)).toBe(42)
      expect(serializeFormStyleForCookies(42, true)).toBe(42)
    })

    it('returns boolean primitives as-is', () => {
      expect(serializeFormStyleForCookies(true, false)).toBe(true)
      expect(serializeFormStyleForCookies(false, true)).toBe(false)
    })
  })

  describe('array values with explode: false', () => {
    it('serializes arrays as comma-separated values', () => {
      const value = ['blue', 'black', 'brown']
      expect(serializeFormStyleForCookies(value, false)).toBe('blue,black,brown')
    })

    it('converts null values to "null" string', () => {
      const value = ['a', null, 'b']
      expect(serializeFormStyleForCookies(value, false)).toBe('a,null,b')
    })

    it('handles empty arrays', () => {
      expect(serializeFormStyleForCookies([], false)).toBe('')
    })

    it('handles arrays with numeric values', () => {
      expect(serializeFormStyleForCookies([1, 2, 3], false)).toBe('1,2,3')
    })

    it('handles arrays with boolean values', () => {
      expect(serializeFormStyleForCookies([true, false], false)).toBe('true,false')
    })
  })

  describe('array values with explode: true', () => {
    it('returns array of key-value objects for multiple entries', () => {
      const value = ['blue', 'black', 'brown']
      const result = serializeFormStyleForCookies(value, true)
      expect(result).toEqual([
        { key: '', value: 'blue' },
        { key: '', value: 'black' },
        { key: '', value: 'brown' },
      ])
    })

    it('preserves null values in exploded arrays', () => {
      const value = ['a', null, 'b']
      const result = serializeFormStyleForCookies(value, true)
      expect(result).toEqual([
        { key: '', value: 'a' },
        { key: '', value: null },
        { key: '', value: 'b' },
      ])
    })
  })

  describe('object values with explode: false', () => {
    it('serializes flat objects as comma-separated key,value pairs', () => {
      const value = { R: 100, G: 200, B: 150 }
      expect(serializeFormStyleForCookies(value, false)).toBe('R,100,G,200,B,150')
    })

    it('recursively flattens nested objects', () => {
      const value = { user: { name: 'John', age: 30 }, role: 'admin' }
      expect(serializeFormStyleForCookies(value, false)).toBe('user,name,John,age,30,role,admin')
    })

    it('converts null values to "null" string in objects', () => {
      const value = { a: null, b: 'value' }
      expect(serializeFormStyleForCookies(value, false)).toBe('a,null,b,value')
    })

    it('handles deeply nested objects', () => {
      const value = { level1: { level2: { level3: 'deep' } } }
      expect(serializeFormStyleForCookies(value, false)).toBe('level1,level2,level3,deep')
    })

    it('handles objects with mixed nested structures', () => {
      const value = { name: 'John', address: { city: 'NYC', zip: 10001 }, active: true }
      expect(serializeFormStyleForCookies(value, false)).toBe('name,John,address,city,NYC,zip,10001,active,true')
    })

    it('handles empty objects', () => {
      expect(serializeFormStyleForCookies({}, false)).toBe('')
    })
  })

  describe('object values with explode: true', () => {
    it('returns array of key-value objects for each property', () => {
      const value = { R: 100, G: 200, B: 150 }
      const result = serializeFormStyleForCookies(value, true)
      expect(result).toEqual([
        { key: 'R', value: 100 },
        { key: 'G', value: 200 },
        { key: 'B', value: 150 },
      ])
    })

    it('handles nested objects with explode: true', () => {
      const value = { user: { name: 'John' }, role: 'admin' }
      const result = serializeFormStyleForCookies(value, true)
      expect(result).toEqual([
        { key: 'user', value: { name: 'John' } },
        { key: 'role', value: 'admin' },
      ])
    })

    it('preserves null values in exploded objects', () => {
      const value = { a: null, b: 'value' }
      const result = serializeFormStyleForCookies(value, true)
      expect(result).toEqual([
        { key: 'a', value: null },
        { key: 'b', value: 'value' },
      ])
    })
  })
})

describe('serializeSpaceDelimitedStyle', () => {
  describe('array values', () => {
    it('serializes arrays as space-separated values', () => {
      const value = ['blue', 'black', 'brown']
      expect(serializeSpaceDelimitedStyle(value)).toBe('blue black brown')
    })

    it('handles empty arrays', () => {
      expect(serializeSpaceDelimitedStyle([])).toBe('')
    })

    it('handles single-element arrays', () => {
      expect(serializeSpaceDelimitedStyle(['blue'])).toBe('blue')
    })

    it('handles arrays with numeric values', () => {
      expect(serializeSpaceDelimitedStyle([1, 2, 3])).toBe('1 2 3')
    })

    it('handles arrays with boolean values', () => {
      expect(serializeSpaceDelimitedStyle([true, false])).toBe('true false')
    })

    it('handles arrays with null values', () => {
      expect(serializeSpaceDelimitedStyle(['a', null, 'b'])).toBe('a  b')
    })

    it('handles arrays with values containing spaces', () => {
      expect(serializeSpaceDelimitedStyle(['hello world', 'foo bar'])).toBe('hello world foo bar')
    })
  })

  describe('object values', () => {
    it('serializes objects as space-separated key value pairs', () => {
      const value = { R: 100, G: 200, B: 150 }
      expect(serializeSpaceDelimitedStyle(value)).toBe('R 100 G 200 B 150')
    })

    it('handles empty objects', () => {
      expect(serializeSpaceDelimitedStyle({})).toBe('')
    })

    it('handles single-property objects', () => {
      expect(serializeSpaceDelimitedStyle({ color: 'blue' })).toBe('color blue')
    })

    it('handles objects with numeric values', () => {
      expect(serializeSpaceDelimitedStyle({ x: 10, y: 20 })).toBe('x 10 y 20')
    })

    it('handles objects with boolean values', () => {
      expect(serializeSpaceDelimitedStyle({ active: true, visible: false })).toBe('active true visible false')
    })

    it('handles objects with null values', () => {
      expect(serializeSpaceDelimitedStyle({ a: null, b: 'value' })).toBe('a null b value')
    })
  })

  describe('primitive values', () => {
    it('converts string primitives to strings', () => {
      expect(serializeSpaceDelimitedStyle('blue')).toBe('blue')
    })

    it('converts number primitives to strings', () => {
      expect(serializeSpaceDelimitedStyle(42)).toBe('42')
    })

    it('converts boolean primitives to strings', () => {
      expect(serializeSpaceDelimitedStyle(true)).toBe('true')
    })

    it('converts null to string', () => {
      expect(serializeSpaceDelimitedStyle(null)).toBe('null')
    })
  })
})

describe('serializePipeDelimitedStyle', () => {
  describe('array values', () => {
    it('serializes arrays as pipe-separated values', () => {
      const value = ['blue', 'black', 'brown']
      expect(serializePipeDelimitedStyle(value)).toBe('blue|black|brown')
    })

    it('handles empty arrays', () => {
      expect(serializePipeDelimitedStyle([])).toBe('')
    })

    it('handles single-element arrays', () => {
      expect(serializePipeDelimitedStyle(['blue'])).toBe('blue')
    })

    it('handles arrays with numeric values', () => {
      expect(serializePipeDelimitedStyle([1, 2, 3])).toBe('1|2|3')
    })

    it('handles arrays with boolean values', () => {
      expect(serializePipeDelimitedStyle([true, false])).toBe('true|false')
    })

    it('handles arrays with null values', () => {
      expect(serializePipeDelimitedStyle(['a', null, 'b'])).toBe('a||b')
    })

    it('handles arrays with values containing pipes', () => {
      expect(serializePipeDelimitedStyle(['a|b', 'c|d'])).toBe('a|b|c|d')
    })
  })

  describe('object values', () => {
    it('serializes objects as pipe-separated key|value pairs', () => {
      const value = { R: 100, G: 200, B: 150 }
      expect(serializePipeDelimitedStyle(value)).toBe('R|100|G|200|B|150')
    })

    it('handles empty objects', () => {
      expect(serializePipeDelimitedStyle({})).toBe('')
    })

    it('handles single-property objects', () => {
      expect(serializePipeDelimitedStyle({ color: 'blue' })).toBe('color|blue')
    })

    it('handles objects with numeric values', () => {
      expect(serializePipeDelimitedStyle({ x: 10, y: 20 })).toBe('x|10|y|20')
    })

    it('handles objects with boolean values', () => {
      expect(serializePipeDelimitedStyle({ active: true, visible: false })).toBe('active|true|visible|false')
    })

    it('handles objects with null values', () => {
      expect(serializePipeDelimitedStyle({ a: null, b: 'value' })).toBe('a||b|value')
    })
  })

  describe('primitive values', () => {
    it('converts string primitives to strings', () => {
      expect(serializePipeDelimitedStyle('blue')).toBe('blue')
    })

    it('converts number primitives to strings', () => {
      expect(serializePipeDelimitedStyle(42)).toBe('42')
    })

    it('converts boolean primitives to strings', () => {
      expect(serializePipeDelimitedStyle(true)).toBe('true')
    })

    it('converts null to string', () => {
      expect(serializePipeDelimitedStyle(null)).toBe('null')
    })
  })
})

describe('serializeDeepObjectStyle', () => {
  describe('flat objects', () => {
    it('serializes flat objects with bracket notation', () => {
      const value = { R: 100, G: 200, B: 150 }
      const result = serializeDeepObjectStyle('color', value)
      expect(result).toEqual([
        { key: 'color[R]', value: '100' },
        { key: 'color[G]', value: '200' },
        { key: 'color[B]', value: '150' },
      ])
    })

    it('handles single-property objects', () => {
      const result = serializeDeepObjectStyle('filter', { name: 'John' })
      expect(result).toEqual([{ key: 'filter[name]', value: 'John' }])
    })

    it('handles objects with string values', () => {
      const result = serializeDeepObjectStyle('user', { firstName: 'John', lastName: 'Doe' })
      expect(result).toEqual([
        { key: 'user[firstName]', value: 'John' },
        { key: 'user[lastName]', value: 'Doe' },
      ])
    })

    it('handles objects with numeric values', () => {
      const result = serializeDeepObjectStyle('coords', { x: 10, y: 20 })
      expect(result).toEqual([
        { key: 'coords[x]', value: '10' },
        { key: 'coords[y]', value: '20' },
      ])
    })

    it('handles objects with boolean values', () => {
      const result = serializeDeepObjectStyle('flags', { active: true, visible: false })
      expect(result).toEqual([
        { key: 'flags[active]', value: 'true' },
        { key: 'flags[visible]', value: 'false' },
      ])
    })

    it('handles objects with null values', () => {
      const result = serializeDeepObjectStyle('data', { a: null, b: 'value' })
      expect(result).toEqual([
        { key: 'data[a]', value: 'null' },
        { key: 'data[b]', value: 'value' },
      ])
    })
  })

  describe('nested objects', () => {
    it('serializes nested objects with multiple bracket levels', () => {
      const value = {
        name: { first: 'Alex', last: 'Smith' },
        role: 'admin',
      }
      const result = serializeDeepObjectStyle('user', value)
      expect(result).toEqual([
        { key: 'user[name][first]', value: 'Alex' },
        { key: 'user[name][last]', value: 'Smith' },
        { key: 'user[role]', value: 'admin' },
      ])
    })

    it('handles deeply nested objects', () => {
      const value = {
        level1: {
          level2: {
            level3: 'deep',
          },
        },
      }
      const result = serializeDeepObjectStyle('data', value)
      expect(result).toEqual([{ key: 'data[level1][level2][level3]', value: 'deep' }])
    })

    it('handles mixed nested structures', () => {
      const value = {
        name: 'John',
        address: {
          city: 'NYC',
          zip: 10001,
        },
        active: true,
      }
      const result = serializeDeepObjectStyle('user', value)
      expect(result).toEqual([
        { key: 'user[name]', value: 'John' },
        { key: 'user[address][city]', value: 'NYC' },
        { key: 'user[address][zip]', value: '10001' },
        { key: 'user[active]', value: 'true' },
      ])
    })

    it('handles objects with multiple nested levels', () => {
      const value = {
        user: {
          profile: {
            name: {
              first: 'John',
              last: 'Doe',
            },
            age: 30,
          },
        },
      }
      const result = serializeDeepObjectStyle('data', value)
      expect(result).toEqual([
        { key: 'data[user][profile][name][first]', value: 'John' },
        { key: 'data[user][profile][name][last]', value: 'Doe' },
        { key: 'data[user][profile][age]', value: '30' },
      ])
    })
  })

  describe('edge cases', () => {
    it('handles empty objects', () => {
      const result = serializeDeepObjectStyle('filter', {})
      expect(result).toEqual([])
    })

    it('handles objects with special characters in keys', () => {
      const result = serializeDeepObjectStyle('data', { 'user-name': 'John', 'user.email': 'john@example.com' })
      expect(result).toEqual([
        { key: 'data[user-name]', value: 'John' },
        { key: 'data[user.email]', value: 'john@example.com' },
      ])
    })

    it('handles objects with special characters in values', () => {
      const result = serializeDeepObjectStyle('filter', { name: 'John Doe', email: 'john@example.com' })
      expect(result).toEqual([
        { key: 'filter[name]', value: 'John Doe' },
        { key: 'filter[email]', value: 'john@example.com' },
      ])
    })

    it('handles parameter names with special characters', () => {
      const result = serializeDeepObjectStyle('user-filter', { name: 'John' })
      expect(result).toEqual([{ key: 'user-filter[name]', value: 'John' }])
    })

    it('returns empty array for non-object values', () => {
      expect(serializeDeepObjectStyle('param', 'string')).toEqual([])
      expect(serializeDeepObjectStyle('param', 123)).toEqual([])
      expect(serializeDeepObjectStyle('param', true)).toEqual([])
      expect(serializeDeepObjectStyle('param', null)).toEqual([])
    })

    it('returns empty array for array values', () => {
      expect(serializeDeepObjectStyle('param', ['a', 'b', 'c'])).toEqual([])
    })
  })
})

describe('OpenAPI specification compliance', () => {
  /**
   * These tests verify compliance with the OpenAPI specification examples.
   * @see https://spec.openapis.org/oas/latest.html#style-examples
   */

  describe('simple style (path and header parameters)', () => {
    it('matches spec example for primitive value', () => {
      // Spec: simple with explode=false, value=5 -> 5
      expect(serializeSimpleStyle(5, false)).toBe(5)
    })

    it('matches spec example for array without explode', () => {
      // Spec: simple with explode=false, value=[3,4,5] -> 3,4,5
      expect(serializeSimpleStyle([3, 4, 5], false)).toBe('3,4,5')
    })

    it('matches spec example for array with explode', () => {
      // Spec: simple with explode=true, value=[3,4,5] -> 3,4,5
      expect(serializeSimpleStyle([3, 4, 5], true)).toBe('3,4,5')
    })

    it('matches spec example for object without explode', () => {
      // Spec: simple with explode=false, value={role:admin,firstName:Alex} -> role,admin,firstName,Alex
      expect(serializeSimpleStyle({ role: 'admin', firstName: 'Alex' }, false)).toBe('role,admin,firstName,Alex')
    })

    it('matches spec example for object with explode', () => {
      // Spec: simple with explode=true, value={role:admin,firstName:Alex} -> role=admin,firstName=Alex
      expect(serializeSimpleStyle({ role: 'admin', firstName: 'Alex' }, true)).toBe('role=admin,firstName=Alex')
    })
  })

  describe('form style (query and cookie parameters)', () => {
    it('matches spec example for primitive value', () => {
      // Spec: form with explode=false, value=5 -> 5
      expect(serializeFormStyle(5, false)).toBe(5)
    })

    it('matches spec example for array without explode', () => {
      // Spec: form with explode=false, value=[3,4,5] -> 3,4,5
      expect(serializeFormStyle([3, 4, 5], false)).toBe('3,4,5')
    })

    it('matches spec example for array with explode', () => {
      // Spec: form with explode=true, value=[3,4,5] -> multiple entries
      const result = serializeFormStyle([3, 4, 5], true)
      expect(result).toEqual([
        { key: '', value: 3 },
        { key: '', value: 4 },
        { key: '', value: 5 },
      ])
    })

    it('matches spec example for object without explode', () => {
      // Spec: form with explode=false, value={role:admin,firstName:Alex} -> role,admin,firstName,Alex
      expect(serializeFormStyle({ role: 'admin', firstName: 'Alex' }, false)).toBe('role,admin,firstName,Alex')
    })

    it('matches spec example for object with explode', () => {
      // Spec: form with explode=true, value={role:admin,firstName:Alex} -> separate entries
      const result = serializeFormStyle({ role: 'admin', firstName: 'Alex' }, true)
      expect(result).toEqual([
        { key: 'role', value: 'admin' },
        { key: 'firstName', value: 'Alex' },
      ])
    })
  })

  describe('spaceDelimited style (query parameters only)', () => {
    it('matches spec example for array', () => {
      // Spec: spaceDelimited with value=[3,4,5] -> 3 4 5
      expect(serializeSpaceDelimitedStyle([3, 4, 5])).toBe('3 4 5')
    })

    it('matches spec example for object', () => {
      // Spec: spaceDelimited with value={role:admin,firstName:Alex} -> role admin firstName Alex
      expect(serializeSpaceDelimitedStyle({ role: 'admin', firstName: 'Alex' })).toBe('role admin firstName Alex')
    })
  })

  describe('pipeDelimited style (query parameters only)', () => {
    it('matches spec example for array', () => {
      // Spec: pipeDelimited with value=[3,4,5] -> 3|4|5
      expect(serializePipeDelimitedStyle([3, 4, 5])).toBe('3|4|5')
    })

    it('matches spec example for object', () => {
      // Spec: pipeDelimited with value={role:admin,firstName:Alex} -> role|admin|firstName|Alex
      expect(serializePipeDelimitedStyle({ role: 'admin', firstName: 'Alex' })).toBe('role|admin|firstName|Alex')
    })
  })

  describe('deepObject style (query parameters only)', () => {
    it('matches spec example for flat object', () => {
      // Spec: deepObject with value={role:admin,firstName:Alex} -> id[role]=admin&id[firstName]=Alex
      const result = serializeDeepObjectStyle('id', { role: 'admin', firstName: 'Alex' })
      expect(result).toEqual([
        { key: 'id[role]', value: 'admin' },
        { key: 'id[firstName]', value: 'Alex' },
      ])
    })

    it('matches spec example for nested object', () => {
      // Spec: deepObject with nested objects
      const result = serializeDeepObjectStyle('user', {
        name: { first: 'Alex', last: 'Smith' },
        role: 'admin',
      })
      expect(result).toEqual([
        { key: 'user[name][first]', value: 'Alex' },
        { key: 'user[name][last]', value: 'Smith' },
        { key: 'user[role]', value: 'admin' },
      ])
    })
  })
})
