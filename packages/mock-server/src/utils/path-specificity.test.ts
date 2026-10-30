import { describe, expect, it } from 'vitest'

import { comparePathSpecificity, getPathSpecificity } from './path-specificity'

/** Sort path keys the way the mock server registers them, most specific first. */
const sortBySpecificity = (paths: string[]): string[] =>
  [...paths].sort((a, b) => comparePathSpecificity(getPathSpecificity(a), getPathSpecificity(b)))

describe('path-specificity', () => {
  describe('getPathSpecificity', () => {
    it('ranks literal segments as the most specific', () => {
      expect(getPathSpecificity('/pets/mine')).toStrictEqual([0, 0, 0])
    })

    it('ranks a bare template as the least specific', () => {
      expect(getPathSpecificity('/pets/{petId}')).toStrictEqual([0, 0, 2])
    })

    it('ranks consecutive templates without literal text like a bare template', () => {
      expect(getPathSpecificity('/users/{userId}{postId}')).toStrictEqual([0, 0, 2])
    })

    it('ranks a template mixed with literal text the router enforces in between', () => {
      expect(getPathSpecificity('/jobs/{jobId}:cancel')).toStrictEqual([0, 0, 1])
      expect(getPathSpecificity('/api/v-{version}')).toStrictEqual([0, 0, 1])
    })

    it('ranks a mixed segment the router matches against any value like a bare template', () => {
      // These compile to the whole-segment parameters `:name.json` and `:a-:b`, which match anything.
      expect(getPathSpecificity('/files/{name}.json')).toStrictEqual([0, 0, 2])
      expect(getPathSpecificity('/files/{a}-{b}')).toStrictEqual([0, 0, 2])
    })

    it('ranks literal text the router has to escape as a literal', () => {
      expect(getPathSpecificity('/users:batchGet')).toStrictEqual([0, 0])
      expect(getPathSpecificity('/reports*')).toStrictEqual([0, 0])
    })

    it('ranks a stray brace as literal text', () => {
      expect(getPathSpecificity('/odd/{open')).toStrictEqual([0, 0, 0])
    })

    it('ignores the query string of a path key', () => {
      expect(getPathSpecificity('/v1/models/{model_id}?beta=true')).toStrictEqual([0, 0, 0, 2])
    })
  })

  describe('comparePathSpecificity', () => {
    it('puts a concrete path before its templated counterpart in either order', () => {
      expect(sortBySpecificity(['/pets/{petId}', '/pets/mine'])).toStrictEqual(['/pets/mine', '/pets/{petId}'])
      expect(sortBySpecificity(['/pets/mine', '/pets/{petId}'])).toStrictEqual(['/pets/mine', '/pets/{petId}'])
    })

    it('lets the first segment that differs decide', () => {
      expect(sortBySpecificity(['/a/{x}/b', '/a/literal/{y}'])).toStrictEqual(['/a/literal/{y}', '/a/{x}/b'])
      expect(sortBySpecificity(['/{entity}/me', '/books/{id}'])).toStrictEqual(['/books/{id}', '/{entity}/me'])
    })

    it('puts a mixed segment between a literal and a bare template', () => {
      expect(sortBySpecificity(['/jobs/{jobId}', '/jobs/{jobId}:cancel', '/jobs/batch:cancel'])).toStrictEqual([
        '/jobs/batch:cancel',
        '/jobs/{jobId}:cancel',
        '/jobs/{jobId}',
      ])
    })

    it('keeps the document order of paths that rank the same', () => {
      expect(sortBySpecificity(['/files/{id}', '/files/{name}.json'])).toStrictEqual([
        '/files/{id}',
        '/files/{name}.json',
      ])
      expect(sortBySpecificity(['/b/{id}', '/a/{id}'])).toStrictEqual(['/b/{id}', '/a/{id}'])
    })

    it('puts the shorter of two paths first when one ranks like the start of the other', () => {
      expect(comparePathSpecificity(getPathSpecificity('/pets'), getPathSpecificity('/pets/{petId}'))).toBeLessThan(0)
      expect(comparePathSpecificity(getPathSpecificity('/pets/{petId}'), getPathSpecificity('/pets'))).toBeGreaterThan(
        0,
      )
    })
  })
})
