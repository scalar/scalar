import type { ReferenceObject as GeneratedReferenceObject } from './index.generated'

export type ReferenceObject = GeneratedReferenceObject

/** Resolved reference: either the value or a `$ref` with its resolved `$ref-value`. */
export type ReferenceType<Value> = Value | (ReferenceObject & { '$ref-value': Value })
