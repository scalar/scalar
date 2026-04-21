import type { ExampleObject } from './example'
import type { ReferenceObject } from './reference'

/**
 * Constrains `example` and `examples` to be mutually exclusive.
 * The spec states these fields SHALL NOT both be present simultaneously.
 */
export type ExampleXorExamplesObject =
  | { example?: unknown; examples?: never }
  | { examples?: Record<string, ExampleObject | ReferenceObject>; example?: never }
