import { afterEach, describe, expect, test } from 'vitest'

import { InvalidChangesDetectedError, apply } from '@/diff/apply'

const deepClone = <T extends object>(obj: T) => JSON.parse(JSON.stringify(obj)) as T

/** Property names the prototype pollution tests probe for on `Object.prototype` */
const PROBE_KEYS = ['pollutedByApply', 'pollutedDeeper', 'pollutedLeaf', 'pollutedAfterSafeEntry']

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

  describe('prototype pollution', () => {
    // A regression writes the probe key onto `Object.prototype`, where it would leak into every
    // later test in the worker and turn one failure into many. Clean it up so failures stay readable.
    afterEach(() => {
      for (const key of PROBE_KEYS) {
        delete (Object.prototype as Record<string, unknown>)[key]
      }
    })

    test.each([['__proto__'], ['constructor'], ['prototype']])(
      'rejects a changeset whose path starts with `%s`',
      (segment) => {
        expect(() => apply({}, [{ path: [segment, 'pollutedByApply'], changes: 'yes', type: 'add' }])).toThrowError(
          new RegExp(`unsafe segment "${segment}"`),
        )
        expect(({} as Record<string, unknown>).pollutedByApply).toBeUndefined()
      },
    )

    test('rejects an unsafe segment that sits deeper in the path', () => {
      const doc = { info: {} }

      expect(() =>
        apply(doc, [{ path: ['info', '__proto__', 'pollutedDeeper'], changes: 'yes', type: 'add' }]),
      ).toThrowError(InvalidChangesDetectedError)
      expect(({} as Record<string, unknown>).pollutedDeeper).toBeUndefined()
    })

    test('rejects an unsafe segment as the last path entry', () => {
      const doc = {}

      expect(() =>
        apply(doc, [{ path: ['__proto__'], changes: { pollutedLeaf: 'yes' }, type: 'update' }]),
      ).toThrowError(InvalidChangesDetectedError)
      expect(Object.getPrototypeOf(doc)).toBe(Object.prototype)
      expect(({} as Record<string, unknown>).pollutedLeaf).toBeUndefined()
    })

    test('leaves the document untouched when a later entry carries an unsafe segment', () => {
      const doc = { name: 'John' }

      expect(() =>
        apply(doc, [
          { path: ['age'], changes: 25, type: 'add' },
          { path: ['__proto__', 'pollutedAfterSafeEntry'], changes: 'yes', type: 'add' },
        ]),
      ).toThrowError(InvalidChangesDetectedError)
      expect(doc).toEqual({ name: 'John' })
    })

    test('reports the full path alongside the offending segment', () => {
      expect(() => apply({}, [{ path: ['info', 'constructor'], changes: 'yes', type: 'add' }])).toThrowError(
        'Process aborted. Path info.constructor contains the unsafe segment "constructor", which can modify the prototype chain',
      )
    })
  })
})
