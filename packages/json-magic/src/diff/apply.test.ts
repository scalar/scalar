import { apply, InvalidChangesDetectedError } from '@/diff/apply'
import { describe, expect, test } from 'vitest'

const deepClone = <T extends object>(obj: T) => JSON.parse(JSON.stringify(obj)) as T

describe('apply', () => {
  describe('should apply `add` operations', () => {
    test('should apply `add` operation correctly', () => {
      const doc = {
        name: 'John',
        age: 25,
      }

      const docCopy = deepClone(doc)
      const location = { city: 'New York', street: '5th Avenue' }

      expect(apply(doc, [{ path: ['location'], changes: location, type: 'add' }])).toEqual({
        ...docCopy,
        location,
      })
    })

    test('should apply `add` operation on deeply nested objects correctly', () => {
      const doc = {
        name: 'John',
        age: 25,
        location: {
          city: 'New York',
          street: '5th Avenue',
        },
      }

      const docCopy = deepClone(doc)
      const coordinates = { lat: 40.7128, long: 74.006 }

      expect(
        apply(doc, [
          {
            path: ['location', 'coordinates'],
            changes: coordinates,
            type: 'add',
          },
        ]),
      ).toEqual({
        ...docCopy,
        location: {
          ...docCopy.location,
          coordinates,
        },
      })
    })
  })

  describe('should apply `update` operation', () => {
    test('should apply `update` operation correctly', () => {
      const doc = {
        name: 'John',
        age: 25,
        location: {
          city: 'New York',
          street: '5th Avenue',
        },
      }
      const docCopy = deepClone(doc)
      const updatedAge = 26

      expect(apply(doc, [{ path: ['age'], changes: updatedAge, type: 'update' }])).toEqual({
        ...docCopy,
        age: updatedAge,
      })
    })

    test('should apply `update` operation correctly on nested objects', () => {
      const doc = {
        name: 'John',
        age: 25,
        location: {
          city: 'New York',
          street: '5th Avenue',
        },
      }

      const docCopy = deepClone(doc)
      const updatedCity = 'Boston'

      expect(apply(doc, [{ path: ['location', 'city'], changes: updatedCity, type: 'update' }])).toEqual({
        ...docCopy,
        location: { ...docCopy.location, city: updatedCity },
      })
    })
  })

  describe('should apply `delete` operation', () => {
    test('should apply `delete` operation correctly', () => {
      const doc2 = {
        name: 'John',
        age: 25,
      }

      const doc1 = {
        ...doc2,
        location: {
          city: 'New York',
          street: '5th Avenue',
        },
      }

      expect(apply(doc1, [{ path: ['location'], changes: doc1.location, type: 'delete' }])).toEqual(doc2)
    })

    test('should apply `delete` operation correctly on nested objects', () => {
      const doc2 = {
        name: 'John',
        age: 25,
        location: {
          city: 'New York',
        },
      }

      const doc1 = {
        ...doc2,
        location: {
          ...doc2.location,
          street: '5th Avenue',
        },
      }

      expect(
        apply(doc1, [
          {
            path: ['location', 'street'],
            changes: doc1.location.street,
            type: 'delete',
          },
        ]),
      ).toEqual(doc2)
    })
  })

  describe('should throw on incorrect diff', () => {
    test('wrong nested key', () => {
      const doc = {
        name: 'John',
        age: 25,
        location: {
          city: 'New York',
          street: '5th Avenue',
        },
      }

      expect(() =>
        apply(doc, [
          {
            path: ['location', 'city', 'something'],
            changes: { test: 1 },
            type: 'add',
          },
        ]),
      ).toThrow(InvalidChangesDetectedError)
    })

    test('wrong non existing path', () => {
      const doc = {
        name: 'John',
        age: 25,
        location: {
          city: 'New York',
          street: '5th Avenue',
        },
      }

      expect(() =>
        apply(doc, [
          {
            path: ['location', 'coordinates', 'lang'],
            changes: 41.25,
            type: 'add',
          },
        ]),
      ).toThrow(InvalidChangesDetectedError)
    })
  })

  describe('should correctly handle arrays', () => {
    test('should correctly apply `add` changes on an array', () => {
      const doc = {
        name: 'John',
        age: 25,
        location: {
          city: 'New York',
          street: '5th Avenue',
        },
        hobbies: ['swimming'],
      }

      const docCopy = deepClone(doc)
      const newHobby = 'coding'

      expect(
        apply(doc, [
          {
            path: ['hobbies', '1'],
            changes: newHobby,
            type: 'add',
          },
        ]),
      ).toEqual({ ...docCopy, hobbies: [...docCopy.hobbies, newHobby] })
    })
  })

  test('should correctly apply `update` changes on an array', () => {
    const doc = {
      name: 'John',
      age: 25,
      location: {
        city: 'New York',
        street: '5th Avenue',
      },
      hobbies: ['swimming', 'fish', 'coding'],
    }

    const docCopy = deepClone(doc)
    const updatedHobby = 'running'
    docCopy.hobbies[1] = updatedHobby

    expect(
      apply(doc, [
        {
          path: ['hobbies', '1'],
          changes: updatedHobby,
          type: 'update',
        },
      ]),
    ).toEqual(docCopy)
  })

  test('should correctly apply `delete` changes on an array', () => {
    const doc = {
      name: 'John',
      age: 25,
      location: {
        city: 'New York',
        street: '5th Avenue',
      },
      hobbies: ['swimming', 'fish', 'coding'],
    }

    const docCopy = deepClone(doc)
    // Perform the delete operation
    docCopy.hobbies.splice(1, 1)

    expect(
      apply(doc, [
        {
          path: ['hobbies', '1'],
          changes: doc.hobbies[1],
          type: 'delete',
        },
      ]),
    ).toEqual(docCopy)
  })
})
