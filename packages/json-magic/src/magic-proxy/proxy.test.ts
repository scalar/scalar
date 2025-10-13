import { describe, expect, it } from 'vitest'

import { createMagicProxy, getRaw } from './proxy'

describe('createMagicProxy', () => {
  describe('get', () => {
    it('should correctly proxy internal refs', () => {
      const input = {
        a: 'hello',
        b: {
          '$ref': '#/a',
        },
      }

      const result = createMagicProxy(input)
      expect(result.b).toEqual({ $ref: '#/a', '$ref-value': 'hello' })
    })

    it('should correctly proxy deep nested refs', () => {
      const input = {
        a: {
          b: {
            c: {
              d: {
                prop: 'hello',
              },
              e: {
                '$ref': '#/a/b/c/d',
              },
            },
          },
        },
      }

      const result = createMagicProxy(input) as any
      expect(result.a.b.c.e['$ref-value'].prop).toBe('hello')
    })

    it('should correctly proxy multi refs', () => {
      const input = {
        a: {
          b: {
            c: {
              prop: 'hello',
            },
          },
        },
        e: {
          f: {
            $ref: '#/a/b/c/prop',
          },
        },
        d: {
          $ref: '#/e/f',
        },
      }

      const result = createMagicProxy(input)

      expect(result.d).toEqual({
        $ref: '#/e/f',
        '$ref-value': {
          $ref: '#/a/b/c/prop',
          '$ref-value': 'hello',
        },
      })
    })

    it('should preserve information about the ref when the ref is resolved', () => {
      const input = {
        a: {
          b: {
            c: {
              d: {
                prop: 'hello',
              },
              e: {
                '$ref': '#/a/b/c/d',
              },
            },
          },
        },
      }

      const result = createMagicProxy(input)
      expect(result.a.b.c.e).toEqual({
        '$ref': '#/a/b/c/d',
        '$ref-value': {
          prop: 'hello',
        },
      })
    })

    it('should resolve the references inside an array', () => {
      const input = {
        $defs: {
          a: {
            b: {
              prop: 'hello',
            },
            c: {
              someOtherProp: 'world',
            },
          },
        },
        a: {
          b: [
            {
              $ref: '#/$defs/a/b',
            },
            {
              $ref: '#/$defs/a/c',
            },
          ],
        },
      }

      const result = createMagicProxy(input)
      expect(JSON.stringify(result.a)).toEqual(
        JSON.stringify({
          'b': [
            { '$ref': '#/$defs/a/b', '$ref-value': { 'prop': 'hello' } },
            { '$ref': '#/$defs/a/c', '$ref-value': { 'someOtherProp': 'world' } },
          ],
        }),
      )
    })

    it('should return undefined if the ref is an external ref', () => {
      const input = {
        a: 'hello',
        b: {
          $ref: 'https://example.com/document.json/#',
        },
      }

      const result = createMagicProxy(input)
      expect(result).toEqual({
        a: 'hello',
        b: {
          $ref: 'https://example.com/document.json/#',
          '$ref-value': undefined,
        },
      })
    })
  })

  describe('set', () => {
    it('sets properties on the target object', () => {
      const input: any = {
        a: 'hello',
        b: {
          $ref: '#/a',
        },
      }

      const result = createMagicProxy(input)
      result.c = 'world'

      expect(result.c).toBe('world')
    })

    it('sets properties on nested objects', () => {
      const input: any = {
        a: {
          b: {
            c: 'hello',
          },
        },
      }

      const result = createMagicProxy(input)
      result.a.b.d = 'world'

      expect(result.a.b.d).toBe('world')
    })

    it('sets properties on objects with refs', () => {
      const input: any = {
        a: {
          b: {
            c: 'hello',
          },
        },
        d: {
          $ref: '#/a/b',
        },
      }

      const result = createMagicProxy(input)
      result.d.e = 'world'

      expect(result.d.e).toBe('world')
    })

    it('sets properties on arrays', () => {
      const input = {
        items: [{ name: 'item1' }, { name: 'item2' }],
      }

      const result = createMagicProxy(input)
      result.items[2] = { name: 'item3' }

      expect(result.items[2].name).toBe('item3')
    })

    it('sets properties on array elements with refs', () => {
      const input: any = {
        $defs: {
          item: { name: 'default' },
        },
        items: [{ $ref: '#/$defs/item' }],
      }

      const result = createMagicProxy(input)
      result.items[0].id = 123

      expect(input.items[0].id).toBe(123)
    })

    it('overwrites existing properties', () => {
      const input = {
        a: 'hello',
        b: {
          c: 'world',
        },
      }

      const result = createMagicProxy(input)
      result.a = 'updated'
      result.b.c = 'updated'

      expect(result.a).toBe('updated')
      expect(result.b.c).toBe('updated')
    })

    it('sets properties on the root object', () => {
      const input: any = {
        a: 'hello',
      }

      const result = createMagicProxy(input)
      result.rootProperty = 'root value'

      expect(result.rootProperty).toBe('root value')
    })

    it('sets properties that are accessed via ref-value', () => {
      const input: any = {
        a: {
          b: {
            c: 'hello',
          },
        },
        d: {
          $ref: '#/a/b',
        },
      }

      const result = createMagicProxy(input)
      const refValue = result.d['$ref-value']
      refValue.newProp = 'new value'

      expect(refValue.newProp).toBe('new value')
      expect(input.a.b.newProp).toBe('new value')
    })

    it('sets properties on deeply nested refs', () => {
      const input: any = {
        a: {
          b: {
            c: {
              d: {
                e: 'hello',
              },
            },
          },
        },
        f: {
          $ref: '#/a/b/c/d',
        },
      }

      const result = createMagicProxy(input)
      result.f['$ref-value'].g = 'world'

      expect(result.f['$ref-value'].g).toBe('world')
      expect(input.a.b.c.d.g).toBe('world')
    })

    it('correctly writes on the referenced value', () => {
      const input = {
        a: {
          b: {
            hello: 'hi',
          },
        },
        c: {
          $ref: '#/a/b',
        },
      }

      const proxied = createMagicProxy(input)

      proxied.c['$ref-value'].hello = 'new value'

      expect(input).toEqual({
        a: {
          b: {
            hello: 'new value',
          },
        },
        c: {
          $ref: '#/a/b',
        },
      })
    })

    it('sets properties on the referenced value #1', () => {
      const input = {
        a: {
          $ref: '#/b',
        },
        b: {
          hello: 'world',
        },
      }

      const proxied = createMagicProxy(input)

      proxied.a['$ref-value'] = 'new value'

      expect(proxied).toEqual({
        a: {
          $ref: '#/b',
          '$ref-value': 'new value',
        },
        b: 'new value',
      })
    })

    it('sets properties on the referenced value #2', () => {
      const input = {
        a: {
          $ref: '#/b/c',
        },
        b: {
          c: {
            hello: 'world',
          },
        },
      }

      const proxied = createMagicProxy(input)

      proxied.a['$ref-value'] = {
        message: 'this is the new value',
      }

      expect(proxied).toEqual({
        a: {
          $ref: '#/b/c',
          '$ref-value': {
            'message': 'this is the new value',
          },
        },
        'b': {
          'c': {
            'message': 'this is the new value',
          },
        },
      })
    })

    it('throws an error when trying set rewrite a referenced value which is the root of the document', () => {
      const input = {
        a: {
          $ref: '#',
        },
      }

      const proxied = createMagicProxy(input)

      expect(() => {
        proxied.a['$ref-value'] = 'new value'
      }).toThrowError("'set' on proxy: trap returned falsish for property '$ref-value'")
    })

    it('does not throw when trying to update an invalid ref where the parent node does not exists', () => {
      const input = {
        a: {
          $ref: '#/non-existent/some-path',
        },
        b: {
          c: {
            hello: 'world',
          },
        },
      }

      const proxied = createMagicProxy(input)

      expect(() => {
        proxied.a['$ref-value'] = 'new value'
      }).not.toThrowError("'set' on proxy: trap returned falsish for property '$ref-value'")

      expect(proxied.a['$ref-value']).toBe('new value')

      expect(input).toEqual({
        'a': {
          '$ref': '#/non-existent/some-path',
        },
        'b': {
          'c': {
            'hello': 'world',
          },
        },
        'non-existent': {
          'some-path': 'new value',
        },
      })
    })
  })

  describe('has', () => {
    it('returns true for $ref-value when $ref exists', () => {
      const input = {
        a: 'hello',
        b: {
          $ref: '#/a',
        },
      }

      const result = createMagicProxy(input)
      expect('$ref-value' in result.b).toBe(true)
    })

    it('returns false for $ref-value when $ref does not exist', () => {
      const input = {
        a: 'hello',
        b: {
          c: 'world',
        },
      }

      const result = createMagicProxy(input)
      expect('$ref-value' in result.b).toBe(false)
    })

    it('returns true for existing properties', () => {
      const input = {
        a: 'hello',
        b: {
          c: 'world',
        },
      }

      const result = createMagicProxy(input)
      expect('a' in result).toBe(true)
      expect('b' in result).toBe(true)
      expect('c' in result.b).toBe(true)
    })

    it('returns false for non-existent properties', () => {
      const input = {
        a: 'hello',
      }

      const result = createMagicProxy(input)
      expect('nonExistent' in result).toBe(false)
      expect('$ref-value' in result).toBe(false)
    })

    it('handles nested objects with refs', () => {
      const input = {
        a: {
          b: {
            c: 'hello',
          },
        },
        d: {
          $ref: '#/a/b',
        },
      }

      const result = createMagicProxy(input)
      expect('$ref-value' in result.d).toBe(true)
      expect('c' in result.a.b).toBe(true)
    })

    it('handles arrays with refs', () => {
      const input = {
        items: [{ name: 'item1' }, { $ref: '#/items/0' }],
      }

      const result = createMagicProxy(input)
      expect('$ref-value' in result.items[1]).toBe(true)
      expect('name' in result.items[0]).toBe(true)
    })

    it('handles deeply nested refs', () => {
      const input = {
        a: {
          b: {
            c: {
              d: {
                e: 'hello',
              },
            },
          },
        },
        f: {
          $ref: '#/a/b/c/d',
        },
      }

      const result = createMagicProxy(input)
      expect('$ref-value' in result.f).toBe(true)
    })

    it('handles objects with both $ref and other properties', () => {
      const input = {
        a: {
          b: {
            c: 'hello',
          },
        },
        d: {
          $ref: '#/a/b',
          extraProp: 'extra',
        },
      }

      const result = createMagicProxy(input)
      expect('$ref-value' in result.d).toBe(true)
      expect('extraProp' in result.d).toBe(true)
      expect('$ref' in result.d).toBe(true)
    })

    it('handles external refs', () => {
      const input = {
        a: 'hello',
        b: {
          $ref: 'https://example.com/document.json/#',
        },
      }

      const result = createMagicProxy(input)
      expect('$ref-value' in result.b).toBe(true)
    })

    it('handles empty objects', () => {
      const input = {}

      const result = createMagicProxy(input)
      expect('$ref-value' in result).toBe(false)
      expect('anyProperty' in result).toBe(false)
    })

    it('handles null and undefined values', () => {
      const input = {
        a: null,
        b: undefined,
        c: {
          $ref: '#/a',
        },
      }

      const result = createMagicProxy(input)
      expect('$ref-value' in result.c).toBe(true)
      expect('a' in result).toBe(true)
      expect('b' in result).toBe(true)
    })
  })

  describe('delete', () => {
    it('deletes properties from the target object', () => {
      const input = {
        a: 'hello',
        b: 'world',
        c: 'test',
      }

      const result = createMagicProxy(input)
      delete result.b

      expect('b' in result).toBe(false)
      expect(result.a).toBe('hello')
      expect(result.c).toBe('test')
    })

    it('deletes properties from nested objects', () => {
      const input = {
        a: {
          b: 'hello',
          c: 'world',
          d: 'test',
        },
      }

      const result = createMagicProxy(input)
      delete result.a.c

      expect('c' in result.a).toBe(false)
      expect(result.a.b).toBe('hello')
      expect(result.a.d).toBe('test')
    })

    it('deletes properties from objects with refs', () => {
      const input = {
        a: {
          b: 'hello',
          c: 'world',
        },
        d: {
          $ref: '#/a',
          extraProp: 'extra',
        },
      }

      const result = createMagicProxy(input)
      delete result.d.extraProp

      expect('extraProp' in result.d).toBe(false)
      expect('$ref' in result.d).toBe(true)
      expect('$ref-value' in result.d).toBe(true)
    })

    it('deletes properties from ref-value objects', () => {
      const input = {
        a: {
          b: {
            c: 'hello',
            d: 'world',
          },
        },
        e: {
          $ref: '#/a/b',
        },
      }

      const result = createMagicProxy(input)
      delete result.e['$ref-value'].d

      expect('d' in result.e['$ref-value']).toBe(false)
      expect(result.e['$ref-value'].c).toBe('hello')
      expect(input.a.b.d).toBeUndefined()
    })

    it('deletes array elements', () => {
      const input = {
        items: ['a', 'b', 'c', 'd'],
      }

      const result = createMagicProxy(input)
      delete result.items[1]

      expect(result.items[1]).toBeUndefined()
      expect(result.items[0]).toBe('a')
      expect(result.items[2]).toBe('c')
      expect(result.items[3]).toBe('d')
    })

    it('deletes properties from array elements with refs', () => {
      const input = {
        $defs: {
          item: { name: 'default', id: 123, type: 'test' },
        },
        items: [{ $ref: '#/$defs/item' }],
      }

      const result = createMagicProxy(input)
      delete result.items[0]['$ref-value'].type

      expect('type' in result.items[0]['$ref-value']).toBe(false)
      expect(result.items[0]['$ref-value'].name).toBe('default')
      expect(result.items[0]['$ref-value'].id).toBe(123)
    })

    it('deletes deeply nested properties', () => {
      const input = {
        a: {
          b: {
            c: {
              d: {
                e: 'hello',
                f: 'world',
              },
            },
          },
        },
      }

      const result = createMagicProxy(input)
      delete result.a.b.c.d.f

      expect('f' in result.a.b.c.d).toBe(false)
      expect(result.a.b.c.d.e).toBe('hello')
    })

    it('deletes properties from deeply nested refs', () => {
      const input = {
        a: {
          b: {
            c: {
              d: {
                e: 'hello',
                f: 'world',
              },
            },
          },
        },
        g: {
          $ref: '#/a/b/c/d',
        },
      }

      const result = createMagicProxy(input)
      delete result.g['$ref-value'].f

      expect('f' in result.g['$ref-value']).toBe(false)
      expect(result.g['$ref-value'].e).toBe('hello')
      expect(input.a.b.c.d.f).toBeUndefined()
    })

    it('deletes root level properties', () => {
      const input: any = {
        rootProp: 'root value',
        nestedProp: 'nested value',
      }

      const result = createMagicProxy(input)
      delete result.rootProp

      expect('rootProp' in result).toBe(false)
      expect(result.nestedProp).toBe('nested value')
    })

    it('deletes properties that do not exist', () => {
      const input: any = {
        a: 'hello',
      }

      const result = createMagicProxy(input)
      const deleteResult = delete result.nonExistent

      expect(deleteResult).toBe(true)
      expect('nonExistent' in result).toBe(false)
    })

    it('deletes properties from objects with multiple refs', () => {
      const input = {
        a: {
          b: {
            c: 'hello',
            d: 'world',
          },
        },
        e: {
          $ref: '#/a/b',
        },
        f: {
          $ref: '#/e',
        },
      }

      const result = createMagicProxy(input)
      delete result.f['$ref-value']['$ref-value'].d

      expect('d' in result.f['$ref-value']['$ref-value']).toBe(false)
      expect(result.f['$ref-value']['$ref-value'].c).toBe('hello')
      expect(input.a.b.d).toBeUndefined()
    })

    it('deletes properties from external refs', () => {
      const input = {
        a: 'hello',
        b: {
          $ref: 'https://example.com/document.json/#',
          localProp: 'local',
        },
      }

      const result = createMagicProxy(input)
      delete result.b.localProp

      expect('localProp' in result.b).toBe(false)
      expect('$ref' in result.b).toBe(true)
      expect('$ref-value' in result.b).toBe(true)
    })

    it('deletes properties from empty objects', () => {
      const input: any = {}

      const result = createMagicProxy(input)
      const deleteResult = delete result.anyProperty

      expect(deleteResult).toBe(true)
      expect('anyProperty' in result).toBe(false)
    })

    it('deletes properties from objects with null and undefined values', () => {
      const input = {
        a: null,
        b: undefined,
        c: {
          d: null,
          e: undefined,
        },
      }

      const result = createMagicProxy(input)
      delete result.a
      delete result.c.d

      expect('a' in result).toBe(false)
      expect('d' in result.c).toBe(false)
      expect('b' in result).toBe(true)
      expect('e' in result.c).toBe(true)
    })

    it('deletes properties from arrays with mixed content', () => {
      const input: any = {
        items: [{ name: 'item1', id: 1 }, { $ref: '#/items/0' }, 'string item', { name: 'item2', id: 2 }],
      }

      const result = createMagicProxy(input)
      delete result.items[0].id
      delete result.items[1]['$ref-value'].name

      expect('id' in result.items[0]).toBe(false)
      expect('name' in result.items[1]['$ref-value']).toBe(false)
      expect(result.items[0].name).toBe(undefined)
      expect(result.items[2]).toBe('string item')
    })

    it('deletes properties from objects with both direct and ref properties', () => {
      const input = {
        a: {
          b: {
            c: 'hello',
            d: 'world',
          },
        },
        e: {
          $ref: '#/a/b',
          directProp: 'direct',
        },
      }

      const result = createMagicProxy(input)
      delete result.e.directProp
      delete result.e['$ref-value'].d

      expect('directProp' in result.e).toBe(false)
      expect('d' in result.e['$ref-value']).toBe(false)
      expect('$ref' in result.e).toBe(true)
      expect(result.e['$ref-value'].c).toBe('hello')
    })
  })

  describe('ownKeys', () => {
    it('returns original keys when no $ref exists', () => {
      const input = {
        a: 'hello',
        b: 'world',
        c: 'test',
      }

      const result = createMagicProxy(input)
      const keys = Object.keys(result)

      expect(keys).toEqual(['a', 'b', 'c'])
    })

    it('includes $ref-value when $ref exists', () => {
      const input = {
        a: 'hello',
        b: {
          $ref: '#/a',
        },
      }

      const result = createMagicProxy(input)
      const keys = Object.keys(result.b)

      expect(keys).toEqual(['$ref', '$ref-value'])
    })

    it('does not duplicate $ref-value if it already exists', () => {
      const input = {
        a: 'hello',
        b: {
          $ref: '#/a',
          '$ref-value': 'existing',
        },
      }

      const result = createMagicProxy(input)
      const keys = Object.keys(result.b)

      expect(keys).toEqual(['$ref', '$ref-value'])
    })

    it('handles nested objects with refs', () => {
      const input = {
        a: {
          b: {
            c: 'hello',
          },
        },
        d: {
          $ref: '#/a/b',
          extraProp: 'extra',
        },
      }

      const result = createMagicProxy(input)
      const keys = Object.keys(result.d)

      expect(keys).toEqual(['$ref', 'extraProp', '$ref-value'])
    })

    it('handles arrays with refs', () => {
      const input = {
        items: [{ name: 'item1' }, { $ref: '#/items/0' }, { name: 'item2', id: 2 }],
      }

      const result = createMagicProxy(input)
      const keys = Object.keys(result.items[1])

      expect(keys).toEqual(['$ref', '$ref-value'])
    })

    it('handles deeply nested refs', () => {
      const input = {
        a: {
          b: {
            c: {
              d: {
                e: 'hello',
              },
            },
          },
        },
        f: {
          $ref: '#/a/b/c/d',
        },
      }

      const result = createMagicProxy(input)
      const keys = Object.keys(result.f)

      expect(keys).toEqual(['$ref', '$ref-value'])
    })

    it('handles objects with multiple refs', () => {
      const input = {
        a: {
          b: {
            c: 'hello',
          },
        },
        d: {
          $ref: '#/a/b',
        },
        e: {
          $ref: '#/d',
        },
      }

      const result = createMagicProxy(input)
      const dKeys = Object.keys(result.d)
      const eKeys = Object.keys(result.e)

      expect(dKeys).toEqual(['$ref', '$ref-value'])
      expect(eKeys).toEqual(['$ref', '$ref-value'])
    })

    it('handles external refs', () => {
      const input = {
        a: 'hello',
        b: {
          $ref: 'https://example.com/document.json/#',
        },
      }

      const result = createMagicProxy(input)
      const keys = Object.keys(result.b)

      expect(keys).toEqual(['$ref', '$ref-value'])
    })

    it('handles empty objects', () => {
      const input = {}

      const result = createMagicProxy(input)
      const keys = Object.keys(result)

      expect(keys).toEqual([])
    })

    it('handles objects with only $ref', () => {
      const input = {
        a: {
          $ref: '#/b',
        },
        b: 'hello',
      }

      const result = createMagicProxy(input)
      const keys = Object.keys(result.a)

      expect(keys).toEqual(['$ref', '$ref-value'])
    })

    it('handles objects with null and undefined values', () => {
      const input = {
        a: null,
        b: undefined,
        c: {
          $ref: '#/a',
        },
        d: {
          $ref: '#/b',
        },
      }

      const result = createMagicProxy(input)
      const cKeys = Object.keys(result.c)
      const dKeys = Object.keys(result.d)

      expect(cKeys).toEqual(['$ref', '$ref-value'])
      expect(dKeys).toEqual(['$ref', '$ref-value'])
    })

    it('handles arrays with mixed content', () => {
      const input = {
        items: [{ name: 'item1' }, { $ref: '#/items/0' }, 'string item', { name: 'item2', id: 2 }],
      }

      const result = createMagicProxy(input)
      const item0Keys = Object.keys(result.items[0])
      const item1Keys = Object.keys(result.items[1])

      expect(item0Keys).toEqual(['name'])
      expect(item1Keys).toEqual(['$ref', '$ref-value'])
    })

    it('handles objects with both direct and ref properties', () => {
      const input = {
        a: {
          b: {
            c: 'hello',
          },
        },
        d: {
          $ref: '#/a/b',
          directProp: 'direct',
          anotherProp: 'another',
        },
      }

      const result = createMagicProxy(input)
      const keys = Object.keys(result.d)

      expect(keys).toEqual(['$ref', 'directProp', 'anotherProp', '$ref-value'])
    })

    it('handles objects with symbol keys', () => {
      const symbolKey = Symbol('test')
      const input = {
        [symbolKey]: 'symbol value',
        a: 'hello',
        b: {
          $ref: '#/a',
        },
      }

      const result = createMagicProxy(input)
      const keys = Object.keys(result)
      const ownKeys = Object.getOwnPropertySymbols(result)

      expect(keys).toEqual(['a', 'b'])
      expect(ownKeys).toEqual([symbolKey])
    })

    it('handles objects with non-enumerable properties', () => {
      const input = {
        a: 'hello',
        b: {
          $ref: '#/a',
        },
      }

      Object.defineProperty(input.b, 'nonEnumerable', {
        value: 'test',
        enumerable: false,
      })

      const result = createMagicProxy(input)
      const keys = Object.keys(result.b)
      const ownKeys = Reflect.ownKeys(result.b)

      expect(keys).toEqual(['$ref', '$ref-value'])
      expect(ownKeys).toContain('nonEnumerable')
      expect(ownKeys).toContain('$ref')
      expect(ownKeys).toContain('$ref-value')
    })

    it('handles objects with getter properties', () => {
      const input = {
        a: 'hello',
        b: {
          $ref: '#/a',
        },
      }

      Object.defineProperty(input.b, 'getterProp', {
        get() {
          return 'getter value'
        },
        enumerable: true,
      })

      const result = createMagicProxy(input)
      const keys = Object.keys(result.b)

      expect(keys).toEqual(['$ref', 'getterProp', '$ref-value'])
    })
  })

  describe('getRaw', () => {
    it('should get the raw version of the document', () => {
      const input = {
        a: 'hello',
        b: {
          $ref: '#/a',
        },
      }

      const proxied = createMagicProxy(input)

      expect(proxied).toEqual({
        a: 'hello',
        b: {
          $ref: '#/a',
          '$ref-value': 'hello',
        },
      })

      expect(getRaw(proxied)).toEqual(input)
    })
  })

  describe('show underscore properties when specified', () => {
    it('should not hide properties starting with __scalar_ from direct access', () => {
      const input = {
        public: 'visible',
        __scalar_private: 'hidden',
        __scalar_internal: 'also hidden',
        normal_underscore: 'visible with underscore in middle',
      }

      const result = createMagicProxy(input, { showInternal: true })

      expect(result.public).toBe('visible')
      expect(result.__scalar_private).toBe('hidden')
      expect(result.__scalar_internal).toBe('also hidden')
      expect(result.normal_underscore).toBe('visible with underscore in middle')
    })

    it('should not hide __scalar_ properties from "in" operator', () => {
      const input = {
        public: 'visible',
        __scalar_private: 'hidden',
        __scalar_internal: 'also hidden',
      }

      const result = createMagicProxy(input, { showInternal: true })

      expect('public' in result).toBe(true)
      expect('__scalar_private' in result).toBe(true)
      expect('__scalar_internal' in result).toBe(true)
    })

    it('should not exclude __scalar_ properties from Object.keys enumeration', () => {
      const input = {
        public: 'visible',
        __scalar_private: 'hidden',
        __scalar_internal: 'also hidden',
        another: 'visible',
      }

      const result = createMagicProxy(input, { showInternal: true })
      const keys = Object.keys(result)

      expect(keys).toContain('public')
      expect(keys).toContain('another')
      expect(keys).toContain('__scalar_private')
      expect(keys).toContain('__scalar_internal')
    })

    it('should not hide __scalar_ properties from getOwnPropertyDescriptor', () => {
      const input = {
        public: 'visible',
        __scalar_private: 'hidden',
      }

      const result = createMagicProxy(input, { showInternal: true })

      expect(Object.getOwnPropertyDescriptor(result, 'public')).toBeDefined()
      expect(Object.getOwnPropertyDescriptor(result, '__scalar_private')).toBeDefined()
    })

    it('should not hide __scalar_ properties in nested objects', () => {
      const input = {
        nested: {
          public: 'visible',
          __scalar_private: 'hidden',
          deeper: {
            __scalar_alsoHidden: 'secret',
            visible: 'shown',
          },
        },
        __scalar_topLevel: 'hidden',
      }

      const result = createMagicProxy(input, { showInternal: true })

      expect(result.__scalar_topLevel).toBe('hidden')
      expect(result.nested.public).toBe('visible')
      expect(result.nested.__scalar_private).toBe('hidden')
      expect(result.nested.deeper.__scalar_alsoHidden).toBe('secret')
      expect(result.nested.deeper.visible).toBe('shown')
    })

    it('should show __scalar_ properties with arrays containing objects with __scalar_ properties', () => {
      const input = {
        items: [
          { public: 'item1', __scalar_private: 'hidden1' },
          { public: 'item2', __scalar_private: 'hidden2' },
        ],
      }

      const result = createMagicProxy(input, { showInternal: true })

      expect(result.items[0].public).toBe('item1')
      expect(result.items[0].__scalar_private).toBe('hidden1')
      expect(result.items[1].public).toBe('item2')
      expect(result.items[1].__scalar_private).toBe('hidden2')
    })

    it('should show __scalar_ ref properties', () => {
      const input = {
        definitions: {
          example: {
            value: 'hello',
            __scalar_internal: 'hidden',
          },
        },
        __scalar_hiddenRef: { $ref: '#/definitions/example' },
        publicRef: { $ref: '#/definitions/example' },
      }

      const result = createMagicProxy(input, { showInternal: true })

      // __scalar_ property should be hidden
      expect(result.__scalar_hiddenRef).toEqual({
        '$ref': '#/definitions/example',
        '$ref-value': {
          '__scalar_internal': 'hidden',
          'value': 'hello',
        },
      })

      // Public ref should work normally
      expect(result.publicRef['$ref-value'].value).toBe('hello')

      // __scalar_ properties in referenced objects should be hidden
      expect(result.publicRef['$ref-value'].__scalar_internal).toBe('hidden')
    })
  })

  describe('$id and $anchor reference resolution', () => {
    it('resolves references to schemas with $id property', () => {
      const input = {
        $id: 'https://example.com/schema',
        definitions: {
          user: {
            $id: 'https://example.com/user',
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
            },
          },
        },
        userRef: {
          $ref: 'https://example.com/user',
        },
      }

      const result = createMagicProxy(input)

      expect(result.userRef['$ref-value']).toEqual({
        $id: 'https://example.com/user',
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      })
    })

    it('resolves references to schemas with $anchor property', () => {
      const input = {
        $id: 'https://example.com/schema',
        definitions: {
          user: {
            $anchor: 'user-schema',
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
        userRef: {
          $ref: 'https://example.com/schema#user-schema',
        },
      }

      const result = createMagicProxy(input)

      expect(result.userRef['$ref-value']).toEqual({
        $anchor: 'user-schema',
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
        },
      })
    })

    it('resolves references to schemas with both $id and $anchor properties', () => {
      const input = {
        $id: 'https://example.com/root',
        definitions: {
          user: {
            $id: 'https://example.com/user',
            $anchor: 'user-schema',
            type: 'object',
            properties: {
              id: { type: 'string' },
              profile: { type: 'object' },
            },
          },
        },
        userByIdRef: {
          $ref: 'https://example.com/user',
        },
        userByAnchorRef: {
          $ref: 'https://example.com/user#user-schema',
        },
      }

      const result = createMagicProxy(input)

      const expectedUser = {
        $id: 'https://example.com/user',
        $anchor: 'user-schema',
        type: 'object',
        properties: {
          id: { type: 'string' },
          profile: { type: 'object' },
        },
      }

      expect(result.userByIdRef['$ref-value']).toEqual(expectedUser)
      expect(result.userByAnchorRef['$ref-value']).toEqual(expectedUser)
    })

    it('resolves nested references with $id and $anchor', () => {
      const input = {
        $id: 'https://example.com/api',
        components: {
          schemas: {
            user: {
              $id: 'https://example.com/user',
              $anchor: 'user-schema',
              type: 'object',
              properties: {
                profile: {
                  $anchor: 'profile-schema',
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        userRef: {
          $ref: 'https://example.com/user',
        },
        profileRef: {
          $ref: 'https://example.com/user#profile-schema',
        },
      }

      const result = createMagicProxy(input)

      expect(result.userRef['$ref-value']).toEqual({
        $id: 'https://example.com/user',
        $anchor: 'user-schema',
        type: 'object',
        properties: {
          profile: {
            $anchor: 'profile-schema',
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      })

      expect(result.profileRef['$ref-value']).toEqual({
        $anchor: 'profile-schema',
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      })
    })

    it('resolves references with path fragments after $id', () => {
      const input = {
        $id: 'https://example.com/schema',
        definitions: {
          user: {
            $id: 'https://example.com/user',
            type: 'object',
            properties: {
              name: { type: 'string' },
              address: {
                type: 'object',
                properties: {
                  street: { type: 'string' },
                },
              },
            },
          },
        },
        addressRef: {
          $ref: 'https://example.com/user#/properties/address',
        },
      }

      const result = createMagicProxy(input)

      expect(result.addressRef['$ref-value']).toEqual({
        type: 'object',
        properties: {
          street: { type: 'string' },
        },
      })
    })

    it('handles multiple schemas with different $id values', () => {
      const input = {
        $id: 'https://example.com/root',
        schemas: {
          user: {
            $id: 'https://example.com/user',
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
          product: {
            $id: 'https://example.com/product',
            type: 'object',
            properties: {
              title: { type: 'string' },
            },
          },
        },
        userRef: {
          $ref: 'https://example.com/user',
        },
        productRef: {
          $ref: 'https://example.com/product',
        },
      }

      const result = createMagicProxy(input)

      expect(result.userRef['$ref-value']).toEqual({
        $id: 'https://example.com/user',
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      })

      expect(result.productRef['$ref-value']).toEqual({
        $id: 'https://example.com/product',
        type: 'object',
        properties: {
          title: { type: 'string' },
        },
      })
    })

    it('handles multiple schemas with different $anchor values', () => {
      const input = {
        $id: 'https://example.com/schema',
        definitions: {
          user: {
            $anchor: 'user',
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
          admin: {
            $anchor: 'admin',
            type: 'object',
            properties: {
              permissions: { type: 'array' },
            },
          },
        },
        userRef: {
          $ref: 'https://example.com/schema#user',
        },
        adminRef: {
          $ref: 'https://example.com/schema#admin',
        },
      }

      const result = createMagicProxy(input)

      expect(result.userRef['$ref-value']).toEqual({
        $anchor: 'user',
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      })

      expect(result.adminRef['$ref-value']).toEqual({
        $anchor: 'admin',
        type: 'object',
        properties: {
          permissions: { type: 'array' },
        },
      })
    })

    it('handles external references to $id schemas', () => {
      const input = {
        $id: 'https://example.com/schema',
        definitions: {
          external: {
            $id: 'https://external.com/schema',
            type: 'object',
            properties: {
              externalProp: { type: 'string' },
            },
          },
        },
        externalRef: {
          $ref: 'https://external.com/schema',
        },
      }

      const result = createMagicProxy(input)

      expect(result.externalRef['$ref-value']).toEqual({
        $id: 'https://external.com/schema',
        type: 'object',
        properties: {
          externalProp: { type: 'string' },
        },
      })
    })

    it('handles references in arrays with $id and $anchor', () => {
      const input = {
        $id: 'https://example.com/schema',
        definitions: {
          item: {
            $anchor: 'item-schema',
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
        items: [{ $ref: 'https://example.com/schema#item-schema' }, { $ref: 'https://example.com/schema#item-schema' }],
      }

      const result = createMagicProxy(input)

      expect(result.items[0]['$ref-value']).toEqual({
        $anchor: 'item-schema',
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      })

      expect(result.items[1]['$ref-value']).toEqual({
        $anchor: 'item-schema',
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      })
    })

    it('preserves $ref information when resolving $id references', () => {
      const input = {
        $id: 'https://example.com/schema',
        definitions: {
          user: {
            $id: 'https://example.com/user',
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        userRef: {
          $ref: 'https://example.com/user',
        },
      }

      const result = createMagicProxy(input)

      expect(result.userRef).toEqual({
        $ref: 'https://example.com/user',
        '$ref-value': {
          $id: 'https://example.com/user',
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      })
    })

    it('preserves $ref information when resolving $anchor references', () => {
      const input = {
        $id: 'https://example.com/schema',
        definitions: {
          user: {
            $anchor: 'user-schema',
            type: 'object',
            properties: {
              email: { type: 'string' },
            },
          },
        },
        userRef: {
          $ref: 'https://example.com/schema#user-schema',
        },
      }

      const result = createMagicProxy(input)

      expect(result.userRef).toEqual({
        $ref: 'https://example.com/schema#user-schema',
        '$ref-value': {
          $anchor: 'user-schema',
          type: 'object',
          properties: {
            email: { type: 'string' },
          },
        },
      })
    })

    it('handles deeply nested $id and $anchor references', () => {
      const input = {
        $id: 'https://example.com/root',
        api: {
          $id: 'https://example.com/api',
          v1: {
            schemas: {
              user: {
                $id: 'https://example.com/user',
                $anchor: 'user-schema',
                type: 'object',
                properties: {
                  profile: {
                    $anchor: 'profile-schema',
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        userRef: {
          $ref: 'https://example.com/user',
        },
        profileRef: {
          $ref: 'https://example.com/user#profile-schema',
        },
      }

      const result = createMagicProxy(input)

      expect(result.userRef['$ref-value']).toEqual({
        $id: 'https://example.com/user',
        $anchor: 'user-schema',
        type: 'object',
        properties: {
          profile: {
            $anchor: 'profile-schema',
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      })

      expect(result.profileRef['$ref-value']).toEqual({
        $anchor: 'profile-schema',
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      })
    })
  })

  describe('setting on $id and $anchor properties', () => {
    it('should allow writing on an $id property', () => {
      const input = {
        $id: 'https://example.com/schema',
        definitions: {
          user: {
            $id: 'https://example.com/user',
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        a: {
          $ref: 'https://example.com/user',
        },
      }

      const proxy = createMagicProxy(input)

      proxy.a['$ref-value'] = {
        message: 'I rewrote the user schema',
      }

      expect(proxy.definitions.user).toEqual({
        'message': 'I rewrote the user schema',
      })
    })

    it('should allow writing on an $anchor property', () => {
      const input = {
        $id: 'https://example.com/schema',
        definitions: {
          user: {
            $id: 'https://example.com/user',
            $anchor: 'user-schema',
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        a: {
          $ref: 'https://example.com/user#user-schema',
        },
      }

      const proxy = createMagicProxy(input)

      proxy.a['$ref-value'] = {
        message: 'I rewrote the user schema',
      }

      expect(proxy.definitions.user).toEqual({
        'message': 'I rewrote the user schema',
      })
    })

    it('should allow writing on a top level $anchor property', () => {
      const input = {
        definitions: {
          user: {
            $anchor: 'user-schema',
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        a: {
          $ref: '#user-schema',
        },
      }

      const proxy = createMagicProxy(input)

      proxy.a['$ref-value'] = {
        message: 'I rewrote the user schema',
      }

      expect(proxy.definitions.user).toEqual({
        'message': 'I rewrote the user schema',
      })
    })
  })

  describe('hide __scalar_ properties', () => {
    it('should hide properties starting with __scalar_ from direct access', () => {
      const input = {
        public: 'visible',
        __scalar_private: 'hidden',
        __scalar_internal: 'also hidden',
        normal_underscore: 'visible with underscore in middle',
        _id: 'legitimate user property', // This should NOT be hidden
        _type: 'another legitimate property', // This should NOT be hidden
      }

      const result = createMagicProxy(input)

      expect(result.public).toBe('visible')
      expect(result.__scalar_private).toBe(undefined)
      expect(result.__scalar_internal).toBe(undefined)
      expect(result.normal_underscore).toBe('visible with underscore in middle')
      expect(result._id).toBe('legitimate user property') // Should be visible
      expect(result._type).toBe('another legitimate property') // Should be visible
    })

    it('should hide __scalar_ properties from "in" operator', () => {
      const input = {
        public: 'visible',
        __scalar_private: 'hidden',
        __scalar_internal: 'also hidden',
      }

      const result = createMagicProxy(input)

      expect('public' in result).toBe(true)
      expect('__scalar_private' in result).toBe(false)
      expect('__scalar_internal' in result).toBe(false)
    })

    it('should exclude __scalar_ properties from Object.keys enumeration', () => {
      const input = {
        public: 'visible',
        __scalar_private: 'hidden',
        __scalar_internal: 'also hidden',
        another: 'visible',
      }

      const result = createMagicProxy(input)
      const keys = Object.keys(result)

      expect(keys).toContain('public')
      expect(keys).toContain('another')
      expect(keys).not.toContain('__scalar_private')
      expect(keys).not.toContain('__scalar_internal')
    })

    it('should hide __scalar_ properties from getOwnPropertyDescriptor', () => {
      const input = {
        public: 'visible',
        __scalar_private: 'hidden',
      }

      const result = createMagicProxy(input)

      expect(Object.getOwnPropertyDescriptor(result, 'public')).toBeDefined()
      expect(Object.getOwnPropertyDescriptor(result, '__scalar_private')).toBe(undefined)
    })

    it('should hide __scalar_ properties in nested objects', () => {
      const input = {
        nested: {
          public: 'visible',
          __scalar_private: 'hidden',
          deeper: {
            __scalar_alsoHidden: 'secret',
            visible: 'shown',
          },
        },
        __scalar_topLevel: 'hidden',
      }

      const result = createMagicProxy(input)

      expect(result.__scalar_topLevel).toBe(undefined)
      expect(result.nested.public).toBe('visible')
      expect(result.nested.__scalar_private).toBe(undefined)
      expect(result.nested.deeper.__scalar_alsoHidden).toBe(undefined)
      expect(result.nested.deeper.visible).toBe('shown')
    })

    it('should work with arrays containing objects with __scalar_ properties', () => {
      const input = {
        items: [
          { public: 'item1', __scalar_private: 'hidden1' },
          { public: 'item2', __scalar_private: 'hidden2' },
        ],
      }

      const result = createMagicProxy(input)

      expect(result.items[0].public).toBe('item1')
      expect(result.items[0].__scalar_private).toBe(undefined)
      expect(result.items[1].public).toBe('item2')
      expect(result.items[1].__scalar_private).toBe(undefined)
    })

    it('should still allow refs to work with __scalar_ hiding', () => {
      const input = {
        definitions: {
          example: {
            value: 'hello',
            __scalar_internal: 'hidden',
          },
        },
        __scalar_hiddenRef: { $ref: '#/definitions/example' },
        publicRef: { $ref: '#/definitions/example' },
      }

      const result = createMagicProxy(input)

      // __scalar_ property should be hidden
      expect(result.__scalar_hiddenRef).toBe(undefined)

      // Public ref should work normally
      expect(result.publicRef['$ref-value'].value).toBe('hello')

      // __scalar_ properties in referenced objects should be hidden
      expect(result.publicRef['$ref-value'].__scalar_internal).toBe(undefined)
    })

    it('preserves regular underscore properties', () => {
      const input = {
        _id: 'user123',
        user_name: 'john',
        __version: '1.0',
        normal_property: 'visible',
      }

      const result = createMagicProxy(input)

      // Regular underscore properties should be visible
      expect(result._id).toBe('user123')
      expect(result.user_name).toBe('john')
      expect(result.__version).toBe('1.0')
      expect(result.normal_property).toBe('visible')

      // Should be included in enumeration and "in" checks
      expect('_id' in result).toBe(true)
      expect('user_name' in result).toBe(true)
      expect('__version' in result).toBe(true)

      const keys = Object.keys(result)
      expect(keys).toContain('_id')
      expect(keys).toContain('user_name')
      expect(keys).toContain('__version')
      expect(keys).toContain('normal_property')
    })
  })
})
