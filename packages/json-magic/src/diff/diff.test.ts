import { describe, expect, test } from 'vitest'

import { apply, diff } from '@/diff'

describe('diff', () => {
  describe('Should correctly detect `add` type diff', () => {
    test('should correctly get added properties between two json objects', () => {
      const doc1 = {
        name: 'John',
        age: 25,
      }

      const doc2 = {
        ...doc1,
        address: {
          city: 'New York',
          street: '5th Avenue',
        },
      }

      expect(diff(doc1, doc2)).toEqual([{ path: ['address'], changes: doc2.address, type: 'add' }])
    })

    test('should correctly get added properties in nested objects between two json objects', () => {
      const doc1 = {
        name: 'John',
        age: 25,
        address: {
          city: 'New York',
          street: '5th Avenue',
        },
      }

      const doc2 = {
        ...doc1,
        address: {
          ...doc1.address,
          coordinates: {
            lat: 40.7128,
            long: 74.006,
          },
        },
      }

      expect(diff(doc1, doc2)).toEqual([
        {
          path: ['address', 'coordinates'],
          changes: doc2.address.coordinates,
          type: 'add',
        },
      ])
    })

    test('should correctly get added properties in deeply nested objects between two json objects', () => {
      const doc1 = {
        name: 'John',
        age: 25,
        address: {
          city: 'New York',
          street: '5th Avenue',
          coordinates: {
            lat: 40.7128,
          },
        },
      }

      const doc2 = {
        ...doc1,
        address: {
          ...doc1.address,
          coordinates: {
            ...doc1.address.coordinates,
            long: 74.006,
          },
        },
      }

      expect(diff(doc1, doc2)).toEqual([
        {
          path: ['address', 'coordinates', 'long'],
          changes: doc2.address.coordinates.long,
          type: 'add',
        },
      ])
    })
  })

  describe('Should correctly detect `update` type diff', () => {
    test('should correctly get updates on primitives between two objects', () => {
      const doc1 = {
        name: 'John',
        age: 25,
        address: {
          city: 'New York',
          street: '5th Avenue',
        },
      }

      const doc2: typeof doc1 = {
        ...doc1,
        age: 26,
      }

      expect(diff(doc1, doc2)).toEqual([{ path: ['age'], changes: doc2.age, type: 'update' }])
    })

    test('should correctly get updates on nested objects between two objects', () => {
      const doc1 = {
        name: 'John',
        age: 25,
        address: {
          city: 'New York',
          street: '5th Avenue',
        },
      }

      const doc2: typeof doc1 = {
        ...doc1,
        address: {
          ...doc1.address,
          city: 'Los Angeles',
        },
      }

      expect(diff(doc1, doc2)).toEqual([
        {
          path: ['address', 'city'],
          changes: doc2.address.city,
          type: 'update',
        },
      ])
    })

    test('should correctly get updates when the type is different', () => {
      const doc1 = {
        name: 'John',
        age: 25,
        address: {
          city: 'New York',
          street: '5th Avenue',
        },
        isStudent: 1,
      }

      const doc2 = {
        ...doc1,
        isStudent: true,
      }

      expect(diff(doc1, doc2)).toEqual([{ path: ['isStudent'], changes: doc2.isStudent, type: 'update' }])
    })
  })

  describe('Should correctly detect `delete` type diff', () => {
    test('should correctly get removed properties between two objects', () => {
      const doc2 = {
        name: 'John',
        age: 25,
      }

      const doc1 = {
        ...doc2,
        address: {
          city: 'New York',
          street: '5th Avenue',
        },
      }

      expect(diff(doc1, doc2)).toEqual([{ path: ['address'], changes: doc1.address, type: 'delete' }])
    })

    test('should correctly get removed properties on deeply nested objects', () => {
      const doc2 = {
        name: 'John',
        age: 25,
        address: {
          city: 'New York',
          street: '5th Avenue',
        },
      }

      const doc1 = {
        ...doc2,
        address: {
          ...doc2.address,
          coordinates: {
            lat: 40.7128,
            long: 74.006,
          },
        },
      }

      expect(diff(doc1, doc2)).toEqual([
        {
          path: ['address', 'coordinates'],
          changes: doc1.address.coordinates,
          type: 'delete',
        },
      ])
    })
  })

  describe('Should correctly detect changes on arrays', () => {
    test('detect adding elements on arrays of primitives', () => {
      const doc1 = {
        name: 'John',
        age: 25,
        hobbies: ['reading', 'running'],
      }

      const doc2 = {
        ...doc1,
        hobbies: ['reading', 'running', 'swimming'],
      }

      expect(diff(doc1, doc2)).toEqual([{ path: ['hobbies', '2'], changes: doc2.hobbies[2], type: 'add' }])
    })

    test('detect adding elements on arrays of objects', () => {
      const doc1 = {
        name: 'John',
        age: 25,
        hobbies: [
          { name: 'reading', duration: 2 },
          { name: 'running', duration: 1 },
        ],
      }

      const doc2 = {
        ...doc1,
        hobbies: [...doc1.hobbies, { name: 'swimming', duration: 3 }],
      }

      expect(diff(doc1, doc2)).toEqual([{ path: ['hobbies', '2'], changes: doc2.hobbies[2], type: 'add' }])
    })

    test('detects updates on objects on array of objects', () => {
      const doc1 = {
        name: 'John',
        age: 25,
        hobbies: [
          { name: 'reading', duration: 2 },
          { name: 'running', duration: 1 },
        ],
      }

      const doc2 = {
        ...doc1,
        hobbies: [doc1.hobbies[0], { name: 'swimming', duration: 3 }],
      }

      expect(diff(doc1, doc2)).toEqual([
        {
          path: ['hobbies', '1', 'name'],
          changes: doc2.hobbies[1]?.name,
          type: 'update',
        },
        {
          path: ['hobbies', '1', 'duration'],
          changes: doc2.hobbies[1]?.duration,
          type: 'update',
        },
      ])
    })

    test('detects delete operations on array of objects', () => {
      const doc1 = {
        name: 'John',
        age: 25,
        hobbies: [
          { name: 'reading', duration: 2 },
          { name: 'running', duration: 1 },
        ],
      }

      const doc2 = {
        ...doc1,
        hobbies: [doc1.hobbies[0]],
      }

      expect(diff(doc1, doc2)).toEqual([{ path: ['hobbies', '1'], changes: doc1.hobbies[1], type: 'delete' }])
    })

    test('emits deletes from the end of the array first', () => {
      const doc1 = { items: [1, 2, 3, 4] }
      const doc2 = { items: [1] }

      expect(diff(doc1, doc2)).toEqual([
        { path: ['items', '3'], changes: 4, type: 'delete' },
        { path: ['items', '2'], changes: 3, type: 'delete' },
        { path: ['items', '1'], changes: 2, type: 'delete' },
      ])
    })

    test('keeps additions in ascending index order', () => {
      const doc1 = { items: [1] }
      const doc2 = { items: [1, 2, 3] }

      expect(diff(doc1, doc2)).toEqual([
        { path: ['items', '1'], changes: 2, type: 'add' },
        { path: ['items', '2'], changes: 3, type: 'add' },
      ])
    })

    test('emits changes on arrays of the same length from the last index first', () => {
      const doc1 = { items: [1, 2, 3] }
      const doc2 = { items: [9, 8, 7] }

      expect(diff(doc1, doc2)).toEqual([
        { path: ['items', '2'], changes: 7, type: 'update' },
        { path: ['items', '1'], changes: 8, type: 'update' },
        { path: ['items', '0'], changes: 9, type: 'update' },
      ])
    })

    test('removes multiple elements from the end of the array', () => {
      const doc1 = { items: [1, 2, 3, 4] }
      const doc2 = { items: [1] }

      expect(apply(structuredClone(doc1), diff(doc1, doc2))).toEqual(doc2)
    })

    test('removes multiple elements from the middle of the array', () => {
      const doc1 = { tags: ['a', 'b', 'c', 'd', 'e'] }
      const doc2 = { tags: ['a', 'e'] }

      expect(apply(structuredClone(doc1), diff(doc1, doc2))).toEqual(doc2)
    })

    test('removes every element of the array', () => {
      const doc1 = { tags: ['a', 'b', 'c'] }
      const doc2 = { tags: [] }

      expect(apply(structuredClone(doc1), diff(doc1, doc2))).toEqual(doc2)
    })

    test('removes multiple objects from an array of objects', () => {
      const doc1 = {
        list: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      }
      const doc2 = {
        list: [{ id: 1 }],
      }

      expect(apply(structuredClone(doc1), diff(doc1, doc2))).toEqual(doc2)
    })

    test('removes elements from arrays nested inside objects inside arrays', () => {
      const doc1 = {
        paths: [
          { path: '/a', tags: ['x', 'y', 'z'] },
          { path: '/b', tags: ['1', '2', '3', '4'] },
        ],
      }
      const doc2 = {
        paths: [
          { path: '/a', tags: ['x'] },
          { path: '/b', tags: ['1', '2'] },
        ],
      }

      expect(apply(structuredClone(doc1), diff(doc1, doc2))).toEqual(doc2)
    })

    test('keeps adding and removing elements in the same document consistent', () => {
      const doc1 = {
        servers: [{ url: 'a' }, { url: 'b' }, { url: 'c' }],
        tags: ['one'],
      }
      const doc2 = {
        servers: [{ url: 'a' }],
        tags: ['one', 'two', 'three'],
      }

      expect(apply(structuredClone(doc1), diff(doc1, doc2))).toEqual(doc2)
    })
  })

  describe('Should treat container type changes as a single update', () => {
    test('detects an object changing into an array as a single update', () => {
      const doc1 = { tags: {} }
      const doc2 = { tags: ['x', 'y'] }

      expect(diff(doc1, doc2)).toEqual([{ path: ['tags'], changes: doc2.tags, type: 'update' }])
    })

    test('detects an array changing into an object as a single update', () => {
      const doc1 = { tags: ['x', 'y'] }
      const doc2 = { tags: { note: 'hi' } }

      expect(diff(doc1, doc2)).toEqual([{ path: ['tags'], changes: doc2.tags, type: 'update' }])
    })

    test('detects container type changes on nested properties', () => {
      const doc1 = {
        info: {
          contact: { emails: { primary: 'a@example.com' } },
        },
      }

      const doc2 = {
        info: {
          contact: { emails: ['a@example.com', 'b@example.com'] },
        },
      }

      expect(diff(doc1, doc2)).toEqual([
        {
          path: ['info', 'contact', 'emails'],
          changes: doc2.info.contact.emails,
          type: 'update',
        },
      ])
    })

    test('applying the diff replaces the container instead of corrupting it', () => {
      const doc1 = { tags: {} }
      const doc2 = { tags: ['x', 'y'] }

      const result = apply(structuredClone(doc1), diff(doc1, doc2))

      expect(Array.isArray(result.tags)).toBe(true)
      expect(result).toEqual(doc2)

      const reverse = apply(structuredClone(doc2), diff(doc2, doc1))

      expect(Array.isArray(reverse.tags)).toBe(false)
      expect(reverse).toEqual(doc1)
    })

    test('consumers applying only add differences leave the existing container untouched', () => {
      const doc1 = { tags: {} }
      const doc2 = { tags: ['x', 'y'] }

      // A type change is an update, so add-only consumers no longer write
      // numeric string keys onto the existing object
      const additions = diff(doc1, doc2).filter((d) => d.type === 'add')

      expect(additions).toEqual([])
      expect(apply(structuredClone(doc1), additions)).toEqual(doc1)
    })
  })

  test('Should correctly detect multiple changes', () => {
    const doc1 = {
      name: 'John',
      age: 25,
      address: {
        city: 'New York',
        street: '5th Avenue',
      },
      hobbies: [
        { name: 'reading', duration: 2 },
        { name: 'running', duration: 1 },
      ],
      isStudent: true,
    }

    const doc2 = {
      ...(doc1 as Partial<typeof doc1>), // Partial is needed to remove the key student key from doc2
      age: 26,
      address: {
        ...doc1.address,
        city: 'Los Angeles',
      },
      hobbies: [doc1.hobbies[0], { name: 'swimming', duration: 3 }, { name: 'running', duration: 2 }],
    }

    delete doc2.isStudent

    expect(diff(doc1, doc2)).toEqual([
      { path: ['age'], changes: doc2.age, type: 'update' },
      { path: ['address', 'city'], changes: doc2.address.city, type: 'update' },
      {
        path: ['hobbies', '1', 'name'],
        changes: doc2.hobbies[1]?.name,
        type: 'update',
      },
      {
        path: ['hobbies', '1', 'duration'],
        changes: doc2.hobbies[1]?.duration,
        type: 'update',
      },
      { path: ['hobbies', '2'], changes: doc2.hobbies[2], type: 'add' },
      { path: ['isStudent'], changes: doc1.isStudent, type: 'delete' },
    ])
  })
})
