import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject, SchemaReferenceType } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { type ConstraintSchema, schemaDialect } from '../constraint-metadata'
import { hasSchemaConstraints } from './has-schema-constraints'
import { mergeAllOfSchemas } from './merge-all-of-schemas'
import type { CompositionKeyword } from './schema-composition'

type ChoiceKeyword = Extract<CompositionKeyword, 'oneOf' | 'anyOf'>

/** An ordered piece of an `allOf`: either a merged object or a choice picker. */
type AllOfSegment =
  | { kind: 'object'; schema: SchemaObject }
  | {
      kind: 'choice'
      composition: ChoiceKeyword
      /** A minimal schema carrying only this group's composition, for SchemaComposition */
      value: SchemaObject
      /** Ordinal among choice members, matching the request-example composition key */
      choiceIndex: number
    }

/** Preserve the entire conditional group at its original schema boundary. */
const preserveConstraints = (source: ConstraintSchema, rest: SchemaObject): ConstraintSchema =>
  source[schemaDialect] && source[schemaDialect] !== 'unsupported'
    ? {
        ...rest,
        [schemaDialect]: source[schemaDialect],
        ...(source.if !== undefined ? { if: source.if, then: source.then, else: source.else } : {}),
      }
    : rest

const CHOICE_KEYWORDS: ChoiceKeyword[] = ['oneOf', 'anyOf']

type Member =
  | { kind: 'object'; schema: SchemaObject }
  | { kind: 'standalone'; schema: SchemaObject }
  | { kind: 'choice'; composition: ChoiceKeyword; value: SchemaObject; inheritedSelection: boolean }

/**
 * Flattens a member's own (non-composition) properties and every `oneOf`/`anyOf`
 * group it declares — recursing into nested `allOf` — into a flat, ordered list,
 * preserving source order so choice groups stay where they were authored.
 *
 * Recognized constraint members stay separate so unrelated conditions cannot merge.
 * Other pure constraints keep the existing OpenAPI display behavior.
 */
const collectMembers = (
  input: SchemaReferenceType<SchemaObject> | boolean,
  out: Member[],
  seenRefs: Set<string>,
): void => {
  const target = getResolvedRef(input)
  if (typeof target === 'boolean') {
    // Keep the explanation separate: merging it with an object's description would hide it.
    out.push({ kind: 'standalone', schema: resolve.schema(target) })
    return
  }
  const schema = resolve.schema(input)
  const {
    allOf,
    oneOf,
    anyOf,
    not: _not,
    if: _if,
    then: _then,
    else: _else,
    ...rest
  }: SchemaObject & {
    allOf?: unknown[]
    oneOf?: unknown[]
    anyOf?: unknown[]
    not?: unknown
    if?: unknown
    then?: unknown
    else?: unknown
  } = schema

  const view = preserveConstraints(schema, rest)
  if (Object.keys(view).length > 0) {
    out.push({ kind: hasSchemaConstraints(view) ? 'standalone' : 'object', schema: view })
  }

  for (const keyword of CHOICE_KEYWORDS) {
    const value = keyword === 'oneOf' ? oneOf : anyOf
    // A variant inherits its base fields through allOf, but the base's choice
    // containing that variant has already been selected. Rendering it again
    // would re-enter the variant and expose fields from the other branches.
    const selectsAncestor =
      Array.isArray(value) &&
      value.some((branch) => {
        const ref = branch && typeof branch === 'object' && '$ref' in branch ? branch.$ref : undefined
        return typeof ref === 'string' && seenRefs.has(ref)
      })
    if (Array.isArray(value) && value.length > 0) {
      out.push({
        kind: 'choice',
        composition: keyword,
        value: { [keyword]: value } as unknown as SchemaObject,
        inheritedSelection: selectsAncestor,
      })
    }
  }

  if (Array.isArray(allOf)) {
    for (const rawMember of allOf) {
      if (typeof rawMember === 'boolean' || (rawMember && typeof rawMember === 'object')) {
        const resolved: SchemaObject & { $ref?: string } = resolve.schema(rawMember)
        // Break `$ref` cycles reached through `allOf` (e.g. a member that
        // references an ancestor). Without this guard a recursive `allOf`
        // schema would recurse forever. `mergeAllOfSchemas` guards the same way.
        const ref = resolved.$ref
        if (typeof ref === 'string') {
          if (seenRefs.has(ref)) {
            continue
          }
          collectMembers(rawMember, out, new Set(seenRefs).add(ref))
        } else {
          collectMembers(rawMember, out, seenRefs)
        }
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
  }: SchemaObject & {
    allOf?: unknown[]
    oneOf?: unknown[]
    anyOf?: unknown[]
    not?: unknown
    if?: unknown
    then?: unknown
    else?: unknown
  } = schema

  if (!Array.isArray(allOf)) {
    return { segments: [{ kind: 'object', schema: schema }] }
  }

  const members: Member[] = []
  const view = preserveConstraints(schema, rest)
  if (Object.keys(view).length > 0) {
    members.push({ kind: hasSchemaConstraints(view) ? 'standalone' : 'object', schema: view })
  }
  const schemaRef = '$ref' in schema ? schema.$ref : undefined
  const seenRefs = new Set<string>(typeof schemaRef === 'string' ? [schemaRef] : [])
  for (const rawMember of allOf) {
    if (typeof rawMember === 'boolean' || (rawMember && typeof rawMember === 'object')) {
      const resolved: SchemaObject & { $ref?: string } = resolve.schema(rawMember)
      const ref = resolved.$ref
      collectMembers(rawMember, members, typeof ref === 'string' ? new Set(seenRefs).add(ref) : seenRefs)
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
    } else if (member.kind === 'standalone') {
      flushObjectRun()
      segments.push({ kind: 'object', schema: member.schema })
    } else if (member.inheritedSelection) {
      // Hidden inherited choices still occupy an ordinal in the request example.
      choiceIndex++
    } else {
      flushObjectRun()
      // `choiceIndex` is the ordinal used to build the composition-selection key
      // that syncs each picker with the request example. It MUST stay aligned
      // with the ordinal computed while walking `allOf` in
      // `get-example-from-schema.ts` (`@scalar/workspace-store`), or a picker and
      // its generated example fall out of sync.
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
