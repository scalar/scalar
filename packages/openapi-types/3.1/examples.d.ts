import type { ExampleObject } from './example'
import type { ReferenceObject } from './reference'
export type ExamplesObject = {
  example?: unknown
  examples?: Record<string, ExampleObject | ReferenceObject>
}
