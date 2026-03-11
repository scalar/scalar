import { expect, it } from 'vitest'

import { syncParametersForPathChange } from '@/mutators/operation/helpers/sync-path-parameters'
import type { ReferenceType } from '@/schemas/v3.1/strict/reference'

type TestParameter = {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  description?: string
  required?: boolean
}

type RefNode = { $ref: string }

it('keeps a referenced path parameter as $ref in the returned array', () => {
  const references: Record<string, TestParameter> = {
    '#/components/parameters/IdParam': {
      name: 'id',
      in: 'path',
      required: true,
      description: 'User identifier',
    },
  }

  const parameters: ReferenceType<TestParameter>[] = [
    { $ref: '#/components/parameters/IdParam' } as RefNode as ReferenceType<TestParameter>,
    { name: 'format', in: 'query' } as TestParameter as ReferenceType<TestParameter>,
  ]

  const result = syncParametersForPathChange('/users/{id}', '/users/{id}', parameters, (node) => {
    if ('$ref' in (node as RefNode)) {
      return references[(node as RefNode).$ref]!
    }

    return node as TestParameter
  })

  expect(result).toEqual([{ $ref: '#/components/parameters/IdParam' }, { name: 'format', in: 'query' }])
  expect(result[0]).not.toHaveProperty('name')
})

it('keeps multiple referenced path parameters as $ref values', () => {
  const references: Record<string, TestParameter> = {
    '#/components/parameters/UserIdParam': {
      name: 'userId',
      in: 'path',
      required: true,
    },
    '#/components/parameters/PostIdParam': {
      name: 'postId',
      in: 'path',
      required: true,
    },
  }

  const parameters: ReferenceType<TestParameter>[] = [
    { $ref: '#/components/parameters/UserIdParam' } as RefNode as ReferenceType<TestParameter>,
    { $ref: '#/components/parameters/PostIdParam' } as RefNode as ReferenceType<TestParameter>,
    { name: 'format', in: 'query' } as TestParameter as ReferenceType<TestParameter>,
  ]

  const result = syncParametersForPathChange(
    '/users/{userId}/posts/{postId}',
    '/users/{userId}/posts/{postId}',
    parameters,
    (node) => {
      if ('$ref' in (node as RefNode)) {
        return references[(node as RefNode).$ref]!
      }

      return node as TestParameter
    },
  )

  expect(result).toEqual([
    { $ref: '#/components/parameters/UserIdParam' },
    { $ref: '#/components/parameters/PostIdParam' },
    { name: 'format', in: 'query' },
  ])
  expect(result[0]).not.toHaveProperty('in')
  expect(result[1]).not.toHaveProperty('in')
})

it('keeps referenced path parameters as $ref when adding new path variables', () => {
  const references: Record<string, TestParameter> = {
    '#/components/parameters/IdParam': {
      name: 'id',
      in: 'path',
      required: true,
    },
  }

  const parameters: ReferenceType<TestParameter>[] = [
    { $ref: '#/components/parameters/IdParam' } as RefNode as ReferenceType<TestParameter>,
    { name: 'format', in: 'query' } as TestParameter as ReferenceType<TestParameter>,
  ]

  const result = syncParametersForPathChange('/users/{id}/posts/{postId}', '/users/{id}', parameters, (node) => {
    if ('$ref' in (node as RefNode)) {
      return references[(node as RefNode).$ref]!
    }

    return node as TestParameter
  })

  expect(result).toEqual([
    { $ref: '#/components/parameters/IdParam' },
    { name: 'format', in: 'query' },
    { name: 'postId', in: 'path' },
  ])
  expect(result[0]).not.toHaveProperty('name')
})
