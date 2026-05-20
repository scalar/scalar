import { describe, expectTypeOf, it } from 'vitest'

import { coerce } from '@/coerce'
import { type Schema, array, intersection, lazy, literal, number, object, optional, string, union } from '@/schema'

describe('coerce.types', () => {
  it('infers primitive static types', () => {
    expectTypeOf(coerce(number(), 1)).toEqualTypeOf<number>()
    expectTypeOf(coerce(string(), 'x')).toEqualTypeOf<string>()
  })

  it('infers object static types', () => {
    const schema = object({
      id: number(),
      name: string(),
    })

    expectTypeOf(coerce(schema, { id: 1, name: 'Ada' })).toEqualTypeOf<{ id: number; name: string }>()
  })

  it('infers optional object property static types', () => {
    const schema = object({
      id: number(),
      name: optional(string()),
    })

    expectTypeOf(coerce(schema, { id: 1 })).toEqualTypeOf<
      {
        id: number
      } & {
        name?: string
      }
    >()
    expectTypeOf(coerce(schema, { id: 1, name: 'Ada' })).toEqualTypeOf<
      {
        id: number
      } & {
        name?: string | undefined
      }
    >()
  })

  it('infers array static types', () => {
    const schema = array(number())

    expectTypeOf(coerce(schema, [1, 2])).toEqualTypeOf<number[]>()
  })

  it('infers union static types', () => {
    const schema = union([literal('get'), literal('post')] as const)

    expectTypeOf(coerce(schema, 'get')).toEqualTypeOf<'get' | 'post'>()
    expectTypeOf(coerce(schema, 'post')).toEqualTypeOf<'get' | 'post'>()
  })

  it('infers intersection static types', () => {
    const schema = intersection([object({ a: number() }), object({ b: string() })])

    expectTypeOf(coerce(schema, { a: 1, b: 'x' })).toEqualTypeOf<{ a: number } & { b: string }>()
  })

  it('infers union of lazy intersection branches without hitting depth limit', () => {
    const doc = intersection([object({ type: literal('document') })])
    const desc = intersection([object({ type: literal('text') })])
    const entry = union([lazy(() => doc), lazy(() => desc)] as const)

    expectTypeOf(coerce(entry, { type: 'document' })).toEqualTypeOf<{ type: 'document' } | { type: 'text' }>()
    expectTypeOf(coerce(entry, { type: 'text' })).toEqualTypeOf<{ type: 'document' } | { type: 'text' }>()
  })

  it('infers static types for mapped literal unions', () => {
    const methods = ['get', 'post'] as const
    const methodSchema = union(methods.map((method) => literal(method)))

    expectTypeOf(coerce(methodSchema, 'get')).toEqualTypeOf<'get' | 'post'>()
    expectTypeOf(coerce(methodSchema, 'post')).toEqualTypeOf<'get' | 'post'>()
  })

  it('widens to any when the schema parameter is the full Schema union', () => {
    const schema = number() as Schema

    expectTypeOf(coerce(schema, 1)).toBeAny
  })

  it('infers lazy self-referential object static types', () => {
    const TNode = lazy(() =>
      object({
        name: string(),
        child: optional(lazy(() => TNode)),
      }),
    )

    type Node = {
      name: string
    } & {
      child?: Node | undefined
    }

    const result = coerce(TNode, { name: 'root' })

    expectTypeOf(result).toEqualTypeOf<Node>()
    expectTypeOf(result.name).toBeString
    expectTypeOf(result.child).toEqualTypeOf<Node | undefined>()
  })

  it('infers mutually-recursive lazy schema static types', () => {
    const SchemaA = lazy(() =>
      object({
        kind: literal('a'),
        next: optional(lazy(() => SchemaB)),
      }),
    )
    const SchemaB = lazy(() =>
      object({
        kind: literal('b'),
        next: optional(lazy(() => SchemaA)),
      }),
    )

    type A = {
      kind: 'a'
      next?: B | undefined
    }
    type B = {
      kind: 'b'
      next?: A | undefined
    }
    const fromA = coerce(SchemaA, { kind: 'a' }) as A
    const fromB = coerce(SchemaB, { kind: 'b' }) as B

    expectTypeOf(fromA).toEqualTypeOf<A>()
    expectTypeOf(fromA.kind).toEqualTypeOf<'a'>()
    expectTypeOf(fromA.next).toEqualTypeOf<B | undefined>()
    expectTypeOf(fromB).toEqualTypeOf<B>()
    expectTypeOf(fromB.kind).toEqualTypeOf<'b'>()
    expectTypeOf(fromB.next).toEqualTypeOf<A | undefined>()
  })

  it('infers lazy schema static types nested in object properties', () => {
    const TreeNode = object({
      id: number(),
      children: optional(array(lazy(() => TreeNode))),
    })

    const schema = object({
      root: TreeNode,
    })

    type TreeNode = {
      id: number
    } & {
      children?: TreeNode[] | undefined
    }

    const result = coerce(schema, { root: { label: 'root' } })

    expectTypeOf(result).toEqualTypeOf<{
      root: TreeNode
    }>()
  })
})
