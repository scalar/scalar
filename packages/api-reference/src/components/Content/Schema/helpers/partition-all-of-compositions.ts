import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { mergeAllOfSchemas } from './merge-all-of-schemas'
import { type CompositionKeyword } from './schema-composition'

type ChoiceKeyword = Extract<CompositionKeyword, 'oneOf' | 'anyOf'>

/** An ordered piece of an `allOf`: either a merged object or a choice picker. */
export type AllOfSegment =
  | { kind: 'object'; schema: SchemaObject }
  | {
      kind: 'choice'
      composition: ChoiceKeyword
      /** A minimal schema carrying only this group's composition, for SchemaComposition */
      value: SchemaObject
      /** Ordinal among choice members, matching the request-example composition key */
      choiceIndex: number
    }

const CHOICE_KEYWORDS: ChoiceKeyword[] = ['oneOf', 'anyOf']

type Member =
  | { kind: 'object'; schema: SchemaObject }
  | { kind: 'choice'; composition: ChoiceKeyword; value: SchemaObject }

/**
 * Flattens a member's own (non-composition) properties and every `oneOf`/`anyOf`
 * group it declares — recursing into nested `allOf` — into a flat, ordered list,
 * preserving source order so choice groups stay where they were authored.
 *
 * Pure-constraint keywords (`not`, `if/then/else`) are dropped: they carry no
 * visual variant and Scalar would otherwise render `not` as a bogus picker. The
 * rule still lives in the schema (validation) and in field descriptions.
 */
const collectMembers = (schema: SchemaObject, out: Member[]): void => {
  const {
    allOf,
    oneOf,
    anyOf,
    not: _not,
    if: _if,
    then: _then,
    else: _else,
    ...rest
  } = schema as SchemaObject & {
    allOf?: unknown[]
    oneOf?: unknown[]
    anyOf?: unknown[]
    not?: unknown
    if?: unknown
    then?: unknown
    else?: unknown
  }

  if (Object.keys(rest).length > 0) {
    out.push({ kind: 'object', schema: rest as SchemaObject })
  }

  for (const keyword of CHOICE_KEYWORDS) {
    const value = keyword === 'oneOf' ? oneOf : anyOf
    if (Array.isArray(value) && value.length > 0) {
      out.push({ kind: 'choice', composition: keyword, value: { [keyword]: value } as SchemaObject })
    }
  }

  if (Array.isArray(allOf)) {
    for (const rawMember of allOf) {
      if (rawMember && typeof rawMember === 'object') {
        collectMembers(resolve.schema(rawMember) as SchemaObject, out)
      }
    }
  }
}

/**
 * Splits an `allOf` schema into an ordered list of segments so the renderer can
 * show each `oneOf`/`anyOf` group as its own picker **in the position it was
 * declared**, with the surrounding plain fields around it.
 *
 * `mergeAllOfSchemas` alone keeps only the FIRST `oneOf`/`anyOf` (dropping the
 * 2nd+ groups of an object with several independent mutually-exclusive
 * selections) and, being a merge, also loses the ordering between fields and
 * choices. Walking the members in order fixes both: runs of consecutive object
 * members are merged into one object segment, and each choice member becomes its
 * own picker segment in place.
 */
export const partitionAllOfCompositions = (schema: SchemaObject | undefined): { segments: AllOfSegment[] } => {
  if (!schema) {
    return { segments: [] }
  }

  // The schema's own (non-composition) keys, minus its top-level `oneOf`/`anyOf`
  // — those are rendered as their own composition by the caller, not here.
  const {
    allOf,
    oneOf: _oneOf,
    anyOf: _anyOf,
    not: _not,
    if: _if,
    then: _then,
    else: _else,
    ...rest
  } = schema as SchemaObject & {
    allOf?: unknown[]
    oneOf?: unknown[]
    anyOf?: unknown[]
    not?: unknown
    if?: unknown
    then?: unknown
    else?: unknown
  }

  if (!Array.isArray(allOf)) {
    return { segments: [{ kind: 'object', schema: schema }] }
  }

  const members: Member[] = []
  if (Object.keys(rest).length > 0) {
    members.push({ kind: 'object', schema: rest as SchemaObject })
  }
  for (const rawMember of allOf) {
    if (rawMember && typeof rawMember === 'object') {
      collectMembers(resolve.schema(rawMember) as SchemaObject, members)
    }
  }

  // Coalesce consecutive object members into a single merged object segment,
  // keeping choice members as their own segments between them.
  const segments: AllOfSegment[] = []
  let objectRun: SchemaObject[] = []
  let choiceIndex = 0

  const flushObjectRun = () => {
    if (objectRun.length === 0) {
      return
    }
    const merged = objectRun.length === 1 ? objectRun[0]! : mergeAllOfSchemas({ allOf: objectRun } as SchemaObject)
    segments.push({ kind: 'object', schema: merged })
    objectRun = []
  }

  for (const member of members) {
    if (member.kind === 'object') {
      objectRun.push(member.schema)
    } else {
      flushObjectRun()
      segments.push({
        kind: 'choice',
        composition: member.composition,
        value: member.value,
        choiceIndex: choiceIndex++,
      })
    }
  }
  flushObjectRun()

  return { segments }
}
