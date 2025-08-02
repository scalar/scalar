import { diff } from '@/diff'
import { describe, expect, test } from 'vitest'

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
