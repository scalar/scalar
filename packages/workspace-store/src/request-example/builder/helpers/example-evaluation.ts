import type { DynamicScope } from '@/helpers/dynamic-ref'
import type { SchemaObject } from '@/schemas/v3.1/strict/openapi-document'

/** Schema provenance collected only when a format needs more than the generated data. */
export type ExampleEvaluation = {
  schema: SchemaObject
  value: unknown
  origin: 'generated' | 'example' | 'default' | 'const' | 'enum' | 'variable'
  path: string[]
  name?: string
  dynamicScope: DynamicScope
  children: ExampleEvaluation[]
}

/** Per-call capture state; never shared with the JSON result cache. */
export type ExampleEvaluationState = {
  stack: ExampleEvaluation[]
  root?: ExampleEvaluation
}

/** Internal option: keep the default JSON generation path free of provenance allocations. */
export const EXAMPLE_EVALUATION = Symbol('example-evaluation')

/** Record precedence decisions without allocating metadata on the default JSON path. */
export const setExampleOrigin = (
  state: ExampleEvaluationState | undefined,
  origin: ExampleEvaluation['origin'],
): void => {
  const current = state?.stack.at(-1)
  if (current) {
    current.origin = origin
  }
}
