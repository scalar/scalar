import { describe, expect, it } from 'vitest'

import { coerceWithoutScoreMemoization } from '../test/non-memoized-coerce'
import { coerce } from './coerce'
import {
  type Schema,
  array,
  evaluate,
  intersection,
  lazy,
  literal,
  number,
  object,
  optional,
  record,
  string,
  union,
  unknown,
} from './schema'

/** Serialize graph edges, not only values, so shared identity and cycles participate in equality. */
const graphShape = (input: unknown): unknown => {
  const ids = new WeakMap<object, number>()
  const queue: object[] = []
  const encode = (value: unknown): unknown => {
    if (value === null || typeof value !== 'object') {
      return { type: typeof value, value }
    }
    const existing = ids.get(value)
    if (existing !== undefined) {
      return { ref: existing }
    }
    const id = queue.length
    ids.set(value, id)
    queue.push(value)
    return { ref: id }
  }
  const root = encode(input)
  const nodes = []
  for (const value of queue) {
    nodes.push({
      array: Array.isArray(value),
      entries: Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, encode(child)]),
    })
  }
  return { root, nodes }
}

/** Inputs omit selected, so its coerced literal reveals the chosen branch without affecting its score. */
const recursiveSchema = (variant: number, reversed: boolean): Schema => {
  const node: Schema = lazy(() => {
    const branches = ['a', 'b'].map((kind, index) => {
      const base = object({
        kind: variant === 1 ? union([literal(kind), literal(`${kind}!`)]) : literal(kind),
        selected: literal(index),
        next: optional(variant === 2 ? evaluate((value) => value, node) : node),
        weight: variant === 3 ? optional(number()) : number(),
        shared: optional(record(string(), unknown())),
        list: optional(array(unknown())),
      })
      return variant === 3 ? intersection([base, object({ note: optional(literal(kind)) })]) : base
    })
    return union(reversed ? branches.reverse() : branches)
  })
  return node
}

const buildGraph = (size: number, links: number, values: number, prefix: boolean): Record<string, unknown> => {
  const shared = { extra: false }
  const nodes: Record<string, unknown>[] = Array.from({ length: size }, (_, index) => ({
    kind: ['a', 'b', 'missing'][(values >> (index * 2)) % 3],
    weight: index % 2 ? 'invalid' : index,
    shared,
    list: [shared],
  }))
  for (let index = 0; index < size; index++) {
    const target = Math.floor(links / (size + 1) ** index) % (size + 1)
    if (target < size) {
      nodes[index]!.next = nodes[target]
    }
  }
  return prefix ? { kind: 'b', weight: 0, next: nodes[0], shared, list: [shared] } : nodes[0]!
}

describe('coerce-differential', () => {
  it.each([0, 1, 2, 3])(
    'matches independent non-memoized branch selection for recursive schema variant %s',
    (variant) => {
      let cases = 0
      for (const reversed of [false, true]) {
        const schema = recursiveSchema(variant, reversed)
        for (let size = 1; size <= 3; size++) {
          // Exhaust all one-edge graphs: missing links, self-loops, rings, tails, and shared targets.
          for (let links = 0; links < (size + 1) ** size; links++) {
            for (const values of [0, 1, 5, 10]) {
              for (const prefix of [false, true]) {
                const input = buildGraph(size, links, values, prefix)
                const before = graphShape(input)
                const reference = coerceWithoutScoreMemoization(schema, input)
                const actual = coerce(schema, input)
                expect(
                  graphShape(actual),
                  `variant=${variant}, reversed=${reversed}, size=${size}, links=${links}, values=${values}, prefix=${prefix}`,
                ).toStrictEqual(graphShape(reference))
                expect(graphShape(input)).toStrictEqual(before)
                cases++
              }
            }
          }
        }
      }
      expect(cases).toBe(1200)
    },
  )

  it('matches stable fresh-object evaluate expressions without sharing identities across calls', () => {
    const schema = array(
      union([
        evaluate((value) => ({ item: value }), object({ item: number(), selected: literal('number') })),
        evaluate((value) => ({ item: value }), object({ item: literal('a'), selected: literal('a') })),
      ]),
    )
    const input = [0, 'a', false, null, { nested: true }]
    expect(graphShape(coerce(schema, input))).toStrictEqual(graphShape(coerceWithoutScoreMemoization(schema, input)))
  })
})
